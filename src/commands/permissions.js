const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ComponentType } = require("discord.js");
const { reply, load, greencheck, alert, redcross, discord, settings } = require("../utility/emojis");
const serverDB = require("../models/serverDB");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("permissions")
        .setDescription("Permission Commands for Realms+")
        .addSubcommand(option =>
            option
                .setName("set")
                .setDescription("Add or Remove Permissions from a Role.")
                .addStringOption(option =>
                    option
                        .setName("toggle")
                        .setDescription("Add or Romove Permissions from the selected role.")
                        .setRequired(true)
                        .addChoices(
                            { name: "Add", value: "add" },
                            { name: "Remove", value: "remove" }
                        )
                    )
                .addRoleOption(option =>
                    option
                        .setName("role")
                        .setDescription("The role you want to toggle permissions for.")
                        .setRequired(true)
                    )
                )
        .addSubcommand(option =>
            option
                .setName("list")
                .setDescription("List all Roles given Permissions to Realms+")
        ),

        async execute(interaction) {
            let serverData = await serverDB.findOne({ serverID: interaction.guild.id });
            if (!serverData) {
                return await interaction.reply({ content: `${alert} This server has not been setup yet, please run </link:1219001806256869396>` });
            }

            if (interaction.options.getSubcommand() === "set") {
                const role = interaction.options.getRole("role");
                const type = interaction.options.getString("toggle");

                const memberRoles = interaction.member.roles.cache;
                const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
                const roleWithPerms = serverData.rolePermissions.some(role => memberRoles.has(role.roleID) && role.permissions.configPerms == true);
                if (!isAdmin && !roleWithPerms) {
                    return interaction.reply({ content: `${alert} You don't have permission to use \`/permissions set\`.`, ephemeral: true });
                }

                const embed1 = new EmbedBuilder()
                    .setColor("Yellow")
                    .setTitle(`${settings} | Permissions Set`)
                    .setDescription(`${reply} Fetching Guild Info ${load}`)
                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                await interaction.reply({ embeds: [embed1] });

                const permMenu = new StringSelectMenuBuilder()
                    .setCustomId("permMenu")
                    .setPlaceholder("Select permissions to toggle")
                    .setMaxValues(10)
                    .setMinValues(1)
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Ban Players (/realm ban)")
                            .setValue("banPlayerPerms")
                            .setEmoji("🔨"),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Kick Players (/realm kick)")
                            .setValue("kickPlayerPerms")
                            .setEmoji("🔨"),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Unban Players (/realm unban)")
                            .setValue("unbanPlayerPerms")
                            .setEmoji("🔨"),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Config Perms (/config)")
                            .setValue("configPerms")
                            .setEmoji("🔨"),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Log Perms (/logs)")
                            .setValue("serverLogPerms")
                            .setEmoji("🔨"),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Open Realm (/realm state)")
                            .setValue("openRealmPerms")
                            .setEmoji("🔨"),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Close Realm (/realm state)")
                            .setValue("closeRealmPerms")
                            .setEmoji("🔨"),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Manage Realm (/realm permissions)")
                            .setValue("manageRealmPerms")
                            .setEmoji("🔨"),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Rename Realm (/realm rename)")
                            .setValue("renameRealmPerms")
                            .setEmoji("🔨"),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Playerlist Perms (/realm players)")
                            .setValue("playerlistPerms")
                            .setEmoji("🔨"),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("See Invite Code (/realm code)")
                            .setValue("realmCodePerms")
                            .setEmoji("🔨"),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Invite Players (/realm invite)")
                            .setValue("invitePlayersPerms")
                            .setEmoji("🔨"),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Bot Connection (/join)")
                            .setValue("realmJoinPerms")
                            .setEmoji("🔨"),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Bot Disconnection (/leave)")
                            .setValue("realmLeavePerms")
                            .setEmoji("🔨"),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Whitelist Manage (/whitelist)")
                            .setValue("whitelistPerms")
                            .setEmoji("🔨"),
                    )

                    const row = new ActionRowBuilder()
                        .addComponents(permMenu);

                    const embed2 = new EmbedBuilder()
                        .setColor("Orange")
                        .setTitle(`${settings} | Permissions Set`)
                        .setDescription(`${reply} Select permissions to toggle for ${role}`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.editReply({ embeds: [embed2], components: [row] });

                    var collector = interaction.channel.createMessageComponentCollector({
                        componentType: ComponentType.StringSelect,
                        time: 30000
                    });

                    collector.on("collect", async (interaction) => {
                        if (interaction.customId === "permMenu") {
                            const perms = interaction.values;
                            let outcomes = [];
                            const roleIndex = serverData.rolePermissions.findIndex(p => p.roleID === role.id);

                            switch (type) {
                                case "add":
                                    if (roleIndex === -1) {
                                        const newRole = {
                                            roleID: role.id,
                                            permissions: {
                                                banPlayerPerms: false,
                                                unbanPlayerPerms: false,
                                                kickPlayerPerms: false,
                                                configPerms: false,
                                                serverLogPerms: false,
                                                openRealmPerms: false,
                                                closeRealmPerms: false,
                                                manageRealmPerms: false,
                                                renameRealmPerms: false,
                                                playerlistPerms: false,
                                                realmCodePerms: false,
                                                invitePlayersPerms: false,
                                                realmJoinPerms: false,
                                                realmLeavePerms: false,
                                                whitelistPerms: false,
                                            }
                                        }
                                        serverData.rolePermissions.push(newRole);
                                    }

                                    for (const perm of perms) {
                                        if (serverData.rolePermissions[roleIndex !== -1 ? roleIndex : serverData.rolePermissions.length - 1].permissions[perm]) {
                                            outcomes.push(`${redcross} ${role} already has permission: \`${perm}\``);
                                        } else {
                                            serverData.rolePermissions[roleIndex === -1 ? serverData.rolePermissions.length - 1 : roleIndex].permissions[perm] = true;
                                            outcomes.push(`${greencheck} Permission \`${perm}\` added to ${role}`);
                                        }
                                    }
                                    break
                                case "remove":
                                    for (const perm of perms) {
                                        if (roleIndex !== -1) {
                                            if (serverData.rolePermissions[roleIndex].permissions[perm]) {
                                                serverData.rolePermissions[roleIndex].permissions[perm] = false;
                                                outcomes.push(`${greencheck} Removed \`${perm}\` from ${role}`);
                                            } else {
                                                outcomes.push(`${redcross} ${role} does not have permission: \`${perm}\``);
                                            }
                                        } else {
                                            outcomes.push(`${redcross} ${role} is not in the database.`);
                                        }
                                    }
                                    break
                            }
                            await serverData.save();

                            const embed3 = new EmbedBuilder()
                                .setColor("#00FF00")
                                .setTitle(`${settings} | Permissions Set`)
                                .setDescription(`${reply} Settings Saved.\n\n**__Result:__**\n${outcomes.join("\n")}`)

                            await interaction.update({ embeds: [embed3], components: [] });
                            return collector.stop();
                        }
                    });

                    collector.on("end", () => {
                        return collector.stop();
                    });
            } else if (interaction.options.getSubcommand() === "list") {
                const serverData = await serverDB.findOne({ serverID: interaction.guild.id });

                const memberRoles = interaction.member.roles.cache;
                const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
                const roleWithPerms = serverData.rolePermissions.some(role => memberRoles.has(role.roleID) && role.permissions.configPerms == true);
                if (!isAdmin && !roleWithPerms) {
                    return interaction.reply({ content: `${alert} You don't have permission to use \`/permissions list\`.`, ephemeral: true });
                }

                if (!serverData) {
                    return await interaction.reply({ content: `${alert} No server data found, please run </link:1219001806256869396>` });
                }

                const embed = new EmbedBuilder()
                    .setColor("Yellow")
                    .setTitle(`${settings} | Permissions List`)
                    .setDescription(`${reply} Fetching Guild Info ${load}`)
                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                await interaction.reply({ embeds: [embed] });

                if (serverData.rolePermissions.length === 0) {
                    const failEmbed = new EmbedBuilder()
                        .setColor("Red")
                        .setTitle(`${redcross} | Error`)
                        .setDescription(`${reply} This server has no roles with permissions set.`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.editReply({ embeds: [failEmbed] });
                    return;
                }

                const roleMenu = new StringSelectMenuBuilder()
                    .setCustomId("roleMenu")
                    .setPlaceholder("Select a role")
                    .setMaxValues(1)
                    .setMinValues(1)
                for (const roleData of serverData.rolePermissions) {
                    const role = interaction.guild.roles.cache.get(roleData.roleID);
                    if (role) {
                        roleMenu.addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel(role.name)
                                .setValue(roleData.roleID)
                                .setEmoji("🔑")
                        )
                    }
                };

                const row = new ActionRowBuilder()
                    .addComponents(roleMenu);

                const embed2 = new EmbedBuilder()
                    .setColor("Orange")
                    .setTitle(`${settings} | Permissions List`)
                    .setDescription(`${reply} Select a role to view its permissions:`)
                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                await interaction.editReply({ embeds: [embed2], components: [row] });

                var collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 30000 });

                collector.on("collect", async (interaction) => {
                    if (interaction.customId === "roleMenu") {
                        const selection = interaction.values[0];
                        const selectedRole = serverData.rolePermissions.find(data => data.roleID === selection);

                        if (!selectedRole) {
                            const failEmbed = new EmbedBuilder()
                                .setColor("Red")
                                .setTitle(`${redcross} | Error`)
                                .setDescription(`${reply} This role is not in the database.`)
                                .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                            await interaction.update({ embeds: [failEmbed], components: [] });
                            return collector.stop();
                        }

                        const role = interaction.guild.roles.cache.get(selection);

                        let permissionsOutput = `${reply} Permissions for ${role.name}:\n`;
                        for (const [perm, value] of Object.entries(selectedRole.permissions)) {
                            if (value) {
                                permissionsOutput += `> \`${perm}\`\n`;
                            }
                        }

                        const embed3 = new EmbedBuilder()
                            .setColor("White")
                            .setTitle(`${settings} | Permissions List`)
                            .setDescription(permissionsOutput)
                            .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                        await interaction.update({ embeds: [embed3], components: [] });
                        return collector.stop();
                    }
                });

                collector.on("end", () => {
                    return collector.stop();
                });
            }
        }
}

