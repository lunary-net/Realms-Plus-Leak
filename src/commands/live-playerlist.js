const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ComponentType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, Client } = require("discord.js");
const { person, minecraft, xuidd, calander, reply, redcross, load, greencheck, greenstatus } = require("../utility/emojis");
const { Playerlist } = require("../handlers/PlayerlistHandler");
const mongoose = require("mongoose");
const serverDB = require("../models/serverDB");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("live-playerlist")
        .setDescription("Live Playerlist Commands")
        .addSubcommand(subcommand =>
            subcommand
                .setName("set")
                .setDescription("Set the Live Playerlist channel and send the initial embed.")
                .addChannelOption(option =>
                    option
                        .setName("channel")
                        .setDescription("The channel where the live playerlist is sent and/or updated.")
                        .setRequired(true)
                )
            ),

            async execute(interaction) {
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
                const roleWithPerms = serverData.rolePermissions.some(role => memberRoles.has(role.roleID) && role.permissions.playerlistPerms == true);
                if (!isAdmin && !roleWithPerms) {
                    return interaction.reply({ content: `${alert} You don't have permission to use \`/live-playerlist set\`.`, ephemeral: true });
                }

                if (!serverData.configedRealms.length > 0) {
                    return interaction.reply({ content: `${alert} You have no configed any realms yet, please run \`/config realm\``, ephemeral: true });
                }

                const Channel = interaction.options.getChannel("channel");

                const embed1 = new EmbedBuilder()
                    .setColor("Yellow")
                    .setTitle(`${greenstatus} | Live Playerlist`)
                    .setDescription(`${reply} Fetching Guild Info ${load}`)
                    .setFooter({ text: `${process.env.FOOTER}`, iconURL: `${process.env.ICON_URL}` })

                await interaction.reply({ embeds: [embed1] });

                const playerlistMenu = new StringSelectMenuBuilder()
                    .setCustomId("playerlistMenu")
                    .setPlaceholder("Select a realm")
                    .setMinValues(1)
                    .setMaxValues(1)
                for (const realm of serverData.configedRealms) {
                    playerlistMenu.addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel(realm.realmName)
                            .setValue(realm.realmID)
                            .setEmoji(minecraft)
                    )
                }

                const row = new ActionRowBuilder()
                    .addComponents(playerlistMenu)

                const embed2 = new EmbedBuilder()
                    .setColor("Orange")
                    .setTitle(`${greenstatus} | Live Playerlist`)
                    .setDescription(`${reply} Select a realm to track its playerlist:`)
                    .setFooter({ text: `${process.env.FOOTER}`, iconURL: `${process.env.ICON_URL}` })

                await interaction.editReply({ embeds: [embed2], components: [row] });

                var collector = interaction.channel.createMessageComponentCollector({
                    componentType: ComponentType.StringSelect,
                    filter: (i) => i.user.id === interaction.user.id,
                    time: 30000
                });

                collector.on("collect", async (interaction) => {
                    if (interaction.customId === "playerlistMenu") {
                        const realmId = interaction.values[0];
                        const selectedRealm = serverData.configedRealms.find(realm => realm.realmID === realmId);
                        if (!selectedRealm) {
                            const failEmbed = new EmbedBuilder()
                                .setColor("Red")
                                .setTitle(`${redcross} | Live Playerlist`)
                                .setDescription(`${reply} I was unable to find the realm you selected, please try again!`)
                                .setFooter({ text: `${process.env.FOOTER}`, iconURL: `${process.env.ICON_URL}` })

                            await interaction.update({ embeds: [failEmbed], components: [] });
                            return collector.stop();
                        }
                        const embed3 = new EmbedBuilder()
                            .setColor("Yellow")
                            .setTitle(`${greenstatus} | Live Playerlist`)
                            .setDescription(`${reply} Building Playerlist Embed ${load}`)
                            .setFooter({ text: `${process.env.FOOTER}`, iconURL: `${process.env.ICON_URL}` })

                        await interaction.update({ embeds: [embed3], components: [] });

                        serverData.automations.playerlist.channelID = Channel.id;

                        new Playerlist(interaction.guild.id, interaction.guild.name, selectedRealm, serverData, interaction.client);

                        const embed4 = new EmbedBuilder()
                            .setColor(0x00FF00)
                            .setTitle(`${greenstatus} | Live Playerlist`)
                            .setDescription(`${reply} Successfully built the Live-Playerlist for \`${selectedRealm.realmName}\`!\n\n**__Info:__**\n> **Channel:** ${Channel}`)
                            .setFooter({ text: `${process.env.FOOTER}`, iconURL: `${process.env.ICON_URL}` })

                        await interaction.editReply({ embeds: [embed4], components: [] });
                        return collector.stop();
                    }
                });

                collector.on("end", () => {
                    return collector.stop();
                });

            }
        }