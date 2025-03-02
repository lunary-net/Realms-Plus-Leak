const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ComponentType, ButtonBuilder, ButtonStyle } = require('discord.js');
const { discord, automod, reason, settings, database, search, unknown, minecraft, discordanimated, shield } = require('../utility/emojis');
const mongoose = require('mongoose');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Provides helpful information to help you out.'),
    async execute(interaction) {
        try {
            if (mongoose.connection.readyState !== 1) {
                return await interaction.reply({
                    content: 'Database not connected! Run the command again in 5 seconds!',
                    ephemeral: true
                });
            }

            const rowOne = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setEmoji(`${settings}`)
                        .setLabel("Setup")
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId("setup"),
                    new ButtonBuilder()
                        .setEmoji(`${minecraft}`)
                        .setLabel("Realm Management")
                        .setStyle(ButtonStyle.Success)
                        .setCustomId("realm"),
                    new ButtonBuilder()
                        .setEmoji(`${database}`)
                        .setLabel("Database")
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId("database"),
                    new ButtonBuilder()
                        .setEmoji(`${search}`)
                        .setLabel("Lookup")
                        .setStyle(ButtonStyle.Secondary)
                        .setCustomId("lookup"),
                    new ButtonBuilder()
                        .setEmoji(`${reason}`)
                        .setLabel("Logs")
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId("logs"),
                );

            const rowTwo = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setEmoji(`${automod}`)
                        .setLabel("Modules")
                        .setStyle(ButtonStyle.Danger)
                        .setCustomId("modules"),
                    new ButtonBuilder()
                        .setEmoji(`${unknown}`)
                        .setLabel("Misc")
                        .setStyle(ButtonStyle.Secondary)
                        .setCustomId("misc"),
                    new ButtonBuilder()
                        .setEmoji(`${discordanimated}`)
                        .setLabel('Support Server')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://discord.gg/Zh6SW8bZqg')
                );

            const helpEmbed = new EmbedBuilder()
                .setColor(946466)
                .setTitle(`${shield} Realms+ | MCBE Realm Manager ${shield}`)
                .setDescription("> Welcome to the help menu for Realms+! Please select the category below that you need help with.\n\n**__Categories__**\n*Setup*, *Realm Management*, *Database*, *Lookup*, *Logs*, *Modules*, *Misc*")
                .setFooter({
                    text: "TIP: use the /link and /config realm commands if you're a realm owner!",
                    iconURL: process.env.ICON
                });

            await interaction.reply({ embeds: [helpEmbed], components: [rowOne, rowTwo] });

            var collector = interaction.channel.createMessageComponentCollector({
                componentType: ComponentType.Button,
                filter: (interaction) => interaction.user.id === interaction.member.user.id,
                time: 60000
            });

            collector.on('collect', async (interaction) => {
                try {
                    switch (interaction.customId) {
                        case 'modules':
                            const moduleEmbed = {
                                color: 946466,
                                title: `${automod} | Module Help`,
                                description: 'This is the module help menu. All modules are toggled using the \`/config modules\` command.\n\n**__DISCORD MODULES:__**\n\n- \`DC Ban Module\`\n> When enabled, the *Ban Module* will ban users froms your server if they\'re found to be in our __Discord User Database__.\n\n**__REALM MODULES__**\n\n- \`Auto Ban From DB\`\n> When enabled, the *Auto Ban from DB* module will cause any players from our __Realm Hacker Database__ to be removed from the playerlist **if** they join your realm.\n\n- \`Device Filter\`\n> When enabled (and at least 1 device has been selected), the *Device Filter* allows users to selected which devices aren\'t allowed on their realm(s). Enabling this module for a selected device means that players joined on the selected device(s) will be kicked from the realm.\n\n- \`Anti Unfair-Skin\`\n> When enabled, the *Anti Unfair-Skin Module* will process joined users skin data and determine whether the data is valid, corrupt, or unfair (invis + small skins). Flagged users are removed from the realm.\n\n- \`Anti Alt Accounts\`\n> When enabled, the *Anti Alt Accounts Module* will process specific user info to determine whether the account is an alt (possible bot) or not. You can config settings for this with \`/config anti-alt\`.\n\n- \`Anti Movement Hacks\`\n> When enabled, the *Anti Movement Hacks Module* will process movement data from all players in the realm. This covers fly and speed hacks. The bot will alert in chat if this is triggered.\n\n- \`Anti Chat Spam\`\n> When enabled, the *Anti Chat Spam Module* will scan and detect chat spam from "external" sources. Spam Accounts are removed from the realm.',
                                timestamp: new Date().toISOString(),
                                footer: {
                                    text: process.env.FOOTER,
                                    icon_url: process.env.ICON_URL
                                }
                            };
                            await interaction.reply({
                                embeds: [moduleEmbed],
                                ephemeral: true
                            });
                            break;
                        case 'setup':
                            const setupEmbed = {
                                color: 946466,
                                title: `${settings} | Setup Help`,
                                description: `This is the setup help menu, going from top to bottom is how you properly setup Realms+ in your server.\n\n- \`/link\`\n> This command is to login with your **Main Account** that owns the Minecraft Realm(s) you want Realms+ to manage. Run this command first.\n\n- \`/config realm\`\n> This command is to setup 1 or more of your owned realms with Realms+, invite our **Bot Account** to your realms, and select certain config options (such as the realms Chat Type and the Client Type for the AutoMod). Currently only "Bot Account" is supported for Client Type.\n\n- \`/config anti-alt\`\n> This is to set the **minimum** required amount of Friends, Followers, or Gamerscore a player needs to join your realm.\n\n- \`/config lockdown\`\n> This command is to set an Admin Tag for the bot to be used during lockdown (when enabled). Keep in mind users **without** this tag will be teleported during lockdown (rather than kicked), its meant to be set as your Staff / Admin tag.\n\nNow your realm(s) are properly setup! You can do additional configuration by setting log channels (\`/logs\`), setting permissions (\`/permissions\`), adding to the whitelist (\`/whitelist\`), or managing the realm (\`/realm\`).`,
                                timestamp: new Date().toISOString(),
                                footer: {
                                    text: process.env.FOOTER,
                                    icon_url: process.env.ICON_URL
                                }
                            };
                            await interaction.reply({
                                embeds: [setupEmbed],
                                ephemeral: true
                            });
                            break;
                        case 'realm':
                            const realmEmbed = {
                                color: 946466,
                                title: `${minecraft} | Management Help`,
                                description: `This menu is for the \`/realm\` commands. Each of these commands are for different management options, these commands require a **Linked Account**.\n\n**NOTE:** The \`/realm panel\` command has multiple options: \n1. \`Lockdown\` -> Enable / Disable Realm Lockdown\n2. \`Scan\` -> Scan the realm for Flagged Accounts, Possible Alts, and Accounts in our database.\n\nEach of the commands do what they are labeled as, for further assistance and/or questions you may contact support.\n\nUsers without \`ADMINISTRATOR\` will need the respective permissions to use any of these commands.`,
                                timestamp: new Date().toISOString(),
                                footer: {
                                    text: process.env.FOOTER,
                                    icon_url: process.env.ICON_URL
                                }
                            };
                            await interaction.reply({
                                embeds: [realmEmbed],
                                ephemeral: true
                            });
                            break;
                        case 'database':
                            const databaseEmbed = {
                                color: 946466,
                                title: `${database} | Database Help`,
                                description: `This is the help menu for the \`/database\` commands.\n\n- \`/database search\`\n> This command allows users to search for Discord Users and/or Realm Players possibly in our database.\n\n- \`/database report\`\n> This command will submit a report to the ARASR Staff Team on the specific user. Use this command if you've caught a realm griefer, bot / alt account, or an associated discord account.\n\n- \`/database leaderboard\`\n> This command returns a leaderboard for one of the selected options, \`Global Stats\`, \`Report Count\`, \`Database Addition Count\``,
                                timestamp: new Date().toISOString(),
                                footer: {
                                    text: process.env.FOOTER,
                                    icon_url: process.env.ICON_URL
                                }
                            };
                            await interaction.reply({
                                embeds: [databaseEmbed],
                                ephemeral: true
                            });
                            break;
                        case 'lookup':
                            const lookupEmbed = {
                                color: 946466,
                                title: `${search} | Lookup Help`,
                                description: `This is the menu for the \`/lookup\` commands.\n\n- \`/lookup player\`\n> This command will retrieve a players account info from Xbox Live, including their most recent achievements and an **Alt Percent** value, keep in mind this is not always accurate.\n\n- \`/lookup realm\`\n> This command will retrieve information on a specific realm invite (link or code format).`,
                                timestamp: new Date().toISOString(),
                                footer: {
                                    text: process.env.FOOTER,
                                    icon_url: process.env.ICON_URL
                                }
                            };
                            await interaction.reply({
                                embeds: [lookupEmbed],
                                ephemeral: true
                            });
                            break;
                        case 'logs':
                            const logsEmbed = {
                                color: 946466,
                                title: `${reason} | Logs Help`,
                                description: 'This is the help menu for Realms+ Log Commands. The log commands are:\n\n- \`/logs list\`\n> Lists all current logging channels and the type of log sent to them.\n\n- \`/logs set\`\n\n> Sets specific log type(s) to a channel.\n\n- \`/logs clear\`\n> Clears all set logging channels in the guild.\n\nUsers without \`ADMINISTRATOR\` will need the \`serverLogPerms\` permission in order to use these commands.',
                                timestamp: new Date().toISOString(),
                                footer: {
                                    text: process.env.FOOTER,
                                    icon_url: process.env.ICON_URL
                                }
                            };
                            await interaction.reply({
                                embeds: [logsEmbed],
                                ephemeral: true
                            });
                            break;
                        case 'misc':
                            const miscEmbed = {
                                color: 946466,
                                title: `${unknown} | Misc Help`,
                                description: `This menu is for the other commands not given their own categories.\n\n- \`/permissions\`\n> All permission commands are in this category, including \`/permissions set\` (Add or Remove permissions to a role) and \`/permissions list\` (List all roles with enabled permissions).\n\n- \`/whitelist\`\n> All whitelist commands are in this category, including \`/whitelist set\` (Add or Remove a user from the whitelist), \`/whitelist list\` (Display all whitelisted users for this server).\n\n**__Other Commands:__**\n- \`/invite\` -> Invite Realms+!\n- \`/help\` -> Shows this menu.\n- \`/vote\` -> Support us by upvoting Realms+!\n- \`/bot-info\` -> Displays bot information\n- \`/ping\` -> Displays bot latency and its connected services.\n- \`/unlink\` -> Unlinks your account from Realms+\n- \`/disconnect\` -> Delete all data (including your linked account) for this server.\n- \`/user-info\` -> Displays basic info on a selected discord user.\n- \`/guild-info\` -> Return information for this server, such as currently enabled  disabled modules. If the server owner uses the command, and they've linked their account, it will return useful information on their owned realms as well.`,
                                timestamp: new Date().toISOString(),
                                footer: {
                                    text: process.env.FOOTER,
                                    icon_url: process.env.ICON_URL
                                }
                            };
                            await interaction.reply({
                                embeds: [miscEmbed],
                                ephemeral: true
                            });
                            break;
                    }
                } catch (error) {
                    console.error('Error replying to button interaction:', error);
                }
            });

            collector.on('end', () => {
                collector.stop();
            });

        } catch (error) {
            console.error('Error executing help command:', error);
            const errorChannel = interaction.client.channels.cache.get(process.env.ERROR_CHANNEL);
            if (errorChannel) {
                await errorChannel.send(`There has been an error! Here is the information surrounding it.\n\nServer Found In: **${interaction.guild.name}**・**${interaction.guild.id}**\nUser Who Found It: **${interaction.user.tag}**・**${interaction.user.id}**\nFound Time: <t:${Math.trunc(Date.now() / 1000)}:R>\nThe Reason: **Help Command has an error**\nError: **${error.stack}**\n\`\`\` \`\`\``);
            }
        }
    }
};
