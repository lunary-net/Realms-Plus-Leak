const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, PermissionsBitField, ComponentType, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");
const mongoose = require("mongoose");
const axios = require('axios');
const { v4: uuidv4 } = require("uuid");
const serverDB = require("../models/serverDB");
const statsDB = require("../models/statsDB");
const discordDB = require("../models/discordDB");
const { RED, WHITE, YELLOW } = require("../utility/colors");
const { getModulesEmoji } = require("../functions/getModulesEmoji");
const { minecraft, load, alert, warn, reply, greencheck, redcross, automod, chat, settings, xbox, playstation, windows, nintendo, android, ios, unknown } = require("../utility/emojis");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("config")
        .setDescription("Configure Realms+")
        .addSubcommand(subcommand =>
            subcommand
                .setName("modules")
                .setDescription("Configure Realms+ Modules")
                .addStringOption(option =>
                    option
                        .setName("toggle")
                        .setDescription("Enable / Disable the modules you select.")
                        .setRequired(true)
                        .addChoices(
                            { name: "Enable", value: "enable" },
                            { name: "Disable", value: "disable" }
                        ))
                .addStringOption(option =>
                    option
                        .setName("device-filter")
                        .setDescription("Config the device filter?")
                        .setRequired(false)
                        .addChoices(
                            { name: "True", value: "true" }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName("realm")
                .setDescription("Configure which realms the bot has access to.")
                .addStringOption(option =>
                    option
                        .setName("client-type")
                        .setDescription("Choose either the Realms+ Bot or your Main Account as the account used to join a realm.")
                        .setRequired(true)
                        .addChoices(
                            { name: "Realms+ Bot", value: "bot" },
                            //{ name: "Main Account", value: "main" }
                        )
                )
                .addStringOption(option =>
                    option
                        .setName("chat-type")
                        .setDescription("The chat type of your realm (If you use Chat Ranks, select GameTest")
                        .setRequired(true)
                        .addChoices(
                            { name: "Normal", value: "normal" },
                            { name: "GameTest", value: "gameTest" }
                        )
                )
                .addStringOption(option =>
                    option
                        .setName("discord-invite")
                        .setDescription("The invite to your discord server, will appear on Kick messages.")
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option
                        .setName("kick-message")
                        .setDescription("Custom Kick Message. (TIP: use \"\\n\" to create a new line.)")
                        .setMinLength(1)
                        .setMaxLength(20)
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("reset")
                .setDescription("Reset config settings for this server.")
                .addStringOption(option =>
                    option
                        .setName("type")
                        .setDescription("Select the config option to reset.")
                        .setRequired(true)
                        .addChoices(
                            { name: "Configed Realms", value: "configuredRealms" },
                            { name: "Realms+ Modules", value: "configuredModules" },
                            )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("lockdown")
                .setDescription("Config the Lockdown Settings for when its enabled.")
                .addStringOption(option =>
                    option
                        .setName("tag")
                        .setDescription("The Staff / Admin tag on your realm. All users without this will be teleported during lockdown.")
                        .setRequired(true)
                )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName("anti-alt")
                    .setDescription("Configure the Anti Alt Settings.")
                    .addIntegerOption(option =>
                        option
                            .setName("min-friends")
                            .setDescription("Minimum amount of friends required for a user to join.")
                            .setRequired(true)
                    )
                    .addIntegerOption(option =>
                        option
                            .setName("min-followers")
                            .setDescription("Minimum amount of followers required for a user to join.")
                            .setRequired(true)
                    )
                    .addIntegerOption(option =>
                        option
                            .setName("min-gamerscore")
                            .setDescription("Minimum amount of gamerscore required for a user to join.")
                            .setRequired(true)
                    )
                )
            .addSubcommand(option =>
                option
                    .setName("chat-filter")
                    .setDescription("Configure the Chat Filter settings for a selected realm.")
                    .addStringOption(option =>
                        option
                            .setName("banned-words")
                            .setDescription("Set banned words for a realm. Separate each word with a comma like so: meanie, dumb")
                            .setRequired(false)
                    )
                    .addStringOption(option =>
                        option
                            .setName("banned-links")
                            .setDescription("Separate each link with a comma like so: https://realms.gg, https://discord.gg")
                    )
                )
            .addSubcommand(option =>
                option
                    .setName("check")
                    .setDescription("Check the current config settings and realms for this server.")
            ),
        
                        

    async execute(interaction) {
        try {
            if (interaction.options.getSubcommand() === "modules") {
                if (mongoose.connection.readyState !== 1) {
                    return await interaction.reply({ content: `${alert} Database connection failed, please try again later.` });
                }
                let serverData = await serverDB.findOne({ serverID: interaction.guild.id });
                if (!serverData) {
                    return await interaction.reply({ content: `${alert} This server has no data, please run </link:1219001806256869396>` });
                }
                if (serverData.hasLinked === false) {
                    return await interaction.reply({ content: `${alert} The server owner has not linked their account yet, please run </link:1219001806256869396>` });
                }
                const memberRoles = interaction.member.roles.cache;
                const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
                const roleWithPerms = serverData.rolePermissions.some(role => memberRoles.has(role.roleID) && role.permissions.configPerms == true);
                if (!isAdmin && !roleWithPerms) {
                    return interaction.reply({ content: `${alert} You don't have permission to use \`/config modules\`.`, ephemeral: true });
                }

                const value = interaction.options.getString("toggle");
                const filter = interaction.options.getString("device-filter");

                const embed1 = new EmbedBuilder()
                    .setColor("Yellow")
                    .setTitle(`${automod} | Realms+ Modules`)
                    .setDescription(`${reply} Fetching Guild Info ${load}`)
                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                await interaction.reply({ embeds: [embed1] });

                if (serverData.configedRealms.length === 0) {
                    const failEmbed = new EmbedBuilder()
                        .setColor("Red")
                        .setTitle(`${automod} | Realms+ Modules`)
                        .setDescription(`${reply} No Configed Realms Found! Please run \`/config realm\``)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.editReply({ embeds: [failEmbed] });
                    return;
                }

                const moduleMenu = new StringSelectMenuBuilder()
                    .setCustomId("moduleMenu")
                    .setPlaceholder("Select an option")
                    .setMaxValues(10)
                    .setMinValues(1)
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel("[DISCORD] Ban Module")
                            .setValue("discordBanModule")
                            .setDescription("Auto-Ban discord users in our database from your server.")
                            .setEmoji(automod),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("[REALM] Auto Ban From DB")
                            .setValue("autoBanFromDB")
                            .setDescription("Auto-Ban realm players in our database from your server.")
                            .setEmoji(automod),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("[REALM] Skin Filter")
                            .setValue("moderateSkins")
                            .setDescription("Blocks invis + unfair sized skins on your realm.")
                            .setEmoji(automod),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("[REALM] Chat Filter")
                            .setValue("chatFilter")
                            .setDescription("Block certain words/links based on the config settings for this module.")
                            .setEmoji(automod),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("[REALM] Anti Alt Accounts")
                            .setValue("moderateAlts")
                            .setDescription("Block possible alt accounts from entering your realm.")
                            .setEmoji(automod),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("[REALM] Anti Fly Hacks")
                            .setValue("moderateMovement")
                            .setDescription("Auto-Kick users fly hacking from your realm.")
                            .setEmoji(automod),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("[REALM] Anti Chat Spam")
                            .setValue("moderateChat")
                            .setDescription("Protection against `* External` chat spam")
                            .setEmoji(automod),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("[REALM] Anti Spoof")
                            .setValue("antiSpoof")
                            .setDescription("Auto-Kick users spoofing devices + usernames")
                            .setEmoji(automod),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("[REALM] Auto Reconnect")
                            .setValue("autoReconnect")
                            .setDescription("Realms+ will connect to your realm automatically upon crash / restart.")
                            .setEmoji(automod),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("[REALM] Bot Mitigation")
                            .setValue("moderateBots")
                            .setDescription("Auto-Kick possible bots from your realm.")
                            .setEmoji(automod)
                        /*
                        new StringSelectMenuOptionBuilder()
                            .setLabel("[REALM] Anti Crash")
                            .setValue("moderateEmotes")
                            .setDescription("Block possible crash attempts from affecting the realm.")
                            .setEmoji(automod)
                            */
                    );

                    const filterMenu = new StringSelectMenuBuilder()
                        .setCustomId("filterMenu")
                        .setPlaceholder("Select the device type(s)")
                        .setMaxValues(7)
                        .setMinValues(1)
                        .addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel("Xbox")
                                .setValue("xbox")
                                .setDescription("Auto-Kick Xbox Users.")
                                .setEmoji(xbox),
                            new StringSelectMenuOptionBuilder()
                                .setLabel("Playstation")
                                .setValue("playstation")
                                .setDescription("Auto-Kick Playstation Users.")
                                .setEmoji(playstation),
                            new StringSelectMenuOptionBuilder()
                                .setLabel("Nintendo")
                                .setValue("nintendo")
                                .setDescription("Auto-Kick Nintendo Users.")
                                .setEmoji(nintendo),
                            new StringSelectMenuOptionBuilder()
                                .setLabel("IOS")
                                .setValue("ios")
                                .setDescription("Auto-Kick IOS Users.")
                                .setEmoji(ios),
                            new StringSelectMenuOptionBuilder()
                                .setLabel("Windows")
                                .setValue("windows")
                                .setDescription("Auto-Kick Windows Users.")
                                .setEmoji(windows),
                            new StringSelectMenuOptionBuilder()
                                .setLabel("Android")
                                .setValue("android")
                                .setDescription("Auto-Kick Android Users.")
                                .setEmoji(android),
                            new StringSelectMenuOptionBuilder()
                                .setLabel("Unknown")
                                .setValue("unknown")
                                .setDescription("Auto-Kick Unknown Users.")
                                .setEmoji(unknown)
                        );

                    const row1 = new ActionRowBuilder()
                        .addComponents(moduleMenu);

                    const row2 = new ActionRowBuilder()
                        .addComponents(filterMenu);

                    if (filter === "true") {
                        const embed2 = new EmbedBuilder()
                            .setColor("Orange")
                            .setTitle(`${automod} | Realms+ Modules`)
                            .setDescription(`${reply} Select the device filters to \`${value}\``)
                            .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                        await interaction.editReply({ embeds: [embed2], components: [row2] });
                    } else {
                        const embed3 = new EmbedBuilder()
                            .setColor("Orange")
                            .setTitle(`${automod} | Realms+ Modules`)
                            .setDescription(`${reply} Select the modules to \`${value}\``)
                            .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                        await interaction.editReply({ embeds: [embed3], components: [row1] });
                    }

                    var collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 30000 });

                    collector.on("collect", async (interaction) => {
                        let outcomes = [];
                        if (interaction.customId === "moduleMenu") {
                            const selectedModules = interaction.values;
                            for (const module of selectedModules) {
                                switch (value) {
                                    case "enable":
                                        switch (module) {
                                            case "discordBanModule":
                                                if (serverData.discordBanModule === true) {
                                                    outcomes.push(`${redcross} \`${module}\` is already enabled.`)
                                                } else {
                                                    serverData.discordBanModule = true;
                                                    outcomes.push(`${greencheck} \`${module}\` has been enabled.`)
                                                    await serverData.save();

                                                    // initiate ban module first time
                                                    const serverMembers = await interaction.guild.members.fetch();

                                                    serverMembers.forEach(async (member) => {
                                                        try {
                                                            const memberData = await discordDB.findOne({
                                                                userID: member.id
                                                            });

                                                            if (memberData) {
                                                                const dmEmbed = new EmbedBuilder()
                                                                    .setColor("Red")
                                                                    .setTitle(`${warn} | Ban Notice`)
                                                                    .setDescription(`You have been banned from **${member.guild.name}** for being found in our database.\n**Database Reason:** \`${memberData.reason}\`\n\nYou may make an appeal to be removed from our database [here](https://discord.gg/Zh6SW8bZqg), or you can dm [NoVa Gh0ul](https://discord.com/users/907712767644020787)\n\nhave a nice day :D`)
                                                                    .setThumbnail(process.env.ICON_URL)

                                                                await member.send({ embeds: [dmEmbed] });
                                                                await interaction.guild.members.ban(member);

                                                                if (serverData.logs.autoMod !== "0") {
                                                                    const channelId = serverData.logs.autoMod.channelID;
                                                                    const channel = interaction.client.channels.cache.get(channelId);
                                                                    const logEmbed = new EmbedBuilder()
                                                                        .setColor("Orange")
                                                                        .setTitle(`${warn} R+ Auto Ban`)
                                                                        .setDescription(`Discord Ban Module has been triggered!\n\n**Banned User:** <@${member.id}>\n**Database ID:** \`${memberData.dbid}\`\n**Reason:** Found in the database for: \`${memberData.reason}\``)
                                                                        .setThumbnail(member.displayAvatarURL({ dynamic: true }))

                                                                    
                                                                        if (channel) {
                                                                            channel.send({ embeds: [logEmbed] });
                                                                        }
                                                                }
                                                            }
                                                        } catch (error) {
                                                            console.log("Error occurred while trying to ban a user (discordBanModule): ", error)
                                                        }
                                                    });
                                                }
                                                break
                                            case "autoBanFromDB":
                                                if (serverData.autoBanFromDB === true) {
                                                    outcomes.push(`${redcross} \`${module}\` is already enabled.`)
                                                } else {
                                                    serverData.autoBanFromDB = true;
                                                    outcomes.push(`${greencheck} \`${module}\` has been enabled.`)
                                                    await serverData.save();
                                                }
                                                break
                                            case "moderateSkins":
                                                if (serverData.moderateSkins === true) {
                                                    outcomes.push(`${redcross} \`${module}\` is already enabled.`)
                                                } else {
                                                    serverData.moderateSkins = true;
                                                    outcomes.push(`${greencheck} \`${module}\` has been enabled.`)
                                                    await serverData.save();
                                                }
                                                break
                                            case "moderateAlts":
                                                if (serverData.moderateAlts === true) {
                                                    outcomes.push(`${redcross} \`${module}\` is already enabled.`)
                                                } else {
                                                    serverData.moderateAlts = true;
                                                    outcomes.push(`${greencheck} \`${module}\` has been enabled.`)
                                                    await serverData.save();
                                                }
                                                break
                                            case "moderateMovement":
                                                if (serverData.moderateMovement === true) {
                                                    outcomes.push(`${redcross} \`${module}\` is already enabled.`)
                                                } else {
                                                    serverData.moderateMovement = true;
                                                    outcomes.push(`${greencheck} \`${module}\` has been enabled.`)
                                                    await serverData.save();
                                                }
                                                break
                                            case "moderateChat":
                                                if (serverData.moderateChat === true) {
                                                    outcomes.push(`${redcross} \`${module}\` is already enabled.`)
                                                } else {
                                                    serverData.moderateChat = true;
                                                    outcomes.push(`${greencheck} \`${module}\` has been enabled.`)
                                                    await serverData.save();
                                                }
                                                break
                                            case "moderateBots":
                                                if (serverData.moderateBots === true) {
                                                    outcomes.push(`${redcross} \`${module}\` is already enabled.`)
                                                } else {
                                                    serverData.moderateBots = true;
                                                    outcomes.push(`${greencheck} \`${module}\` has been enabled.`)
                                                    await serverData.save();
                                                }
                                                break
                                            case "moderateEmotes":
                                                if (serverData.moderateEmotes === true) {
                                                    outcomes.push(`${redcross} \`${module}\` is already enabled.`)
                                                } else {
                                                    serverData.moderateEmotes = true;
                                                    outcomes.push(`${greencheck} \`${module}\` has been enabled.`)
                                                    await serverData.save();
                                                }
                                                break
                                            case "antiSpoof":
                                                if (serverData.antiSpoof === true) {
                                                    outcomes.push(`${redcross} \`${module}\` is already enabled.`)
                                                } else {
                                                    serverData.antiSpoof = true;
                                                    outcomes.push(`${greencheck} \`${module}\` has been enabled.`)
                                                    await serverData.save();
                                                }
                                                break
                                            case "autoReconnect":
                                                if (serverData.autoReconnect === true) {
                                                    outcomes.push(`${redcross} \`${module}\` is already enabled.`)
                                                } else {
                                                    serverData.autoReconnect = true;
                                                    outcomes.push(`${greencheck} \`${module}\` has been enabled.`)
                                                    await serverData.save();
                                                }
                                                break
                                            case "chatFilter":
                                                if (serverData.chatFilter === true) {
                                                    outcomes.push(`${redcross} \`${module}\` is already enabled.`)
                                                } else {
                                                    serverData.chatFilter = true;
                                                    outcomes.push(`${greencheck} \`${module}\` has been enabled.`)
                                                    await serverData.save();
                                                }
                                                break;
                                        }
                                        break;
                                    case "disable":
                                        switch (module) {
                                            case "discordBanModule":
                                                if (serverData.discordBanModule === false) {
                                                    outcomes.push(`${redcross} \`${module}\` is already disabled.`)
                                                } else {
                                                    serverData.discordBanModule = false;
                                                    outcomes.push(`${greencheck} \`${module}\` has been disabled.`)
                                                    await serverData.save();
                                                }
                                                break
                                            case "autoBanFromDB":
                                                if (serverData.autoBanFromDB === false) {
                                                    outcomes.push(`${redcross} \`${module}\` is already disabled.`)
                                                } else {
                                                    serverData.autoBanFromDB = false;
                                                    outcomes.push(`${greencheck} \`${module}\` has been disabled.`)
                                                    await serverData.save();
                                                }
                                                break
                                            case "moderateSkins":
                                                if (serverData.moderateSkins === false) {
                                                    outcomes.push(`${redcross} \`${module}\` is already disabled.`)
                                                } else {
                                                    serverData.moderateSkins = false;
                                                    outcomes.push(`${greencheck} \`${module}\` has been disabled.`)
                                                    await serverData.save();
                                                }
                                                break
                                            case "moderateAlts":
                                                if (serverData.moderateAlts === false) {
                                                    outcomes.push(`${redcross} \`${module}\` is already disabled.`)
                                                } else {
                                                    serverData.moderateAlts = false;
                                                    outcomes.push(`${greencheck} \`${module}\` has been disabled.`)
                                                    await serverData.save();
                                                }
                                                break
                                            case "moderateMovement":
                                                if (serverData.moderateMovement === false) {
                                                    outcomes.push(`${redcross} \`${module}\` is already disabled.`)
                                                } else {
                                                    serverData.moderateMovement = false;
                                                    outcomes.push(`${greencheck} \`${module}\` has been disabled.`)
                                                    await serverData.save();
                                                }
                                                break
                                            case "moderateChat":
                                                if (serverData.moderateChat === false) {
                                                    outcomes.push(`${redcross} \`${module}\` is already disabled.`)
                                                } else {
                                                    serverData.moderateChat = false;
                                                    outcomes.push(`${greencheck} \`${module}\` has been disabled.`)
                                                    await serverData.save();
                                                }
                                                break
                                            case "moderateBots":
                                                if (serverData.moderateBots === false) {
                                                    outcomes.push(`${redcross} \`${module}\` is already disabled.`)
                                                } else {
                                                    serverData.moderateBots = false;
                                                    outcomes.push(`${greencheck} \`${module}\` has been disabled.`)
                                                    await serverData.save();
                                                }
                                                break
                                            case "moderateEmotes":
                                                if (serverData.moderateEmotes === false) {
                                                    outcomes.push(`${redcross} \`${module}\` is already disabled.`)
                                                } else {
                                                    serverData.moderateEmotes = false;
                                                    outcomes.push(`${greencheck} \`${module}\` has been disabled.`)
                                                    await serverData.save();
                                                }
                                                break
                                            case "antiSpoof":
                                                if (serverData.antiSpoof === false) {
                                                    outcomes.push(`${redcross} \`${module}\` is already disabled.`)
                                                } else {
                                                    serverData.antiSpoof = false;
                                                    outcomes.push(`${greencheck} \`${module}\` has been disabled.`)
                                                    await serverData.save();
                                                }
                                                break
                                            case "autoReconnect":
                                                if (serverData.autoReconnect === false) {
                                                    outcomes.push(`${redcross} \`${module}\` is already disabled.`)
                                                } else {
                                                    serverData.autoReconnect = false;
                                                    outcomes.push(`${greencheck} \`${module}\` has been disabled.`)
                                                    await serverData.save();
                                                }
                                                break
                                            case "chatFilter":
                                                if (serverData.chatFilter === false) {
                                                    outcomes.push(`${redcross} \`${module}\` is already disabled.`)
                                                } else {
                                                    serverData.chatFilter = false;
                                                    outcomes.push(`${greencheck} \`${module}\` has been disabled.`)
                                                    await serverData.save();
                                                }
                                                break;
                                        }
                                        break;
                                }
                            }
                            const embed4 = new EmbedBuilder()
                                .setColor("#00FF00")
                                .setTitle(`${automod} | Realms+ Modules`)
                                .setDescription(`${reply} Settings Saved.\n\n**Result:**\n${outcomes.join("\n")}`)
                                .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                            await interaction.update({ embeds: [embed4], components: [] });
                            return collector.stop();
                        } else if (interaction.customId === "filterMenu") {
                            const selectedDevices = interaction.values;
                            for (const device of selectedDevices) {
                                switch (value) {
                                    case "enable":
                                        switch (device) {
                                            case "xbox":
                                                if (serverData.moderateDevices.Xbox === true) {
                                                    outcomes.push(`${redcross} Moderate \`${device}\` devices is already enabled.`)
                                                } else {
                                                    serverData.moderateDevices.Xbox = true;
                                                    outcomes.push(`${greencheck} Moderate \`${device}\` devices has been enabled.`)
                                                }
                                                break
                                            case "playstation":
                                                if (serverData.moderateDevices.Playstation === true) {
                                                    outcomes.push(`${redcross} Moderate \`${device}\` devices is already enabled.`)
                                                } else {
                                                    serverData.moderateDevices.Playstation = true;
                                                    outcomes.push(`${greencheck} Moderate \`${device}\` devices has been enabled.`)
                                                }
                                                break
                                            case "nintendo":
                                                if (serverData.moderateDevices.Nintendo === true) {
                                                    outcomes.push(`${redcross} Moderate \`${device}\` devices is already enabled.`)
                                                } else {
                                                    serverData.moderateDevices.Nintendo = true;
                                                    outcomes.push(`${greencheck} Moderate \`${device}\` devices has been enabled.`)
                                                }
                                                break
                                            case "windows":
                                                if (serverData.moderateDevices.Windows === true) {
                                                    outcomes.push(`${redcross} Moderate \`${device}\` devices is already enabled.`)
                                                } else {
                                                    serverData.moderateDevices.Windows = true;
                                                    outcomes.push(`${greencheck} Moderate \`${device}\` devices has been enabled.`)
                                                }
                                                break
                                            case "ios":
                                                if (serverData.moderateDevices.IOS === true) {
                                                    outcomes.push(`${redcross} Moderate \`${device}\` devices is already enabled.`)
                                                } else {
                                                    serverData.moderateDevices.IOS = true;
                                                    outcomes.push(`${greencheck} Moderate \`${device}\` devices has been enabled.`)
                                                }
                                                break
                                            case "android":
                                                if (serverData.moderateDevices.Android === true) {
                                                    outcomes.push(`${redcross} Moderate \`${device}\` devices is already enabled.`)
                                                } else {
                                                    serverData.moderateDevices.Android = true;
                                                    outcomes.push(`${greencheck} Moderate \`${device}\` devices has been enabled.`)
                                                }
                                                break
                                            case "unknown":
                                                if (serverData.moderateDevices.Unknown === true) {
                                                    outcomes.push(`${redcross} Moderate \`${device}\` devices is already enabled.`)
                                                } else {
                                                    serverData.moderateDevices.Unknown = true;
                                                    outcomes.push(`${greencheck} Moderate \`${device}\` devices has been enabled.`)
                                                }
                                                break
                                        }
                                        break
                                    case "disable":
                                        switch (device) {
                                            case "xbox":
                                                if (serverData.moderateDevices.Xbox === false) {
                                                    outcomes.push(`${redcross} Moderate \`${device}\` devices is already disabled.`)
                                                } else {
                                                    serverData.moderateDevices.Xbox = false;
                                                    outcomes.push(`${greencheck} Moderate \`${device}\` devices has been disabled.`)
                                                }
                                                break
                                            case "playstation":
                                                if (serverData.moderateDevices.Playstation === false) {
                                                    outcomes.push(`${redcross} Moderate \`${device}\` devices is already disabled.`)
                                                } else {
                                                    serverData.moderateDevices.Playstation = false;
                                                    outcomes.push(`${greencheck} Moderate \`${device}\` devices has been disabled.`)
                                                }
                                                break
                                            case "nintendo":
                                                if (serverData.moderateDevices.Nintendo === false) {
                                                    outcomes.push(`${redcross} Moderate \`${device}\` devices is already disabled.`)
                                                } else {
                                                    serverData.moderateDevices.Nintendo = false;
                                                    outcomes.push(`${greencheck} Moderate \`${device}\` devices has been disabled.`)
                                                }
                                                break
                                            case "windows":
                                                if (serverData.moderateDevices.Windows === false) {
                                                    outcomes.push(`${redcross} Moderate \`${device}\` devices is already disabled.`)
                                                } else {
                                                    serverData.moderateDevices.Windows = false;
                                                    outcomes.push(`${greencheck} Moderate \`${device}\` devices has been disabled.`)
                                                }
                                                break
                                            case "ios":
                                                if (serverData.moderateDevices.IOS === false) {
                                                    outcomes.push(`${redcross} Moderate \`${device}\` devices is already disabled.`)
                                                } else {
                                                    serverData.moderateDevices.IOS = false;
                                                    outcomes.push(`${greencheck} Moderate \`${device}\` devices has been disabled.`)
                                                }
                                                break
                                            case "android":
                                                if (serverData.moderateDevices.Android === false) {
                                                    outcomes.push(`${redcross} Moderate \`${device}\` devices is already disabled.`)
                                                } else {
                                                    serverData.moderateDevices.Android = false;
                                                    outcomes.push(`${greencheck} Moderate \`${device}\` devices has been disabled.`)
                                                }
                                                break
                                            case "unknown":
                                                if (serverData.moderateDevices.Unknown === false) {
                                                    outcomes.push(`${redcross} Moderate \`${device}\` devices is already disabled.`)
                                                } else {
                                                    serverData.moderateDevices.Unknown = false;
                                                    outcomes.push(`${greencheck} Moderate \`${device}\` devices has been disabled.`)
                                                }
                                                break
                                        }
                                        break
                                }
                                await serverData.save();
                            }
                            
                        }
                        const embed5 = new EmbedBuilder()
                                .setColor("#00FF00")
                                .setTitle(`${automod} | Realms+ Modules`)
                                .setDescription(`${reply} Settings Saved.\n\n**Result:**\n${outcomes.join("\n")}`)
                                .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                            await interaction.update({ embeds: [embed5], components: [] });
                            return collector.stop();
                    });

                    collector.on("end", () => {
                        return collector.stop();
                    });

                    
                } else if (interaction.options.getSubcommand() === "realm") {
                    try {
                        let serverData = await serverDB.findOne({ serverID: interaction.guild.id });
                        if (!serverData) {
                            return await interaction.reply({ content: `${alert} No server data found, please run </link:1219001806256869396>` });
                        }
                        if (serverData.hasLinked === false) {
                            return await interaction.reply({ content: `${alert} The server owner has not linked their account yet, please run </link:1219001806256869396>` });
                        }
                        const memberRoles = interaction.member.roles.cache;
                        const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
                        const roleWithPerms = serverData.rolePermissions.some(role => memberRoles.has(role.roleID) && role.permissions.configPerms == true);
                        if (!isAdmin && !roleWithPerms) {
                            return interaction.reply({ content: `${alert} You don't have permission to use \`/config realm\`.`, ephemeral: true });
                        }

                        const bot = interaction.options.getString("client-type");
                        const chat_type = interaction.options.getString("chat-type");
                        const discordInvite = interaction.options.getString("discord-invite") || "https://discord.gg/Zh6SW8bZqg";
                        const kickMsg = interaction.options.getString("kick-message");
                        let statsData = await statsDB.findOne({ query: "global" });

                        const initialEmbed = new EmbedBuilder()
                            .setColor("#FFF68F")
                            .setTitle(`${minecraft} | Realm Config`)
                            .setDescription(`${reply} Fetching Guild Info ${load}`)
                            .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                        await interaction.reply({ embeds: [initialEmbed], ephemeral: false });

                        const configRealmMenu = new StringSelectMenuBuilder()
                            .setCustomId("configRealmMenu")
                            .setPlaceholder("Select a realm")
                            .setMaxValues(1)
                            .setMinValues(1);
                        for (const realm of serverData.ownedRealms) {
                            configRealmMenu.addOptions(
                                new StringSelectMenuOptionBuilder()
                                    .setLabel(realm.name)
                                    .setValue(realm.id.toString())
                            );
                        }
                        const row = new ActionRowBuilder()
                            .addComponents(configRealmMenu);

                        const configEmbed = new EmbedBuilder()
                            .setColor("Orange")
                            .setTitle(`${minecraft} | Realm Config`)
                            .setDescription(`${reply} Select the realm you want to configure.`)
                            .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                        await interaction.editReply({ embeds: [configEmbed], components: [row] });

                        var collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 30000 });

                        collector.on("collect", async (interaction) => {
                            if (!interaction.isStringSelectMenu()) return;
                            if (interaction.customId === "configRealmMenu") {

                                const realmId = interaction.values[0];
                                const selectedRealm = serverData.ownedRealms.flat().find(realm => realm.id.toString() === realmId);

                                if (!selectedRealm) {
                                    const errorEmbed = new EmbedBuilder()
                                        .setColor("Red")
                                        .setTitle("<:redcross:1215428093167009862> | Invalid Selection")
                                        .setDescription(`> Realm \`${realmId}\` not found.`)
                                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                                    await interaction.update({ embeds: [errorEmbed] });
                                    return collector.stop();
                                }
                                if (serverData.configedRealms.some(realm => realm.realmID === realmId)) {
                                    const errorEmbed = new EmbedBuilder()
                                        .setColor("Red")
                                        .setTitle(`${redcross} | Error`)
                                        .setDescription(`${reply} \`${selectedRealm.name}\` is already configured.`)
                                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                                    await interaction.update({ embeds: [errorEmbed], components: [] });
                                    return collector.stop();
                                }

                                let usingBotAccount = null;
                                if (bot === "bot") {
                                    usingBotAccount = true;
                                } else if (bot === "main") {
                                    usingBotAccount = false;
                                }
                                await serverDB.findOneAndUpdate({ serverID: interaction.guild.id }, {
                                    $set: {
                                        configedRealms: [
                                            ...serverData.configedRealms,
                                            {
                                                realmID: selectedRealm.id,
                                                realmName: selectedRealm.name,
                                                clubID: selectedRealm.clubId,
                                                settings: {
                                                    botAccount: usingBotAccount,
                                                    chatType: chat_type,
                                                    lockdown: false,
                                                    adminTag: "none",
                                                    worldSpawn: { x: 0, y: 0, z: 0 },
                                                    MinFriends: 0,
                                                    MinFollowers: 0,
                                                    MinGamerscore: 0,
                                                    discordInvite: discordInvite,
                                                    bannedWords: [],
                                                    bannedLinks: [],
                                                    kickMessage: kickMsg
                                                }
                                            }
                                        ]
                                    }
                                });

                                statsData.configedRealms += 1;
                                await statsData.save();

                                const response1 = await axios.post(
                                    "https://user.auth.xboxlive.com/user/authenticate",
                                    {
                                      Properties: {
                                        AuthMethod: "RPS",
                                        RpsTicket:
                                          serverData.linkData.accessToken,
                                        SiteName: "user.auth.xboxlive.com",
                                      },
                                      RelyingParty:
                                        "http://auth.xboxlive.com",
                                      TokenType: "JWT",
                                    }
                                  );
                                const response2 = await axios.post('https://xsts.auth.xboxlive.com/xsts/authorize', {
                                    Properties: {
                                        SandboxId: 'RETAIL',
                                        UserTokens: [response1.data.Token],
                                    },
                                    RelyingParty: "http://xboxlive.com",
                                    TokenType: 'JWT',
                                });
                                const xbox_token = response2.data.Token;
                                const xbox_hash = response2.data.DisplayClaims.xui[0].uhs;
                                const content_restrictions = "eyJ2ZXJzaW9uIjoyLCJkYXRhIjp7Imdlb2dyYXBoaWNSZWdpb24iOiJVUyIsIm1heEFnZVJhdGluZyI6MjU1LCJwcmVmZXJyZWRBZ2VSYXRpbmciOjI1NSwicmVzdHJpY3RQcm9tb3Rpb25hbENvbnRlbnQiOmZhbHNlfX0"
                                const response3 = await axios.get(`https://clubhub.xboxlive.com/clubs/Ids(${selectedRealm.clubId})/decoration/clubPresence`, {
                                    headers: {
                                        "x-xbl-contract-version": 4,
                                        "Accept-Encoding": "gzip; q=1.0, deflate; q=0.5, identity; q=0.1",
                                        "x-xbl-contentrestrictions": content_restrictions,
                                        "Signature": "",
                                        "Cache-Control": "no-store, must-revalidate, no-cache",
                                        "Accept": "application/json",
                                        "X-XblCorrelationId": uuidv4(),
                                        "PRAGMA": "no-cache",
                                        "Accept-Language": "en-US, en",
                                        "Authorization": `XBL3.0 x=${xbox_hash};${xbox_token}`,
                                        "Host": "clubhub.xboxlive.com",
                                        "Connection": "Keep-Alive"
                                    }
                                });

                                const ClubPfp = response3.data.clubs[0].profile.displayImageUrl.value
                                const RealmMembers = response3.data.clubs[0].membersCount;


                                // Inviting the ARASR8261 Account to the Selected Realm
                                // response4 authenticates to minecraft with the Realm Owners account to get the invite code
                                const response4 = await axios.post(
                                    "https://xsts.auth.xboxlive.com/xsts/authorize",
                                    {
                                      Properties: {
                                        SandboxId: "RETAIL",
                                        UserTokens: [response1.data.Token],
                                      },
                                      RelyingParty:
                                        "https://pocket.realms.minecraft.net/",
                                      TokenType: "JWT",
                                    }
                                  );

                                  // response5 gets the invite code for this realm
                                  const realm_userhash = response4.data.DisplayClaims.xui[0].uhs;
                                  const realm_token = response4.data.Token;
                                  const response5 = await axios.get(`https://pocket.realms.minecraft.net/links/v1?worldId=${selectedRealm.id.toString()}`, {
                                    headers: {
                                        "Accept": "*/*",
                                        "Authorization": `XBL3.0 x=${realm_userhash};${realm_token}`,
                                        "Cache-Control": "no-cache",
                                        "Charset": "utf-8",
                                        "Client-Version": process.env.CLIENT_VERSION,
                                        "User-Agent": "MCPE/UWP",
                                        "Accept-Language": "en-GB",
                                        "Accept-Encoding": "gzip, deflate, br",
                                        "Host": "pocket.realms.minecraft.net",
                                        "Content-Length": "0",
                                        "Connection": "Keep-Alive"
                                    }
                                  });

                                  const inviteCode = response5.data[0].url.replace("https://realms.gg/", "");

                                  const supportServerData = await serverDB.findOne({ serverID: `1173782568143966329` });

                                  // response6 authenticates the ARASR8261 account to XBL
                                  const response6 = await axios.post(
                                    "https://user.auth.xboxlive.com/user/authenticate",
                                    {
                                      Properties: {
                                        AuthMethod: "RPS",
                                        RpsTicket:
                                          supportServerData.linkData.accessToken,
                                        SiteName: "user.auth.xboxlive.com",
                                      },
                                      RelyingParty:
                                        "http://auth.xboxlive.com",
                                      TokenType: "JWT",
                                    }
                                  );

                                  // response7 authenticates the ARASR8261 account to Minecraft Services
                                  const response7 = await axios.post(
                                    "https://xsts.auth.xboxlive.com/xsts/authorize",
                                    {
                                      Properties: {
                                        SandboxId: "RETAIL",
                                        UserTokens: [response6.data.Token],
                                      },
                                      RelyingParty:
                                        "https://pocket.realms.minecraft.net/",
                                      TokenType: "JWT",
                                    }
                                  );

                                  const BotAccountRealmHash = response7.data.DisplayClaims.xui[0].uhs;
                                  const BotAccountRealmToken = response7.data.Token;

                                  // response8 sends an invite to the ARASR8261 account with the Realm Owners authed account
                                  const response8 = await axios.put(`https://pocket.realms.minecraft.net/invites/${selectedRealm.id.toString()}/invite/update`, {
                                    "invites": {
                                        "2535428798750708": "ADD"
                                    }
                                }, {
                                    headers: {
                                        "Accept": "*/*",
                                        "Authorization": `XBL3.0 x=${realm_userhash};${realm_token}`,
                                        "Client-Version": process.env.CLIENT_VERSION,
                                        "User-Agent": "MCPE/UWP",
                                        "Accept-Language": "en-GB, en",
                                        "Accept-Encoding": "gzip, deflate, be",
                                        "Host": "pocket.realms.minecraft.net",
                                    }
                                });

                                try {

                                    
                                    // AcceptInvite auto accepts the invite so the ARASR8261 account is in the realm
                                    var AcceptInvite = {
                                        method: "post",
                                        url: `https://pocket.realms.minecraft.net/invites/v1/link/accept/${inviteCode}`,
                                        headers: {
                                            "Accept": "*/*",
                                            "Authorization": `XBL3.0 x=${BotAccountRealmHash};${BotAccountRealmToken}`,
                                            "Cache-Control": "no-cache",
                                            "Charset": "utf-8",
                                            "Client-Version": process.env.CLIENT_VERSION,
                                            "User-Agent": "MCPE/UWP",
                                            "Accept-Language": "en-US",
                                            "Accept-Encoding": "gzip, deflate, br",
                                        },
                                    }

                                    await axios(AcceptInvite)
                                  } catch (error) {
                                    console.log(error);
                                  }

                                  const savedEmbed = new EmbedBuilder()
                                        .setColor("#08F704")
                                        .setAuthor({ name: `Realm Linked`, iconURL: process.env.ICON_URL })
                                        .setDescription(`${reply} \`${selectedRealm.name}\` has been linked to Realms+ ${greencheck}\n**Realm Members:** \`${RealmMembers}\`\n**Client Type:** \`${bot}\`\n**Chat Type:** \`${chat_type}\`\n**Discord Invite:** \`${discordInvite}\`\n**Kick Message:** \`${kickMsg}\``)
                                        .setThumbnail(ClubPfp)
                                        .setFooter({ text: `Realms+ commands will now have access to this realm!` })

                                    await interaction.update({ embeds: [savedEmbed], components: [] });
                                    return collector.stop();
                            }
                        });

                        collector.on("end", () => {
                            return collector.stop();
                        });
                    } catch (error) {
                        console.log(error);
                        const errorEmbed = new EmbedBuilder()
                            .setColor("Red")
                            .setTitle(`${redcross} | Error`)
                            .setDescription(`> An error occured while processing your request. Please try again later.`)
                            .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL })

                        await interaction.update({ embeds: [errorEmbed], components: [] });
                        return collector.stop();
                    }
                } else if (interaction.options.getSubcommand() === "reset") {
                    if (mongoose.connection.readyState !== 1) {
                        return await interaction.reply({ content: `${alert} The bot is not connected to the database, please try again in 5 seconds.`, ephemeral: true });
                    }
                    let serverData = await serverDB.findOne({ serverID: interaction.guild.id });
                    if (!serverData) {
                        return await interaction.reply({ content: `${alert} No guild info found, please run </link:1219001806256869396>`, ephemeral: true });
                    }
                    if (serverData.hasLinked === false) {
                        return await interaction.reply({ content: `${alert} The server owner has not linked their account yet, please run </link:1219001806256869396>`, ephemeral: true });
                    }
                    const memberRoles = interaction.member.roles.cache;
                    const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
                    const roleWithPerms = serverData.rolePermissions.some(role => memberRoles.has(role.roleID) && role.permissions.configPerms == true);
                    if (!isAdmin && !roleWithPerms) {
                        return interaction.reply({ content: `${alert} You don't have permission to use \`/config reset\`.`, ephemeral: true });
                    }

                    const type = interaction.options.getString("type");

                    const intialEmbed = new EmbedBuilder()
                        .setColor("Yellow")
                        .setTitle(`${minecraft} | Config Reset`)
                        .setDescription(`${reply} Fetching Guild Info ${load}`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    const sentMessage = await interaction.reply({ embeds: [intialEmbed] });

                    switch (type) {
                        case "configuredRealms":
                            serverData = await serverDB.findOneAndUpdate(
                                { serverID: interaction.guild.id },
                                { $set: {
                                    configedRealms: [],
                                } },
                                { new: true }
                            );
                            const savedEmbed = new EmbedBuilder()
                                .setColor("Green")
                                .setTitle(`${minecraft} | Config Reset`)
                                .setDescription(`${reply} Config settings for \`${type}\` have been reset ${greencheck}`)
                                .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                            return await sentMessage.edit({ embeds: [savedEmbed] });
                        case "configuredModules":
                            serverData = await serverDB.findOneAndUpdate(
                                { serverID: interaction.guild.id },
                                { $set: {
                                    moderateDevices: {
                                        Xbox: false,
                                        Playstation: false,
                                        Nintendo: false,
                                        IOS: false,
                                        Windows: false,
                                        Android: false,
                                        Unknown: false,
                                    },
                                    moderateSkins: false,
                                    moderateAlts: false,
                                    moderateMovement: false,
                                    moderateChat: false,
                                    moderateBots: false,
                                    moderateEmotes: false,
                                } },
                                { new: true }
                            );
                            await serverData.save();
                            const savedEmbed2 = new EmbedBuilder()
                                .setColor("Green")
                                .setTitle(`${minecraft} | Config Reset`)
                                .setDescription(`${reply} Config settings for \`${type}\` have been reset ${greencheck}`)
                                .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                            return await sentMessage.edit({ embeds: [savedEmbed2] });
                    }
                    
                } else if (interaction.options.getSubcommand() === "lockdown") {
                    if (mongoose.connection.readyState !== 1) {
                        return await interaction.reply({ content: `${alert} The bot is not connected to the database, please try again in 5 seconds.`, ephemeral: true });
                    }
                    let serverData = await serverDB.findOne({ serverID: interaction.guild.id });
                    if (!serverData) {
                        return await interaction.reply({ content: `${alert} No guild info found, please run </link:1219001806256869396>`, ephemeral: true });
                    }
                    if (serverData.hasLinked === false) {
                        return await interaction.reply({ content: `${alert} The server owner has not linked their account yet, please run </link:1219001806256869396>`, ephemeral: true });
                    }
                    const memberRoles = interaction.member.roles.cache;
                    const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
                    const roleWithPerms = serverData.rolePermissions.some(role => memberRoles.has(role.roleID) && role.permissions.configPerms == true);
                    if (!isAdmin && !roleWithPerms) {
                        return interaction.reply({ content: `${alert} You don't have permission to use \`/config lockdown\`.`, ephemeral: true });
                    }

                    const tag = interaction.options.getString("tag");

                    const initialEmbed = new EmbedBuilder()
                        .setColor("Yellow")
                        .setTitle(`${settings} | Config Lockdown`)
                        .setDescription(`${reply} Fetching Guild Info ${load}`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.reply({ embeds: [initialEmbed] });

                    if (serverData.configedRealms.length === 0) {
                        const errorEmbed = new EmbedBuilder()
                            .setColor("Red")
                            .setTitle(`${redcross} | Invalid Selection`)
                            .setDescription(`${reply} No realms are configured, please run \`/config realm\``)
                            .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                        return await interaction.editReply({ embeds: [errorEmbed] });
                    }

                    const lockdownMenu = new StringSelectMenuBuilder()
                        .setCustomId("lockdownMenu")
                        .setPlaceholder("Select a realm")
                        .setMaxValues(1)
                        .setMinValues(1)
                    for (const realm of serverData.configedRealms) {
                        lockdownMenu.addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel(realm.realmName)
                                .setValue(realm.realmID.toString())
                        );
                    }
                    const row = new ActionRowBuilder()
                        .addComponents(lockdownMenu);

                    const lockdownEmbed = new EmbedBuilder()
                        .setColor("Orange")
                        .setTitle(`${settings} | Config Lockdown`)
                        .setDescription(`${reply} Select a realm to manage its lockdown settings ${load}`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.editReply({ embeds: [lockdownEmbed], components: [row] });

                    var collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 30000 });

                    collector.on("collect", async (interaction) => {
                        if (!interaction.isStringSelectMenu()) return;
                        if (interaction.customId === "lockdownMenu") {
                            const realmId = interaction.values[0];
                            const selectedRealm = serverData.configedRealms.find((realm) => realm.realmID === realmId);
                            if (!selectedRealm) {
                                const errorEmbed = new EmbedBuilder()
                                    .setColor("Red")
                                    .setTitle(`${redcross} | Data Error`)
                                    .setDescription(`${reply} I was unable to retrieve data for the selected realm, please run \`/config reset\` and then \`/config realm\``)
                                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                                await interaction.update({ embeds: [errorEmbed], components: [] });
                                return collector.stop();
                            }
                            selectedRealm.settings.adminTag = tag;
                            selectedRealm.settings.worldSpawn = { x: 0, y: 0, z: 0 };
                            await serverData.save();

                            const savedEmbed = new EmbedBuilder()
                                .setColor("Green")
                                .setTitle(`${settings} | Lockdown Configured!`)
                                .setDescription(`${reply} Lockdown Settings saved for \`${selectedRealm.realmName}\` ${greencheck}\n\n**Admin Tag:** \`${tag}\``)
                                .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                            interaction.update({ embeds: [savedEmbed], components: [] });
                            return collector.stop();
                        }
                    });

                    collector.on("end", () => {
                        return collector.stop();
                    });
                } else if (interaction.options.getSubcommand() === "anti-alt") {
                    if (mongoose.connection.readyState !== 1) {
                        return await interaction.reply({ content: `${alert} The bot is not connected to the database, please try again in 5 seconds.`, ephemeral: true });
                    }
                    let serverData = await serverDB.findOne({ serverID: interaction.guild.id });
                    if (!serverData) {
                        return await interaction.reply({ content: `${alert} No guild info found, please run </link:1219001806256869396>`, ephemeral: true });
                    }
                    if (serverData.hasLinked === false) {
                        return await interaction.reply({ content: `${alert} The server owner has not linked their account yet, please run </link:1219001806256869396>`, ephemeral: true });
                    }
                    const memberRoles = interaction.member.roles.cache;
                    const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
                    const roleWithPerms = serverData.rolePermissions.some(role => memberRoles.has(role.roleID) && role.permissions.configPerms == true);
                    if (!isAdmin && !roleWithPerms) {
                        return interaction.reply({ content: `${alert} You don't have permission to use \`/config anti-alt\`.`, ephemeral: true });
                    }

                    const MinFriends = interaction.options.getInteger("min-friends");
                    const MinFollowers = interaction.options.getInteger("min-followers");
                    const MinGamerscore = interaction.options.getInteger("min-gamerscore");

                    const initialEmbed = new EmbedBuilder()
                        .setColor("Yellow")
                        .setTitle(`${settings} | Config Anti-Alt`)
                        .setDescription(`${reply} Fetching Guild Info ${load}`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.reply({ embeds: [initialEmbed] });

                    if (serverData.configedRealms.length === 0) {
                        const errorEmbed = new EmbedBuilder()
                            .setColor("Red")
                            .setTitle(`${redcross} | Invalid Selection`)
                            .setDescription(`${reply} No realms are configured, please run \`/config realm\``)
                            .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                        return await interaction.editReply({ embeds: [errorEmbed] });
                    }

                    const altMenu = new StringSelectMenuBuilder()
                        .setCustomId("altMenu")
                        .setPlaceholder("Select a realm")
                        .setMaxValues(1)
                        .setMinValues(1)
                    for (const realm of serverData.configedRealms) {
                        altMenu.addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel(realm.realmName)
                                .setValue(realm.realmID.toString())
                        );
                    };

                    const row = new ActionRowBuilder()
                        .addComponents(altMenu);

                    const embed2 = new EmbedBuilder()
                        .setColor("Orange")
                        .setTitle(`${settings} | Config Anti-Alt`)
                        .setDescription(`${reply} Select a realm below to configure Anti-Alt for`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.editReply({ embeds: [embed2], components: [row] });

                    var collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 30000 });

                    collector.on("collect", async (interaction) => {
                        if (!interaction.isStringSelectMenu()) return;
                        if (interaction.customId === "altMenu") {
                            const realmId = interaction.values[0];
                            const selectedRealm = serverData.configedRealms.find((realm) => realm.realmID === realmId);
                            if (!selectedRealm) {
                                const errorEmbed = new EmbedBuilder()
                                    .setColor("Red")
                                    .setTitle(`${redcross} | Data Error`)
                                    .setDescription(`${reply} I was unable to find the realm you selected, please run \`config realm\` again.`)
                                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                                await interaction.update({ embeds: [errorEmbed], components: [] });
                                return collector.stop();
                            }
                            selectedRealm.settings.MinFriends = MinFriends;
                            selectedRealm.settings.MinFollowers = MinFollowers;
                            selectedRealm.settings.MinGamerscore = MinGamerscore;
                            await serverData.save();

                            const savedEmbed = new EmbedBuilder()
                                .setColor("Green")
                                .setTitle(`Configured Anti-Alt!`)
                                .setDescription(`Saved Anti-Alt settings for \`${selectedRealm.realmName}\` ${greencheck}\n${reply} **Min Friends:** \`${MinFriends}\`\n${reply} **Min Followers:** \`${MinFollowers}\`\n${reply} **Min Gamerscore:** \`${MinGamerscore}\``)
                                .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                            interaction.update({ embeds: [savedEmbed], components: [] });
                            return collector.stop();
                        }
                    });

                    collector.on("end", () => {
                        return collector.stop();
                    });
                } else if (interaction.options.getSubcommand() === "chat-filter") {
                    if (mongoose.connection.readyState !== 1) {
                        return await interaction.reply({ content: `${alert} The bot is not connected to the database, please try again in 5 seconds.`, ephemeral: true });
                    }
                    let serverData = await serverDB.findOne({ serverID: interaction.guild.id });
                    if (!serverData) {
                        return await interaction.reply({ content: `${alert} No guild info found, please run </link:1219001806256869396>`, ephemeral: true });
                    }
                    if (serverData.hasLinked === false) {
                        return await interaction.reply({ content: `${alert} The server owner has not linked their account yet, please run </link:1219001806256869396>`, ephemeral: true });
                    }
                    const memberRoles = interaction.member.roles.cache;
                    const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
                    const roleWithPerms = serverData.rolePermissions.some(role => memberRoles.has(role.roleID) && role.permissions.configPerms == true);
                    if (!isAdmin && !roleWithPerms) {
                        return interaction.reply({ content: `${alert} You don't have permission to use \`/config chat-filter\`.`, ephemeral: true });
                    }

                    const embed = new EmbedBuilder()
                        .setColor("Yellow")
                        .setTitle(`${chat} | Chat Filter`)
                        .setDescription(`${reply} Fetching Guild Info ${load}`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.reply({ embeds: [embed] });

                    if (serverData.configedRealms.length === 0) {
                        const errorEmbed = new EmbedBuilder
                            .setColor("Red")
                            .setTitle(`${redcross} | Error`)
                            .setDescription(`${reply} You have no configured any realms yet, please run \`/config realm\``)
                            .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                        return await interaction.editReply({ embeds: [errorEmbed] });
                    }

                    const menu = new StringSelectMenuBuilder()
                        .setCustomId("menu")
                        .setPlaceholder("Select a realm")
                        .setMaxValues(1)
                        .setMinValues(1)
                    for (const realm of serverData.configedRealms) {
                        menu.addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel(realm.realmName)
                                .setValue(realm.realmID)
                        )
                    }

                    let bannedWords = interaction.options.getString("banned-words");
                    let bannedLinks = interaction.options.getString("banned-links");

                    const row = new ActionRowBuilder()
                        .addComponents(menu);

                    const embed2 = new EmbedBuilder()
                        .setColor("Orange")
                        .setTitle(`${chat} | Chat Filter`)
                        .setDescription(`${reply} Select a realm below to config chat filter for:`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.editReply({ embeds: [embed2], components: [row] });

                    var collector = interaction.channel.createMessageComponentCollector({
                        componentType: ComponentType.StringSelect,
                        filter: (i) => i.user.id === interaction.user.id,
                        time: 30000
                    });

                    collector.on("collect", async (interaction) => {
                        if (interaction.customId === "menu") {
                            const realmId = interaction.values[0];
                            const selectedRealm = serverData.configedRealms.find(realm => realm.realmID === realmId);
                            if (!selectedRealm) {
                                const errorEmbed = new EmbedBuilder()
                                    .setColor("Red")
                                    .setTitle(`${redcross} | Error`)
                                    .setDescription(`${reply} Realm not found, please try again`)
                                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                                await interaction.update({ embeds: [errorEmbed], components: [] });
                                return collector.stop();
                            }

                            const embed3 = new EmbedBuilder()
                                .setColor("Yellow")
                                .setTitle(`${chat} | Chat Filter`)
                                .setDescription(`${reply} Saving Input ${load}`)
                                .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                            await interaction.update({ embeds: [embed3], components: [] });

                            if (!bannedWords && !bannedLinks) {
                                const errorEmbed = new EmbedBuilder()
                                    .setColor("Red")
                                    .setTitle(`${redcross} | Error`)
                                    .setDescription(`${reply} Please provide either banned words or links`)
                                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                                await interaction.editReply({ embeds: [errorEmbed] });
                                return collector.stop();
                            }

                            if (bannedWords) {
                                selectedRealm.settings.bannedWords.push(bannedWords.split(","));
                            }
                            
                            if (bannedLinks) {
                                selectedRealm.settings.bannedLinks.push(bannedLinks.split(","));
                            }

                            await serverData.save();

                            const embed4 = new EmbedBuilder()
                                .setColor(0x00FF00)
                                .setTitle(`${chat} | Chat Filter`)
                                .setDescription(`${reply} Input Saved ${greencheck}\n\n**Banned Words:** \`${bannedWords}\`\n**Banned Links:** \`${bannedLinks}\``)
                                .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                            await interaction.editReply({ embeds: [embed4] });

                            return collector.stop();
                        }
                    });

                    collector.on("end", () => {
                        return collector.stop();
                    });
                } else if (interaction.options.getSubcommand() === "check") {
                    if (mongoose.connection.readyState !== 1) {
                        return await interaction.reply({ content: `${alert} The bot is not connected to the database, please try again in 5 seconds.`, ephemeral: true });
                    }
                    let serverData = await serverDB.findOne({ serverID: interaction.guild.id });
                    if (!serverData) {
                        return await interaction.reply({ content: `${alert} No guild info found, please run </link:1219001806256869396>`, ephemeral: true });
                    }
                    if (serverData.hasLinked === false) {
                        return await interaction.reply({ content: `${alert} The server owner has not linked their account yet, please run </link:1219001806256869396>`, ephemeral: true });
                    }
                    const memberRoles = interaction.member.roles.cache;
                    const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
                    const roleWithPerms = serverData.rolePermissions.some(role => memberRoles.has(role.roleID) && role.permissions.configPerms == true);
                    if (!isAdmin && !roleWithPerms) {
                        return interaction.reply({ content: `${alert} You don't have permission to use \`/config chat-filter\`.`, ephemeral: true });
                    }

                    const embed = new EmbedBuilder()
                        .setColor("Yellow")
                        .setTitle(`${settings} | Config Check`)
                        .setDescription(`${reply} Fetching Guild Info ${load}`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.reply({ embeds: [embed] });

                    if (serverData.configedRealms.length === 0) {
                        const errorEmbed = new EmbedBuilder
                            .setColor("Red")
                            .setTitle(`${redcross} | Error`)
                            .setDescription(`${reply} You have no configured any realms yet, please run \`/config realm\``)
                            .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                        return await interaction.editReply({ embeds: [errorEmbed] });
                    }

                    const checkMenu = new StringSelectMenuBuilder()
                        .setCustomId("checkMenu")
                        .setPlaceholder("Select a realm")
                        .setMaxValues(1)
                        .setMinValues(1)
                    for (const realm of serverData.configedRealms) {
                        checkMenu.addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel(realm.realmName)
                                .setValue(realm.realmID)
                        )
                    }

                    const row = new ActionRowBuilder()
                        .addComponents(checkMenu);

                    const embed2 = new EmbedBuilder()
                        .setColor("Orange")
                        .setTitle(`${settings} | Config Check`)
                        .setDescription(`${reply} Select a realm to view its config settings:`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.editReply({ embeds: [embed2], components: [row] });

                    var collector = interaction.channel.createMessageComponentCollector({
                        componentType: ComponentType.StringSelect,
                        filter: (i) => i.user.id === interaction.user.id,
                        time: 30000
                    });

                    collector.on("collect", async (interaction) => {
                        if (interaction.customId === "checkMenu") {
                            const realmId = interaction.values[0];
                            const selectedRealm = serverData.configedRealms.find((realm) => realm.realmID === realmId);
                            if (!selectedRealm) {
                                const failEmbed = new EmbedBuilder()
                                    .setColor("Red")
                                    .setTitle(`Error`)
                                    .setDescription(`I was unable to find the realm you selected, please re-run this command.`)
                                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                                await interaction.update({ embeds: [failEmbed], components: [] });
                                return collector.stop();
                            }
                            // Button Menu
                            const row2 = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId("viewWords")
                                        .setLabel("Banned Words")
                                        .setStyle(ButtonStyle.Secondary)
                                        .setEmoji(`${chat}`),
                                    new ButtonBuilder()
                                        .setCustomId("viewLinks")
                                        .setLabel("Banned Links")
                                        .setStyle(ButtonStyle.Secondary)
                                        .setEmoji(`<:link:1185768706740068393>`)
                                );

                            const client = interaction.client;

                            let KicksChannel = client.channels.cache.get(serverData.logs.kicks.channelID);
                            if (!KicksChannel) KicksChannel = `\`Not Set.\``;
                            let BansChannel = client.channels.cache.get(serverData.logs.bans.channelID);
                            if (!BansChannel) BansChannel = `\`Not Set.\``;
                            let UnbansChannel = client.channels.cache.get(serverData.logs.unbans.channelID);
                            if (!UnbansChannel) UnbansChannel = `\`Not Set.\``;
                            let AutoModChannel = client.channels.cache.get(serverData.logs.autoMod.channelID);
                            if (!AutoModChannel) AutoModChannel = `\`Not Set.\``;
                            let ChatRelayChannel = client.channels.cache.get(serverData.logs.chatRelay.channelID);
                            if (!ChatRelayChannel) ChatRelayChannel = `\`Not Set.\``;
                            //const CmdLoggingChannel = client.channels.cache.get(serverData.logs.cmdExecution.channelID);
                            let InvitesChannel = client.channels.cache.get(serverData.logs.invites.channelID);
                            if (!InvitesChannel) InvitesChannel = `\`Not Set.\``;
                            let JoinsAndLeavesChannel = client.channels.cache.get(serverData.logs.joinsAndLeaves.channelID);
                            if (!JoinsAndLeavesChannel) JoinsAndLeavesChannel = `\`Not Set.\``;
                            let DeathsChannel = client.channels.cache.get(serverData.logs.deaths.channelID);
                            if (!DeathsChannel) DeathsChannel = `\`Not Set.\``;

                            let LivePlayerlist = client.channels.cache.get(serverData.automations.playerlist.channelID);
                            if (LivePlayerlist === "0" || !LivePlayerlist) LivePlayerlist = `\`Not Set.\``;

                            const embed3 = new EmbedBuilder()
                                .setColor("DarkGreen")
                                .setTitle(`Settings for ${selectedRealm.realmName}`)
                                .setDescription(`**__Modules:__**\n${await getModulesEmoji(serverData)}\n\n**__Logging:__**\nChat Relay: ${ChatRelayChannel}\nKicks: ${KicksChannel}\nBans: ${BansChannel}\nUnbans: ${UnbansChannel}\nAutoMod: ${AutoModChannel}\nCommand Logging: \`Coming Soon!\`\nInvites: ${InvitesChannel}\nJoins/Leaves: ${JoinsAndLeavesChannel}\nDeaths: ${DeathsChannel}\n\n**__Cosmetics:__**\n\`Coming Soon!\`\n\n**__Automations:__**\nLive Playerlist: ${LivePlayerlist}\nClub Feed: \`Coming Soon!\``)
                                .setThumbnail(interaction.guild.iconURL())

                            await interaction.update({ embeds: [embed3], components: [row2] });
                            return collector.stop();
                        }
                    });
                }
            } catch (error) {
                console.log(error);
            }
        }
}