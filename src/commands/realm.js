const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ComponentType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionsBitField, ButtonBuilder, ButtonStyle } = require('discord.js');
const { reply, added, person, id, calander, removed, minecoin, greencheck, load, operator, search, microsoft, minecraft, alert, shield, warn, redcross, automod, question } = require('../utility/emojis');
const { RED, WHITE } = require('../utility/colors');
const mongoose = require('mongoose');
const serverDB = require('../models/serverDB');
const userDB = require('../models/userDB');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("realm")
        .setDescription("Realm Management Commands.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("state")
                .setDescription("Open / Close your Minecraft Realm!")
                .addStringOption(option =>
                    option
                        .setName("action")
                        .setDescription("Select Open or Close")
                        .setRequired(true)
                        .addChoices(
                            { name: "Open", value: "open" },
                            { name: "Close", value: "close" }
                        )
                    )
                )
        .addSubcommand(subcommand =>
            subcommand
                .setName("ban")
                .setDescription("Ban a player from your realm.")
                .addStringOption(option =>
                    option
                        .setName("gamertag")
                        .setDescription("Enter the gamertag of the player to unban.")
                        .setRequired(true)
                    )
                .addStringOption(option =>
                    option
                        .setName("reason")
                        .setDescription("Enter the reason for the ban")
                        .setRequired(false)
                    )
                .addStringOption(option =>
                    option
                        .setName("duration")
                        .setDescription("Enter the duration of the ban")
                        .setRequired(false)
                    )
                )
        .addSubcommand(subcommand =>
            subcommand
                .setName("unban")
                .setDescription("Unban a player from your realm.")
                .addStringOption(option =>
                    option
                        .setName("gamertag")
                        .setDescription("Enter the gamertag of the player to unban.")
                        .setRequired(true)
                    )
                .addStringOption(option =>
                    option
                        .setName("reason")
                        .setDescription("Enter the reason for the ban")
                        .setRequired(false)
                    )
                .addStringOption(option =>
                    option
                        .setName("duration")
                        .setDescription("Enter the duration of the ban")
                        .setRequired(false)
                    )
                )
        .addSubcommand(subcommand =>
            subcommand
                .setName("players")
                .setDescription("Get the current playerlist of the selected realm.")
            )
        .addSubcommand(subcommand =>
            subcommand
                .setName("code")
                .setDescription("Get the invite code of the selected realm.")
            )
        .addSubcommand(subcommand =>
            subcommand
                .setName("invite")
                .setDescription("Invite a player to the selected realm.")
                .addStringOption(option =>
                    option
                        .setName("gamertag")
                        .setDescription("Enter the gamertag of the player to invite.")
                        .setRequired(true)
                    )
                )
        .addSubcommand(subcommand =>
            subcommand
                .setName("permissions")
                .setDescription("Change a players permission on the selected realm.")
                .addStringOption(option =>
                    option
                        .setName("gamertag")
                        .setDescription("Enter the gamertag of the player.")
                        .setRequired(true)
                    )
                .addStringOption(option =>
                    option
                        .setName("permission")
                        .setDescription("The permission level the player is allowed.")
                        .setRequired(true)
                        .addChoices(
                            { name: "Visitor", value: "VISITOR" },
                            { name: "Member", value: "MEMBER" },
                            { name: "Operator", value: "OPERATOR" },
                        )
                    )
                )
        .addSubcommand(subcommand =>
            subcommand
                .setName("kick")
                .setDescription("Kick a player from the selected realm.")
                .addStringOption(option =>
                    option
                        .setName("gamertag")
                        .setDescription("Enter the gamertag of the player to kick.")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName("reason")
                        .setDescription("Enter the reason for the kick")
                        .setRequired(false)
                )
            )
        .addSubcommand(subcommand =>
            subcommand
                .setName("slot")
                .setDescription("Change the active world slot of the selected realm.")
                .addStringOption(option =>
                    option
                        .setName("options")
                        .setDescription("Select the slot number to make the active world slot.")
                        .setRequired(true)
                        .addChoices(
                            { name: "1", value: "1" },
                            { name: "2", value: "2" },
                            { name: "3", value: "3" }
                        )
                    )
                )
            .addSubcommand(subcommand =>
                subcommand
                    .setName("panel")
                    .setDescription("Displays the management panel for the selected realm.")
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName("operators")
                    .setDescription("Retrieve a list of everyone with OPERATOR permissions for the selected realm.")
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName("rename")
                    .setDescription("Change the name of the selected realm.")
                    .addStringOption(option =>
                        option
                            .setName("name")
                            .setDescription("Enter the new name of the realm.")
                            .setRequired(true)
                    )
                )
            .addSubcommand(subcommand =>
                subcommand
                    .setName("backup")
                    .setDescription("Restore your realm to a previous save!")
            ),

        async execute(interaction) {
            if (interaction.options.getSubcommand() === "state") {
                try {
                    const value = interaction.options.getString("action");
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
                    const roleWithPerms = serverData.rolePermissions.some(role => memberRoles.has(role.roleID) && role.permissions.closeRealmPerms && role.permissions.openRealmPerms === true);
                    if (!isAdmin && !roleWithPerms) {
                        return interaction.reply({ content: `${alert} You don't have permission to use \`/realm state\`.`, ephemeral: true });
                    }

                    const initialEmbed = new EmbedBuilder()
                        .setColor("#FFF68F")
                        .setTitle(`${minecraft} | Realm State`)
                        .setDescription(`${reply} Fetching Guild Info ${load}`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.reply({ embeds: [initialEmbed] });

                    if (serverData.configedRealms.length === 0 || serverData.configedRealms === null) {
                       const invalidEmbed = new EmbedBuilder()
                            .setColor("#FF0000")
                            .setTitle(`${minecraft} | Realm State`)
                            .setDescription(`${reply} You have not configured a realm for the bot to manage yet. Please run \`/config realm\`.`)
                            .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });
                            
                        return await interaction.editReply({ embeds: [invalidEmbed] });
                    }

                    const stateMenu = new StringSelectMenuBuilder()
                        .setCustomId("stateMenu")
                        .setPlaceholder("Select a realm")
                        .setMaxValues(serverData.configedRealms.flat().length)
                        .setMinValues(1);

                    for (const realm of serverData.configedRealms) {
                        stateMenu.addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel(realm.realmName)
                                .setValue(realm.realmID.toString())
                        );
                    }
                    const row1 = new ActionRowBuilder()
                        .addComponents(stateMenu);

                    const stateEmbed = new EmbedBuilder()
                        .setColor("Orange")
                        .setTitle(`${minecraft} | Realm State`)
                        .setDescription(`${reply} Select the realm you want to manage.`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.editReply({ embeds: [stateEmbed], components: [row1] });

                    var collector = interaction.channel.createMessageComponentCollector({
                        componentType: ComponentType.StringSelect,
                        filter: (i) => i.user.id === interaction.user.id,
                        time: 30000
                    });

                    collector.on("collect", async (interaction) => {
                        if (!interaction.isStringSelectMenu()) return;
                        if (interaction.customId === "stateMenu") {
                            let realmId = interaction.values[0];
                            let selectedRealm = serverData.configedRealms.flat().find(realm => realm.realmID.toString() === realmId);
                            switch (value) {
                                case "open":
                                    const responseOne = await axios.post(
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
                                    const responseTwo = await axios.post(
                                      "https://xsts.auth.xboxlive.com/xsts/authorize",
                                      {
                                        Properties: {
                                          SandboxId: "RETAIL",
                                          UserTokens: [responseOne.data.Token],
                                        },
                                        RelyingParty:
                                          "https://pocket.realms.minecraft.net/",
                                        TokenType: "JWT",
                                      }
                                    );
                                    const realm_tokenn = responseTwo.data.Token
                                    const realm_userhashh = responseTwo.data.DisplayClaims.xui[0].uhs
                                    try {
                                        var openRealm = {
                                            method: "put",
                                            url: `https://pocket.realms.minecraft.net/worlds/${selectedRealm.realmID.toString()}/open`,
                                            headers: {
                                                "Accept": "*/*",
                                                "Authorization": `XBL3.0 x=${realm_userhashh};${realm_tokenn}`,
                                                "Cache-Control": "no-cache",
                                                "Charset": "utf-8",
                                                "Client-Version": process.env.CLIENT_VERSION,
                                                "User-Agent": "MCPE/UWP",
                                                "Accept-Language": "en-GB",
                                                "Accept-Encoding": "gzip, deflate, br",
                                                "Host": "pocket.realms.minecraft.net",
                                                "Content-Length": "0",
                                                "Connection": "Keep-Alive"
                                            },
                                        };
                                        await axios(openRealm).then((result) => {
                                            if (result.status === 401) {
                                                const errorEmbed = new EmbedBuilder()
                                                    .setColor("#FF0000")
                                                    .setTitle(`${minecraft} | Auth Error`)
                                                    .setDescription(`${reply} Your auth has expired, please run </link:1219001806256869396>.`)
                                                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });
            
                                                interaction.update({ embeds: [errorEmbed], components: [] });
                                                return collector.stop();
                                            } else {
                                                const successEmbed = new EmbedBuilder()
                                                    .setColor("#00FF00")
                                                    .setTitle(`${minecraft} | Realm State`)
                                                    .setDescription(` \`${selectedRealm.realmName}\` has been opened. ${greencheck}`)
                                                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });
            
                                                interaction.update({ embeds: [successEmbed], components: [] });
                                                return collector.stop();
                                            }
                                        });
                                    } catch (error) {
                                        console.log(error);
                                        // error handling here
                                    }
                                    break;
                                case "close":
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
                                      const response2 = await axios.post(
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
                                      const realm_token = response2.data.Token
                                      const realm_userhash = response2.data.DisplayClaims.xui[0].uhs
                                      try {
                                          var closeRealm = {
                                              method: "put",
                                              url: `https://pocket.realms.minecraft.net/worlds/${selectedRealm.realmID.toString()}/close`,
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
                                              },
                                          };
                                          await axios(closeRealm).then((result) => {
                                              if (result.status === 401) {
                                                  const errorEmbed = new EmbedBuilder()
                                                      .setColor("#FF0000")
                                                      .setTitle(`${minecraft} | Auth Error`)
                                                      .setDescription(`${reply} Your auth has expired, please run </link:1219001806256869396>.`)
                                                      .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });
              
                                                  interaction.update({ embeds: [errorEmbed], components: [] });
                                                  return collector.stop();
                                              } else {
                                                  const successEmbed = new EmbedBuilder()
                                                      .setColor("#00FF00")
                                                      .setTitle(`${minecraft} | Realm State`)
                                                      .setDescription(` \`${selectedRealm.realmName}\` has been closed. ${greencheck}`)
                                                      .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });
              
                                                  interaction.update({ embeds: [successEmbed], components: [] });
                                                  return collector.stop();
                                              }
                                          });
                                      } catch (error) {
                                          console.log(error);
                                          const embed = new EmbedBuilder()
                                              .setColor("Red")
                                              .setTitle(`Error`)
                                              .setDescription(`${reply} Failed to close \`${selectedRealm.realmName}\` ${redcross}`)
                                              .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                                          interaction.update({ embeds: [embed], components: [] });
                                          return collector.stop();
                                      }
                                    break;
                            }
                        }
                    });

                    collector.on("end", () => {
                        return collector.stop();
                    });
                } catch (error) {
                    console.log(RED + "[ERROR] " + WHITE + `  >>>  Error occured in /realm state: ${error}`);
                    const errorChannel = interaction.client.channels.cache.get(process.env.ERROR_CHANNEL);
                    if (errorChannel) {
                        await errorChannel.send(`There has been an error! Here is the information surrounding it.\n\nServer Found In: **${interaction.guild.name}**・**${interaction.guild.id}**\nUser Who Found It: **${interaction.user.tag}**・**${interaction.user.id}**\nFound Time: <t:${Math.trunc(Date.now() / 1000)}:R>\nThe Reason: **/realm state has an error**\nError: **${error.stack}**\n\`\`\` \`\`\``);
                    }
                }
            } else if (interaction.options.getSubcommand() === "ban") {
                try {
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
                    const roleWithPerms = serverData.rolePermissions.some(role => memberRoles.has(role.roleID) && role.permissions.banPlayerPerms == true);
                    if (!isAdmin && !roleWithPerms) {
                        return interaction.reply({ content: `${alert} You don't have permission to use \`/realm ban\`.`, ephemeral: true });
                    }

                    let gamertag = interaction.options.getString("gamertag");
                    let reason = interaction.options.getString("reason");
                    let duration = interaction.options.getString("duration");

                    const initialEmbed = new EmbedBuilder()
                        .setColor("Yellow")
                        .setTitle(`${minecraft} | Realm Ban`)
                        .setDescription(`${reply} Fetching Guild Info ${load}`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.reply({ embeds: [initialEmbed] });

                    if (serverData.configedRealms.length === 0 || serverData.configedRealms === null) {
                        const invalidEmbed = new EmbedBuilder()
                             .setColor("#FF0000")
                             .setTitle(`${minecraft} | Realm State`)
                             .setDescription(`${reply} You have not configured a realm for the bot to manage yet. Please run \`/config realm\`.`)
                             .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });
                             
                         return await interaction.editReply({ embeds: [invalidEmbed] });
                     }

                     const banMenu = new StringSelectMenuBuilder()
                         .setCustomId("banMenu")
                         .setPlaceholder("Select a realm")
                         .setMinValues(1)
                         .setMaxValues(1)
                    for (const realm of serverData.configedRealms) {
                        banMenu.addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel(realm.realmName)
                                .setValue(realm.realmID.toString())
                        );
                    }

                    const row = new ActionRowBuilder()
                        .addComponents(banMenu);

                    const banEmbed = new EmbedBuilder()
                        .setColor("Orange")
                        .setTitle(`${minecraft} | Realm Ban`)
                        .setDescription(`${reply} Select a realm to ban \`${gamertag}\` from`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.editReply({ embeds: [banEmbed], components: [row] });

                    var collector = interaction.channel.createMessageComponentCollector({
                        componentType: ComponentType.StringSelect,
                        filter: (i) => i.user.id === interaction.user.id,
                        time: 30000
                    });

                    collector.on("collect", async (interaction) => {
                        if (!interaction.isStringSelectMenu()) return;
                        if (interaction.customId === "banMenu") {
                            let realmID = interaction.values[0];
                            let selectedRealm = serverData.configedRealms.flat().find(realm => realm.realmID.toString() === realmID);
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
                              // realm auth
                              const response2 = await axios.post(
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
                              // xbl auth for profile search
                              const response3 = await axios.post('https://xsts.auth.xboxlive.com/xsts/authorize', {
                                    Properties: {
                                        SandboxId: 'RETAIL',
                                        UserTokens: [response1.data.Token],
                                    },
                                    RelyingParty: "http://xboxlive.com",
                                    TokenType: 'JWT',
                                });
                              const realm_token = response2.data.Token
                              const realm_userhash = response2.data.DisplayClaims.xui[0].uhs
                              // xbl data for realms api
                              const xbox_hash = response3.data.DisplayClaims.xui[0].uhs;
                              const xbox_token = response3.data.Token
                              const response4 = await axios.get(`https://profile.xboxlive.com/users/gt(${(gamertag)})/profile/settings?settings=GameDisplayPicRaw`, {
                                headers: {
                                    "x-xbl-contract-version": "2",
                                    "Authorization": `XBL3.0 x=${xbox_hash};${xbox_token}`,
                                    "Accept-Language": "en-US",
                                    "maxRedirects": 1,
                                }
                              });
                              const xbox_data = response4.data.profileUsers;
                              if (xbox_data) {
                               const XUID = xbox_data[0].id
                               const Gamerpic = xbox_data[0].settings.find(obj => obj.id === 'GameDisplayPicRaw').value
                               var PlayerBan = {
                                method: "post",
                                url: `https://pocket.realms.minecraft.net/worlds/${selectedRealm.realmID.toString()}/blocklist/${XUID}`,
                                headers: {
                                    "Cache-Control": "no-cache",
                                    Charset: "utf-8",
                                    "Client-Version": "1.17.41",
                                    "User-Agent": "MCPE/UWP",
                                    "Accept-Language": "en-US",
                                    "Accept-Encoding": "gzip, deflate, br",
                                    Host: "pocket.realms.minecraft.net",
                                    Authorization: `XBL3.0 x=${realm_userhash};${realm_token}`,
                                },
                                }

                                await axios(PlayerBan);
                                
                                const embed = new EmbedBuilder()
                                        .setColor(0x00FF00)
                                        .setTitle(`${minecraft} | Realm Ban`)
                                        .setDescription(`${reply} \`${gamertag}\` was banned from \`${selectedRealm.realmName}\` ${greencheck}`)
                                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                                    
                                    const channelId = serverData.logs.bans.channelID;
                                    const channel = interaction.guild.channels.cache.get(channelId);
                                    if (channel) {
                                        const noticeEmbed = new EmbedBuilder()
                                            .setColor("Orange")
                                            .setAuthor({ name: `Player Ban`, iconURL: process.env.ICON_URL })
                                            .setDescription(`${person} **Gamertag:** \`${gamertag}\`\n${id} **XUID:** \`${XUID}\`\n${minecraft} **Realm:** \`${selectedRealm.realmName}\`\n${automod} **Moderator:** <@${interaction.user.id}>\n${question} **Reason:** \`${reason ?? "None provided."}\`\n${calander} **Duration:** \`${duration ?? "Forever."}\``)
                                            .setThumbnail(Gamerpic)

                                        await channel.send({ embeds: [noticeEmbed] });
                                    }

                                    await interaction.update({ embeds: [embed], components: [] });
                                    return collector.stop();
                              } else {
                                const invalidEmbed = new EmbedBuilder()
                                    .setColor("Red")
                                    .setTitle(`Error`)
                                    .setDescription(`${reply} \`${gamertag}\` is not a valid gamertag.`)
                                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                                await interaction.update({ embeds: [invalidEmbed], components: [] });
                                return collector.stop();
                              }
                        }
                    });

                    collector.on("end", () => {
                        return collector.stop();
                    });
                } catch (error) {
                    console.log(error);
                }
            } else if (interaction.options.getSubcommand() === "unban") {
                try {
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
                    const roleWithPerms = serverData.rolePermissions.some(role => memberRoles.has(role.roleID) && role.permissions.unbanPlayerPerms == true);
                    if (!isAdmin && !roleWithPerms) {
                        return interaction.reply({ content: `${alert} You don't have permission to use \`/realm unban\`.`, ephemeral: true });
                    }

                    let gamertag = interaction.options.getString("gamertag");
                    let reason = interaction.options.getString("reason");

                    const initialEmbed = new EmbedBuilder()
                        .setColor("Yellow")
                        .setTitle(`${minecraft} | Realm Unban`)
                        .setDescription(`${reply} Fetching Guild Info ${load}`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.reply({ embeds: [initialEmbed] });

                    if (serverData.configedRealms.length === 0 || serverData.configedRealms === null) {
                        const invalidEmbed = new EmbedBuilder()
                             .setColor("Red")
                             .setTitle(`Error`)
                             .setDescription(`${reply} You have not configured a realm for the bot to manage yet. Please run \`/config realm\`.`)
                             .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });
                             
                         return await interaction.editReply({ embeds: [invalidEmbed] });
                     }

                     const unbanMenu = new StringSelectMenuBuilder()
                         .setCustomId("unbanMenu")
                         .setPlaceholder("Select a realm")
                         .setMinValues(1)
                         .setMaxValues(serverData.configedRealms.length)
                    for (const realm of serverData.configedRealms) {
                        unbanMenu.addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel(realm.realmName)
                                .setValue(realm.realmID.toString())
                        );
                    }

                    const row = new ActionRowBuilder()
                        .addComponents(unbanMenu);

                    const unbanEmbed = new EmbedBuilder()
                        .setColor("Orange")
                        .setTitle(`${minecraft} | Realm Unban`)
                        .setDescription(`${reply} Select a realm to unban \`${gamertag}\` from.`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.editReply({ embeds: [unbanEmbed], components: [row] });

                    var collector = interaction.channel.createMessageComponentCollector({
                        componentType: ComponentType.StringSelect,
                        filter: (i) => i.user.id === interaction.user.id,
                        time: 30000
                    });

                    collector.on("collect", async (interaction) => {
                        if (!interaction.isStringSelectMenu()) return;
                        if (interaction.customId === "unbanMenu") {
                            let realmID = interaction.values[0];
                            let selectedRealm = serverData.configedRealms.flat().find(realm => realm.realmID.toString() === realmID);
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
                              // realm auth
                              const response2 = await axios.post(
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
                              // xbl auth for profile search
                              const response3 = await axios.post('https://xsts.auth.xboxlive.com/xsts/authorize', {
                                    Properties: {
                                        SandboxId: 'RETAIL',
                                        UserTokens: [response1.data.Token],
                                    },
                                    RelyingParty: "http://xboxlive.com",
                                    TokenType: 'JWT',
                                });
                              const realm_token = response2.data.Token
                              const realm_userhash = response2.data.DisplayClaims.xui[0].uhs
                              // xbl data for realms api
                              const xbox_hash = response3.data.DisplayClaims.xui[0].uhs;
                              const xbox_token = response3.data.Token
                              const response4 = await axios.get(`https://profile.xboxlive.com/users/gt(${(gamertag)})/profile/settings?settings=GameDisplayPicRaw`, {
                                headers: {
                                    "x-xbl-contract-version": "2",
                                    "Authorization": `XBL3.0 x=${xbox_hash};${xbox_token}`,
                                    "Accept-Language": "en-US",
                                    "maxRedirects": 1,
                                }
                              });
                              const xbox_data = response4.data.profileUsers;
                              if (xbox_data) {
                               const XUID = xbox_data[0].id
                               const Gamerpic = xbox_data[0].settings.find(obj => obj.id === 'GameDisplayPicRaw').value
                                const response5 = await axios.delete(`https://pocket.realms.minecraft.net/worlds/${selectedRealm.realmID.toString()}/blocklist/${XUID}`, {
                                    headers: {
                                        "Accept": "*/*",
                                        "Authorization": `XBL3.0 x=${realm_userhash};${realm_token}`,
                                        "Cache-Control": "no-cache",
                                        "Charset": "utf-8",
                                        "Client-Version": process.env.CLIENT_VERSION,
                                        "User-Agent": "MCPE/UWP",
                                        "Accept-Language": "en-GB, en",
                                        "Accept-Encoding": "gzip, deflate, be",
                                        "Host": "pocket.realms.minecraft.net",
                                        "Content-Length": "0",
                                        "Connection": "Keep-Alive"
                                    },
                                });
                                    const embed = new EmbedBuilder()
                                        .setColor(0x00FF00)
                                        .setTitle(`${minecraft} | Realm Unban`)
                                        .setDescription(`${reply} \`${gamertag}\` was unbanned from \`${selectedRealm.realmName}\` ${greencheck}`)
                                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                                    const channelId = serverData.logs.unbans.channelID;
                                    const channel = interaction.guild.channels.cache.get(channelId);
                                    if (channel) {
                                        const noticeEmbed = new EmbedBuilder()
                                            .setColor("Green")
                                            .setAuthor({ name: `Player Unban`, iconURL: process.env.ICON_URL })
                                            .setDescription(`${person} **Gamertag:** \`${gamertag}\`\n${id} **XUID:** \`${XUID}\`\n${minecraft} **Realm:** \`${selectedRealm.realmName}\`\n${automod} **Moderator:** <@${interaction.user.id}>\n${question} **Reason:** \`${reason ?? "None provided."}\``)
                                            .setThumbnail(Gamerpic)

                                        return channel.send({ embeds: [noticeEmbed] });
                                    }

                                    await interaction.update({ embeds: [embed], components: [] });
                                    return collector.stop();
                              } else {
                                const invalidEmbed = new EmbedBuilder()
                                    .setColor("Red")
                                    .setTitle(`Error`)
                                    .setDescription(`${reply} \`${gamertag}\` is not a valid gamertag.`)
                                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                                await interaction.update({ embeds: [invalidEmbed], components: [] });
                                return collector.stop();
                              }
                        }
                    });

                    collector.on("end", () => {
                        return collector.stop();
                    });
                } catch (error) {
                    console.log(error);
                }
            } else if (interaction.options.getSubcommand() === "players") {
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
                        return interaction.reply({ content: `${alert} You don't have permission to use \`/realm players\`.`, ephemeral: true });
                    }

                const initialEmbed = new EmbedBuilder()
                    .setColor("Yellow")
                    .setTitle(`${minecraft} | Realms Players`)
                    .setDescription(` Fetching Guild Info ${load}`)
                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                await interaction.reply({ embeds: [initialEmbed] });

                if (serverData.configedRealms.length === 0 || serverData.configedRealms === null) {
                    const invalidEmbed = new EmbedBuilder()
                         .setColor("#FF0000")
                         .setTitle(`${minecraft} | Realm State`)
                         .setDescription(`${reply} You have not configured a realm for the bot to manage yet. Please run \`/config realm\`.`)
                         .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });
                         
                     return await interaction.editReply({ embeds: [invalidEmbed] });
                 }

                 const realmMenu = new StringSelectMenuBuilder()
                    .setCustomId("realmMenu")
                    .setPlaceholder("Select a realm")
                    .setMaxValues(1)
                    .setMinValues(1);
                for (const realm of serverData.configedRealms) {
                    realmMenu.addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel(realm.realmName)
                            .setValue(realm.realmID.toString())
                    );
                }
                const row = new ActionRowBuilder()
                    .addComponents(realmMenu);

                const realmEmbed = new EmbedBuilder()
                    .setColor("Orange")
                    .setTitle(`${minecraft} | Realms Players`)
                    .setDescription(`${reply} Select a realm to view the playerlist of`)
                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                await interaction.editReply({ embeds: [realmEmbed], components: [row] });

                var collector = interaction.channel.createMessageComponentCollector({
                    componentType: ComponentType.StringSelect,
                    filter: (i) => i.user.id === interaction.user.id,
                    time: 30000,
                });

                collector.on("collect", async (interaction) => {
                    if (!interaction.isStringSelectMenu()) return;
                    if (interaction.customId === "realmMenu") {
                        let realmID = interaction.values[0];
                        let selectedRealm = serverData.configedRealms.flat().find(realm => realm.realmID.toString() === realmID);

                        const embed = new EmbedBuilder()
                            .setColor("Yellow")
                            .setTitle(`${minecraft} | Realms Players`)
                            .setDescription(`${reply} Fetching players currently on \`${selectedRealm.realmName}\` ${load}`)
                            .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                        await interaction.update({ embeds: [embed], components: [] });

                        try {
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
                          // realm auth
                          const response2 = await axios.post(
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
                          // xbl auth for profile search
                          const response3 = await axios.post('https://xsts.auth.xboxlive.com/xsts/authorize', {
                                Properties: {
                                    SandboxId: "RETAIL",
                                    UserTokens: [response1.data.Token],
                                },
                                RelyingParty: "http://xboxlive.com",
                                TokenType: "JWT",
                          });
                          const realm_token = response2.data.Token
                          const realm_userhash = response2.data.DisplayClaims.xui[0].uhs
                          // realms playerlist call 
                          const response4 = await axios.get("https://pocket.realms.minecraft.net/activities/live/players", {
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
                            },
                          });
                          const convertedID = parseInt(selectedRealm.realmID); // gotta convert cuz i stored ID as string for sum reason
                          const realm = response4.data.servers.find(realm => realm.id === convertedID);

                          if (realm) {
                            const players = realm.players;
                            if (!players || players.length === 0) return;
                            let xuid_collection = [];
                            for (const player of players) {
                                const xuid = player.uuid;
                                xuid_collection.push(xuid);
                            }

                            const user_ids = players.map(player => player.uuid);
                                // xbox data call
                            const xbox_hash = response3.data.DisplayClaims.xui[0].uhs
                            const xbox_token = response3.data.Token
                            const response5 = await axios.post(
                                `https://profile.xboxlive.com/users/batch/profile/settings`,
                                { userIds: xuid_collection, settings: ["Gamertag", "Gamerscore"] },
                                {
                                    headers: {
                                        'Accept': '*/*', 
                                        'Authorization': `XBL3.0 x=${xbox_hash};${xbox_token}`, 
                                        'Content-Type': 'application/json; charset=utf-8', 
                                        'x-xbl-contract-version': 3, 
                                        'Accept-Encoding': 'gzip, deflate, br', 
                                        'Host': 'profile.xboxlive.com', 
                                        'Connection': 'Keep-Alive', 
                                        'Cache-Control': 'no-cache',
                                    }
                                }
                            )
                            const listData = response5.data.profileUsers.map(profileUsers => profileUsers.settings)

                            const embed4 = new EmbedBuilder()
                                .setColor("Orange")
                                .setTitle(`Players on ${selectedRealm.realmName}`)
                                .setDescription(`${reply} **Player Count:** \`${listData.length}/10\`\n\n${getList(listData)}`)
                                .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                            await interaction.editReply({ embeds: [embed4] })
                            return collector.stop();

                          } else {

                          }
                          
                    } catch (error) {
                        console.log(error);
                    }
                }
                });

                collector.on("end", () => {
                    return collector.stop();
                });
                } else if (interaction.options.getSubcommand() === "code") {
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
                    const roleWithPerms = serverData.rolePermissions.some(role => memberRoles.has(role.roleID) && role.permissions.realmCodePerms == true);
                    if (!isAdmin && !roleWithPerms) {
                        return interaction.reply({ content: `${alert} You don't have permission to use \`/realm code\`.`, ephemeral: true });
                    }

                    const embed1 = new EmbedBuilder()
                        .setColor("Yellow")
                        .setTitle(`${minecraft} | Realm Code`)
                        .setDescription(`${reply} Fetching Guild Info ${load}`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.reply({ embeds: [embed1] });

                    if (serverData.configedRealms.length === 0 || serverData.configedRealms === null) {
                        const invalidEmbed = new EmbedBuilder()
                             .setColor("#FF0000")
                             .setTitle(`Error`)
                             .setDescription(`${reply} You have not configured a realm for the bot to manage yet. Please run \`/config realm\`.`)
                             .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });
                             
                         return await interaction.editReply({ embeds: [invalidEmbed] });
                     }

                     const inviteMenu = new StringSelectMenuBuilder()
                        .setCustomId("inviteMenu")
                        .setPlaceholder("Select a realm")
                        .setMaxValues(1)
                        .setMinValues(1)
                    for (const realm of serverData.configedRealms) {
                        inviteMenu.addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel(realm.realmName)
                                .setValue(realm.realmID.toString())
                                .setEmoji(minecraft)
                        );
                    }

                    const row = new ActionRowBuilder()
                        .addComponents(inviteMenu);

                    const embed2 = new EmbedBuilder()
                        .setColor("Orange")
                        .setTitle(`${minecraft} | Realm Code`)
                        .setDescription(`${reply} Select which realm you want to get the invite code for.`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.editReply({ embeds: [embed2], components: [row] });

                    var collector = interaction.channel.createMessageComponentCollector({
                        componentType: ComponentType.StringSelect,
                        filter: (i) => i.user.id === interaction.user.id,
                        time: 30000
                    });

                    collector.on("collect", async (interaction) => {
                        if (!interaction.isStringSelectMenu()) return;
                        if (interaction.customId === "inviteMenu") {
                            const realmId = interaction.values[0];
                            const selectedRealm = serverData.configedRealms.find((realm) => realm.realmID === realmId);
                            if (!selectedRealm) {
                                const invalidEmbed = new EmbedBuilder()
                                    .setColor("#FF0000")
                                    .setTitle(`Error`)
                                    .setDescription(`${reply} I was unable to find the realm you selected, please try again.`)
                                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });
                                return await interaction.editReply({ embeds: [invalidEmbed], components: [] });
                            }

                            try {
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
                                  // realm auth
                                  const response2 = await axios.post(
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
                                  const realm_userhash = response2.data.DisplayClaims.xui[0].uhs;
                                  const realm_token = response2.data.Token;
                                  const response3 = await axios.get(`https://pocket.realms.minecraft.net/links/v1?worldId=${selectedRealm.realmID.toString()}`, {
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
                                const link = response3.data[0].url;
                                const embed3 = new EmbedBuilder()
                                    .setColor("Random")
                                    .setTitle(`${selectedRealm.realmName}`)
                                    .setDescription(`${reply} Invite: ${link}`)
                                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                                await interaction.update({ embeds: [embed3], components: [] });
                                return collector.stop();
                            } catch (error) {
                                console.log(error);
                                return collector.stop();
                            }
                        }
                    });

                    collector.on("end", () => {
                        return collector.stop();
                    });
                } else if (interaction.options.getSubcommand() === "invite") {
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
                    const roleWithPerms = serverData.rolePermissions.some(role => memberRoles.has(role.roleID) && role.permissions.invitePlayersPerms == true);
                    if (!isAdmin && !roleWithPerms) {
                        return interaction.reply({ content: `${alert} You don't have permission to use \`/realm invite\`.`, ephemeral: true });
                    }

                    const gamertag = interaction.options.getString("gamertag");

                    const embed1 = new EmbedBuilder()
                        .setColor("Yellow")
                        .setTitle(`${minecraft} | Realm Invite`)
                        .setDescription(`${reply} Fetching Guild Info ${load}`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.reply({ embeds: [embed1], fetchReply: true });

                    if (serverData.configedRealms.length === 0 || serverData.configedRealms === null) {
                        const invalidEmbed = new EmbedBuilder()
                             .setColor("#FF0000")
                             .setTitle(`${minecraft} | Realm State`)
                             .setDescription(`${reply} You have not configured a realm for the bot to manage yet. Please run \`/config realm\`.`)
                             .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });
                             
                         return await interaction.editReply({ embeds: [invalidEmbed] });
                     }

                    const inviteMenu = new StringSelectMenuBuilder()
                        .setCustomId("inviteMenu")
                        .setPlaceholder("Select a realm")
                        .setMaxValues(1)
                        .setMinValues(1)
                    for (const realm of serverData.configedRealms) {
                        inviteMenu.addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel(realm.realmName)
                                .setValue(realm.realmID)
                        );
                    };

                    const row = new ActionRowBuilder()
                        .addComponents(inviteMenu);

                    const embed2 = new EmbedBuilder()
                        .setColor("Orange")
                        .setTitle(`${minecraft} | Realm Invite`)
                        .setDescription(`${reply} Select a realm to invite \`${gamertag}\` to`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.editReply({ embeds: [embed2], components: [row] });

                    var collector = interaction.channel.createMessageComponentCollector({
                        componentType: ComponentType.StringSelect,
                        filter: (i) => i.user.id === interaction.user.id,
                        time: 30000
                    });

                    collector.on("collect", async (interaction) => {
                        if (!interaction.isStringSelectMenu()) return;
                        if (interaction.customId === "inviteMenu") {
                            const realmId = interaction.values[0];
                            const selectedRealm = serverData.configedRealms.find((realm) => realm.realmID === realmId);
                            if (!selectedRealm) {
                                const failEmbed = new EmbedBuilder()
                                    .setColor("Red")
                                    .setTitle(`Error`)
                                    .setDescription(`${reply} I was unable to find the realm you selected, please try again.`)
                                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                                await interaction.update({ embeds: [failEmbed], components: [] });
                                return collector.stop();
                            }

                            try {
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
                                  // realm auth
                                  const response2 = await axios.post(
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
                                  // xbl auth for profile search
                                  const response3 = await axios.post('https://xsts.auth.xboxlive.com/xsts/authorize', {
                                        Properties: {
                                            SandboxId: "RETAIL",
                                            UserTokens: [response1.data.Token],
                                        },
                                        RelyingParty: "http://xboxlive.com",
                                        TokenType: "JWT",
                                  });
                                  const realm_token = response2.data.Token
                                  const realm_userhash = response2.data.DisplayClaims.xui[0].uhs
                                  // realms playerlist call 
                                  
                                  const xbox_hash = response3.data.DisplayClaims.xui[0].uhs;
                              const xbox_token = response3.data.Token
                              const response4 = await axios.get(`https://profile.xboxlive.com/users/gt(${(gamertag)})/profile/settings?settings=GameDisplayPicRaw`, {
                                headers: {
                                    "x-xbl-contract-version": "2",
                                    "Authorization": `XBL3.0 x=${xbox_hash};${xbox_token}`,
                                    "Accept-Language": "en-US",
                                    "maxRedirects": 1,
                                }
                              });
                              const xbox_data = response4.data.profileUsers;
                              if (xbox_data) {
                               const XUID = xbox_data[0].id
                               const Gamerpic = xbox_data[0].settings.find(obj => obj.id === 'GameDisplayPicRaw').value
                                const response5 = await axios.put(`https://pocket.realms.minecraft.net/invites/${selectedRealm.realmID.toString()}/invite/update`, {
                                    "invites": {
                                        [XUID]: "ADD"
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

                                const embed4 = new EmbedBuilder()
                                    .setColor("#08F704")
                                    .setTitle(`${minecraft} | Realm Invite`)
                                    .setDescription(`${reply} Successfully invited \`${gamertag}\` to \`${selectedRealm.realmName}\` ${greencheck}`)
                                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                                const embed5 = new EmbedBuilder()
                                    .setColor("#DE3163")
                                    .setTitle(`Player Invite Log`)
                                    .setDescription(`${reply} A new player was invited to \`${selectedRealm.realmName}\`\n\n**__Info:__**\n**Gamertag:** \`${gamertag}\`\n**Invited By:** <@${interaction.user.id}>`)
                                    .setThumbnail(Gamerpic)
                                    .setFooter({ text: `Realm Logs`, iconURL: process.env.ICON_URL });

                                const channelId = serverData.logs.invites.channelID;
                                const channel = interaction.client.channels.cache.get(channelId);
                                if (channel) {
                                    await channel.send({ embeds: [embed5] });
                                }

                                await interaction.update({ embeds: [embed4], components: [] });
                                return collector.stop();
                                }
                            } catch (error) {
                                console.log(error);
                                return collector.stop();
                            }
                        }
                    });

                    collector.on("end", () => {
                        return collector.stop();
                    });

                } else if (interaction.options.getSubcommand() === "permissions") {
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
                    const roleWithPerms = serverData.rolePermissions.some(role => memberRoles.has(role.roleID) && role.permissions.manageRealmPerms == true);
                    if (!isAdmin && !roleWithPerms) {
                        return interaction.reply({ content: `${alert} You don't have permission to use \`/realm permissions\`.`, ephemeral: true });
                    }

                    const embed1 = new EmbedBuilder()
                        .setColor("Yellow")
                        .setTitle(`${minecraft} | Realm Permissions`)
                        .setDescription(`${reply} Fetching Guild Info ${load}`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.reply({ embeds: [embed1] });

                    const permsGranted = interaction.options.getString("permission");
                    const gamertag = interaction.options.getString("gamertag");

                    const permMenu = new StringSelectMenuBuilder()
                        .setCustomId("permMenu")
                        .setPlaceholder("Select a realm")
                        .setMaxValues(1)
                        .setMinValues(1)
                    for (const realm of serverData.configedRealms) {
                        permMenu.addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel(realm.realmName)
                                .setValue(realm.realmID.toString())
                        );
                    };

                    const row = new ActionRowBuilder()
                        .addComponents(permMenu);

                    const embed2 = new EmbedBuilder()
                        .setColor("Orange")
                        .setTitle(`${minecraft} | Realm Permissions`)
                        .setDescription(`${reply} Select a realm below to manage permissions for \`${gamertag}\``)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.editReply({ embeds: [embed2], components: [row] });

                    var collector = interaction.channel.createMessageComponentCollector({
                        componentType: ComponentType.StringSelect,
                        filter: (i) => i.user.id === interaction.user.id,
                        time: 30000
                    });

                    collector.on("collect", async (interaction) => {
                        if (!interaction.isStringSelectMenu()) return;
                        if (interaction.customId === "permMenu") {
                            try {
                                const realmId = interaction.values[0];
                                const selectedRealm = serverData.configedRealms.find((realm) => realm.realmID.toString() === realmId);
                                if (!selectedRealm) {
                                    const failEmbed = new EmbedBuilder()
                                        .setColor("Red")
                                        .setTitle(`${minecraft} | Realm Permissions`)
                                        .setDescription(`${reply} Could not find realm \`${realmId}\`, please try again.`)
                                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });
                                    await interaction.update({ embeds: [failEmbed], ephemeral: true });
                                    return collector.stop();
                                }
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
                                  // realm auth
                                  const response2 = await axios.post(
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
                                  // xbl auth for profile search
                                  const response3 = await axios.post('https://xsts.auth.xboxlive.com/xsts/authorize', {
                                        Properties: {
                                            SandboxId: "RETAIL",
                                            UserTokens: [response1.data.Token],
                                        },
                                        RelyingParty: "http://xboxlive.com",
                                        TokenType: "JWT",
                                  });
                                  const realm_token = response2.data.Token
                                  const realm_userhash = response2.data.DisplayClaims.xui[0].uhs
                                  // realms playerlist call 
                                  
                                  const xbox_hash = response3.data.DisplayClaims.xui[0].uhs;
                              const xbox_token = response3.data.Token
                              const response4 = await axios.get(`https://profile.xboxlive.com/users/gt(${(gamertag)})/profile/settings?settings=GameDisplayPicRaw`, {
                                headers: {
                                    "x-xbl-contract-version": "2",
                                    "Authorization": `XBL3.0 x=${xbox_hash};${xbox_token}`,
                                    "Accept-Language": "en-US",
                                    "maxRedirects": 1,
                                }
                              });
                              const xbox_data = response4.data.profileUsers;
                              if (xbox_data) {
                               const XUID = xbox_data[0].id
                               const Gamerpic = xbox_data[0].settings.find(obj => obj.id === 'GameDisplayPicRaw').value
                                const response5 = await axios.put(`https://pocket.realms.minecraft.net/worlds/${selectedRealm.realmID.toString()}/userPermission`, {
                                    "permission": `${permsGranted}`,
                                    "xuid": `${XUID}`
                                }, {
                                    headers: {
                                        "Accept": "*/*",
                                        "Authorization": `XBL3.0 x=${realm_userhash};${realm_token}`,
                                        "Client-Version": process.env.CLIENT_VERSION,
                                        "User-Agent": "MCPE/UWP",
                                        "Accept-Language": "en-GB, en",
                                        "Accept-Encoding": "gzip, deflate, be",
                                        "Host": "pocket.realms.minecraft.net"
                                    }
                                });
                                
                                const embed3 = new EmbedBuilder()
                                    .setColor("#08F704")
                                    .setTitle(`Permissions Updated!`)
                                    .setDescription(`${reply} Permission level for \`${gamertag}\` has been set to \`${permsGranted}\``)
                                    .setThumbnail(Gamerpic)
                                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                                await interaction.update({ embeds: [embed3], components: [] });
                                return collector.stop();
                            }
                            } catch (error) {
                                console.log(error);
                                return collector.stop();
                            }
                        }
                    });

                    collector.on("end", () => {
                        return collector.stop();
                    });
                    
                } else if (interaction.options.getSubcommand() === "kick") {
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
                    const roleWithPerms = serverData.rolePermissions.some(role => memberRoles.has(role.roleID) && role.permissions.kickPlayerPerms == true);
                    if (!isAdmin && !roleWithPerms) {
                        return interaction.reply({ content: `${alert} You don't have permission to use \`/realm kick\`.`, ephemeral: true });
                    }

                    const embed1 = new EmbedBuilder()
                        .setColor("Yellow")
                        .setTitle(`${minecraft} | Realm Kick`)
                        .setDescription(`${reply} Fetching Guild Info ${load}`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.reply({ embeds: [embed1] });

                    if (serverData.configedRealms.length === 0 || serverData.configedRealms === null) {
                        const invalidEmbed = new EmbedBuilder()
                             .setColor("#FF0000")
                             .setTitle(`${minecraft} | Realm State`)
                             .setDescription(`${reply} You have not configured a realm for the bot to manage yet. Please run \`/config realm\`.`)
                             .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });
                             
                         return await interaction.editReply({ embeds: [invalidEmbed] });
                     }

                    const gamertag = interaction.options.getString("gamertag");
                    const reason = interaction.options.getString("reason") ?? "None provided";

                    const kickMenu = new StringSelectMenuBuilder()
                        .setCustomId("kickMenu")
                        .setPlaceholder("Select a realm")
                        .setMaxValues(1)
                        .setMinValues(1)
                    for (const realm of serverData.configedRealms) {
                        kickMenu.addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel(realm.realmName)
                                .setValue(realm.realmID.toString())
                        );
                    };

                    const row = new ActionRowBuilder()
                        .addComponents(kickMenu);

                    const embed2 = new EmbedBuilder()
                        .setColor("Orange")
                        .setTitle(`${minecraft} | Realm Kick`)
                        .setDescription(`${reply} Select a realm to kick \`${gamertag}\` from.`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.editReply({ embeds: [embed2], components: [row] });

                    var collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 30000 });

                    collector.on("collect", async (interaction) => {
                        if (!interaction.isStringSelectMenu()) return;
                        if (interaction.customId === "kickMenu") {
                            const realmId = interaction.values[0];
                            const selectedRealm = serverData.configedRealms.find((realm) => realm.realmID.toString() === realmId);
                            try {
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
                                  // realm auth
                                  const response2 = await axios.post(
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
                                  // xbl auth for profile search
                                  const response3 = await axios.post('https://xsts.auth.xboxlive.com/xsts/authorize', {
                                        Properties: {
                                            SandboxId: "RETAIL",
                                            UserTokens: [response1.data.Token],
                                        },
                                        RelyingParty: "http://xboxlive.com",
                                        TokenType: "JWT",
                                  });
                                  const realm_token = response2.data.Token
                                  const realm_userhash = response2.data.DisplayClaims.xui[0].uhs
                                  // realms playerlist call 
                                  
                                  const xbox_hash = response3.data.DisplayClaims.xui[0].uhs;
                              const xbox_token = response3.data.Token
                              const response4 = await axios.get(`https://profile.xboxlive.com/users/gt(${(gamertag)})/profile/settings?settings=GameDisplayPicRaw`, {
                                headers: {
                                    "x-xbl-contract-version": "2",
                                    "Authorization": `XBL3.0 x=${xbox_hash};${xbox_token}`,
                                    "Accept-Language": "en-US",
                                    "maxRedirects": 1,
                                }
                              });
                              const xbox_data = response4.data.profileUsers;
                              if (xbox_data) {
                               const XUID = xbox_data[0].id
                               const Gamerpic = xbox_data[0].settings.find(obj => obj.id === 'GameDisplayPicRaw').value
                                const response5 = await axios.put(`https://pocket.realms.minecraft.net/invites/${selectedRealm.realmID.toString()}/invite/update`, {
                                    "invites": {
                                        [XUID]: "REMOVE"
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
                                        //"Connection": "Keep-Alive"
                                    }
                                });
                                const embed3 = new EmbedBuilder()
                                    .setColor("Yellow")
                                    .setAuthor({ name: `Player Kick`, iconURL: process.env.ICON_URL })
                                    .setDescription(`${person} **Gamertag:** \`${gamertag}\`\n${id} **XUID:** \`${XUID}\`\n${minecraft} **Realm:** \`${selectedRealm.realmName}\`\n${automod} **Moderator:** <@${interaction.user.id}>\n${question} **Reason:** \`${reason}\``)
                                    .setThumbnail(Gamerpic)
                                
                                const channelId = serverData.logs.kicks.channelID;
                                const channel = interaction.client.channels.cache.get(channelId);
                                if (channel) {
                                    await channel.send({ embeds: [embed3] });
                                }
                                const embed4 = new EmbedBuilder()
                                    .setColor("#08F704")
                                    .setTitle(`Player Kicked!`)
                                    .setDescription(`${reply} \`${gamertag}\` was just kicked from \`${selectedRealm.realmName}\`!`)
                                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                                interaction.update({ embeds: [embed4], components: [] });
                                return collector.stop();
                            }
                            } catch (error) {
                                console.log(error);
                                return collector.stop();
                            }
                        }
                    });

                    collector.on("end", () => {
                        return collector.stop();
                    });
                } else if (interaction.options.getSubcommand() === "slot") {
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
                    const roleWithPerms = serverData.rolePermissions.some(role => memberRoles.has(role.roleID) && role.permissions.manageRealmPerms == true);
                    if (!isAdmin && !roleWithPerms) {
                        return interaction.reply({ content: `${alert} You don't have permission to use \`/realm slot\`.`, ephemeral: true });
                    }

                    const slot = interaction.options.getString("options");
                    let slotNum;
                    if (slot === "1") slotNum = 1;
                    if (slot === "2") slotNum = 2;
                    if (slot === "3") slotNum = 3;

                    const embed1 = new EmbedBuilder()
                        .setColor("Yellow")
                        .setTitle(`${minecraft} | Realm Slot`)
                        .setDescription(`${reply} Fetching Guild Info ${load}`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.reply({ embeds: [embed1] });

                    if (serverData.configedRealms.length === 0 || serverData.configedRealms === null) {
                        const invalidEmbed = new EmbedBuilder()
                             .setColor("#FF0000")
                             .setTitle(`${minecraft} | Realm State`)
                             .setDescription(`${reply} You have not configured a realm for the bot to manage yet. Please run \`/config realm\`.`)
                             .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });
                             
                         return await interaction.editReply({ embeds: [invalidEmbed] });
                     }

                    const slotMenu = new StringSelectMenuBuilder()
                        .setCustomId("slotMenu")
                        .setPlaceholder("Select a realm")
                        .setMaxValues(1)
                        .setMinValues(1)
                    for (const realm of serverData.configedRealms) {
                        slotMenu.addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel(realm.realmName)
                                .setValue(realm.realmID.toString())
                        );
                    };

                    const row = new ActionRowBuilder()
                        .addComponents(slotMenu);

                    const embed2 = new EmbedBuilder()
                        .setColor("Orange")
                        .setTitle(`${minecraft} | Realm Slot`)
                        .setDescription(`${reply} Select a realm to change the active slot for.`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.editReply({ embeds: [embed2], components: [row] });

                    var collector = interaction.channel.createMessageComponentCollector({
                        componentType: ComponentType.StringSelect,
                        filter: (i) => i.user.id === interaction.user.id,
                        time: 30000
                    });

                    collector.on("collect", async (interaction) => {
                        if (!interaction.isStringSelectMenu()) return;
                        if (interaction.customId === "slotMenu") {
                            const realmId = interaction.values[0];
                            const selectedRealm = serverData.configedRealms.find((realm) => realm.realmID === realmId);
                            try {
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
                                  // realm auth
                                  const response2 = await axios.post(
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
                                  const realm_userhash = response2.data.DisplayClaims.xui[0].uhs;
                                  const realm_token = response2.data.Token;

                                  var SlotChange = {
                                    method: "put",
                                    url: `https://pocket.realms.minecraft.net/worlds/${selectedRealm.realmID.toString()}/slot/${slotNum}`,
                                    headers: {
                                        "Accept": "*/*",
                                        "Authorization": `XBL3.0 x=${realm_userhash};${realm_token}`,
                                        "Client-Version": process.env.CLIENT_VERSION,
                                        "User-Agent": "MCPE/UWP",
                                        "Accept-Language": "en-GB, en",
                                        "Accept-Encoding": "gzip, deflate, be",
                                        "Host": "pocket.realms.minecraft.net",
                                    }
                                  }

                                  await axios(SlotChange);

                                  const embed3 = new EmbedBuilder()
                                    .setColor("#08F704")
                                    .setTitle("Slot Changed!")
                                    .setDescription(`Active slot for \`${selectedRealm.realmName}\` has been changed to \`${slot}\`.`)
                                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                                await interaction.update({ embeds: [embed3], components: [] });
                                return collector.stop();
                            } catch (error) {
                                console.log(error);
                                return collector.stop();
                            }
                        }
                    });
                } else if (interaction.options.getSubcommand() === "panel") {
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
                    const roleWithPerms = serverData.rolePermissions.some(role => memberRoles.has(role.roleID) && role.permissions.manageRealmPerms == true);
                    if (!isAdmin && !roleWithPerms) {
                        return interaction.reply({ content: `${alert} You don't have permission to use \`/realm panel\`.`, ephemeral: true });
                    }

                    const embed1 = new EmbedBuilder()
                        .setColor("Yellow")
                        .setTitle(`${minecraft} | Realm Panel`)
                        .setDescription(`${reply} Fetching Guild Info ${load}`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.reply({ embeds: [embed1] });

                    if (serverData.configedRealms.length === 0) {
                        const failEmbed = new EmbedBuilder()
                            .setColor("Red")
                            .setTitle(`${redcross} | Error`)
                            .setDescription(`${reply} You have not configured any realms yet, please run \`/config realm\``)
                            .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                        return await interaction.editReply({ embeds: [failEmbed] });
                    }

                    const panelMenu = new StringSelectMenuBuilder()
                        .setCustomId("panelMenu")
                        .setPlaceholder("Select a realm")
                        .setMaxValues(1)
                        .setMinValues(1)
                    for (const realm of serverData.configedRealms) {
                        panelMenu.addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel(realm.realmName)
                                .setValue(realm.realmID.toString())
                        )
                    };

                    const row = new ActionRowBuilder()
                        .addComponents(panelMenu);

                    const embed2 = new EmbedBuilder()
                        .setColor("Orange")
                        .setTitle(`${minecraft} | Realm Panel`)
                        .setDescription(`${reply} Select a realm to display the panel for:`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.editReply({ embeds: [embed2], components: [row] });

                    // Panel Buttons + Lockdown Embed

                    const row2 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId("lockdown")
                                .setLabel("Realm Lockdown")
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji(shield),
                            new ButtonBuilder()
                                .setCustomId("realmScan")
                                .setLabel("Realm Scan")
                                .setStyle(ButtonStyle.Success)
                                .setEmoji(search)
                        );

                    const row3 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId("lockdownEnable")
                                .setLabel("Enable Lockdown")
                                .setStyle(ButtonStyle.Success)
                                .setEmoji(greencheck),
                            new ButtonBuilder()
                                .setCustomId("lockdownDisable")
                                .setLabel("Disable Lockdown")
                                .setStyle(ButtonStyle.Danger)
                                .setEmoji(redcross)
                        )

                    const panelEmbed = new EmbedBuilder()
                        .setColor("Orange")
                        .setTitle(`${minecraft} | Realm Panel`)
                        .setDescription(`${reply} Hello **${interaction.user.tag}**, select an option below:`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });
                    
                    const lockdownEmbedStart = new EmbedBuilder()
                        .setColor("Orange")
                        .setTitle(`${shield} | Realm Lockdown`)
                        .setDescription(`${reply} Select an option for \`Realm Lockdown\`:`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    var menuCollector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000 });

                    var buttonCollector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

                    menuCollector.on("collect", async (interaction) => {
                        if (!interaction.isStringSelectMenu()) return;
                        if (interaction.customId === "panelMenu") {
                            const realmId = interaction.values[0];
                            const selectedRealm = serverData.configedRealms.find(realm => realm.realmID === realmId);
                            if (!selectedRealm) {
                                const failEmbed = new EmbedBuilder()
                                    .setColor("Red")
                                    .setTitle(`${redcross} | Error`)
                                    .setDescription(`${reply} Realm not found, please run \`/config realm\``)
                                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                                await interaction.update({ embeds: [failEmbed] });
                                return menuCollector.stop();
                            }

                            await interaction.update({ embeds: [panelEmbed], components: [row2] });

                            buttonCollector.on("collect", async (interaction) => {
                                if (!interaction.isButton()) return;

                                
                                if (interaction.customId === "lockdown") {
                                    await interaction.update({ embeds: [lockdownEmbedStart], components: [row3] });
                                // Realm Scan: DISABLED
                                } else if (interaction.customId === "realmScan") {

                                    const tempEmbed = new EmbedBuilder()
                                        .setColor("Random")
                                        .setTitle(`Error`)
                                        .setDescription(`This feature is not implemented yet.`)

                                    await interaction.update({ embeds: [tempEmbed], components: [] });
                                    await menuCollector.stop();
                                    await buttonCollector.stop();
                                    return;

                                    /*
                                    const scanStartEmbed = new EmbedBuilder()
                                        .setColor("Yellow")
                                        .setTitle(`${search} | Realm Scan`)
                                        .setDescription(`${reply} Scanning \`${selectedRealm.realmName}\` for suspicious accounts ${load}`)
                                        .setFooter({ text: `This may take some time to process.` })

                                    await interaction.update({ embeds: [scanStartEmbed], components: [] });

                                    try {
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
                                          // realm auth
                                          const response2 = await axios.post(
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
                                          const realm_userhash = response2.data.DisplayClaims.xui[0].uhs;
                                          const realm_token = response2.data.Token;
                                          const response3 = await axios.get(`https://pocket.realms.minecraft.net/worlds/${selectedRealm.realmID.toString()}`, {
                                            headers: {
                                                "Accept": "",
                                                "Authorization": `XBL3.0 x=${realm_userhash};${realm_token}`,
                                                "Client-Version": process.env.CLIENT_VERSION,
                                                "User-Agent": "MCPE/UWP",
                                                "Accept-Language": "en-GB, en",
                                                "Accept-Encoding": "gzip, deflate, be",
                                                "Host": "pocket.realms.minecraft.net",
                                            }
                                          });

                                          

                                          if (response3.data) {
                                            // Authenticate the Realm Owner to Xbox Live
                                            const response4 = await axios.post('https://xsts.auth.xboxlive.com/xsts/authorize', {
                                                Properties: {
                                                    SandboxId: 'RETAIL',
                                                    UserTokens: [response1.data.Token],
                                                },
                                                RelyingParty: "http://xboxlive.com",
                                                TokenType: 'JWT',
                                            });

                                            const xbox_token = response4.data.Token;
                                            const xbox_hash = response4.data.DisplayClaims.xui[0].uhs;

                                            const players = response3.data.players;

                                            let RealmPlayerlist = []; // final array
                                            let player_collection = []; // first initial array of players
                                            let xuid_collection = []; // xuid collection for the batch endpoints
                                            for (const player of players) {
                                                const XUID = player.uuid;
                                                xuid_collection.push(XUID);
                                            }

                                            setTimeout(async () => {
                                                const response5 = await axios.post(
                                                    `https://profile.xboxlive.com/users/batch/profile/settings`,
                                                    { userIds: xuid_collection, settings: ["Gamertag", "Gamerscore"] },
                                                    {
                                                        headers: {
                                                            'Accept': '', 
                                                            'Authorization': `XBL3.0 x=${xbox_hash};${xbox_token}`, 
                                                            'Content-Type': 'application/json; charset=utf-8', 
                                                            'x-xbl-contract-version': 3, 
                                                            'Accept-Encoding': 'gzip, deflate, br', 
                                                            'Host': 'profile.xboxlive.com', 
                                                            'Connection': 'Keep-Alive', 
                                                            'Cache-Control': 'no-cache',
                                                        }
                                                    }
                                                )

                                                const bulkData = response5.data.profileUsers;

                                                await bulkData.forEach(async (data) => {
                                                    const Gamerscore = data.settings.find(obj => obj.id === 'Gamerscore').value
                                                    const Gamertag = data.settings.find(obj => obj.id === 'Gamertag').value
                                                    const xuid = data.id;
                                                    if (Gamerscore < 430) {

                                                        RealmPlayerlist.push(
                                                            {
                                                                Gamertag: Gamertag,
                                                                XUID: xuid,
                                                                Gamerscore: Gamerscore,
                                                            }
                                                        );

                                                    }
                                                });
                                                const accountsButton = new ButtonBuilder()
                                                    .setStyle(ButtonStyle.Danger)
                                                    .setLabel("View Accounts")
                                                    .setEmoji(`${warn}`)
                                                    .setCustomId("viewAccounts");

                                                const row4 = new ActionRowBuilder()
                                                    .addComponents(accountsButton);

                                                const successEmbed = new EmbedBuilder()
                                                    .setColor(`Orange`)
                                                    .setTitle(`${search} | Realm Scan`)
                                                    .setDescription(`${reply} Realm Scan Complete ${greencheck}\n\n**Result:**\n**Possible Bot Accounts:** \`${RealmPlayerlist.length}\``)
                                                    .setFooter({ text: `Click the View Accounts button below to see the list of possible bots. Keep in mind accounts on this list are NOT 100% bots, only suspected.` })

                                                await interaction.editReply({ embeds: [successEmbed], components: [row4] });

                                                const lastCollector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button, time: 20000 });

                                                lastCollector.on("collect", async (interaction) => {
                                                    if (interaction.isButton()) {
                                                        if (interaction.customId === "viewAccounts") {
                                                            let number = 0;
                                                            const listEmbed = new EmbedBuilder()
                                                                .setColor(`Red`)
                                                                .setTitle(`Possible Bots in ${selectedRealm.realmName}`)
                                                                .setDescription(`${RealmPlayerlist.map((player) => `${number += 1}. \`${player.Gamertag}\`\n  - *Gamerscore:* \`${player.Gamerscore}\`\n  - *XUID:* \`${player.XUID}\``).join("\n")}`)
                    
                                                            await interaction.reply({ embeds: [listEmbed], components: [], ephemeral: true });

                                                            await menuCollector.stop();
                                                            await buttonCollector.stop();
                                                            return await lastCollector.stop();
                                                        }
                                                    }
                                                });

                                                lastCollector.on("end", async () => {
                                                    return lastCollector.stop();
                                                });

                                            }, 2000); // 2 second delay per player, avoiding rate limit
                                          }
                                    } catch (error) {
                                        console.log(error);
                                    }
                                    */
                                } 
                                

                                if (interaction.customId === "lockdownEnable") {
                                    selectedRealm.settings.lockdown = true;
                                    const enabledEmbed = new EmbedBuilder()
                                        .setColor("#08F704")
                                        .setTitle(`${shield} | Realm Lockdown`)
                                        .setDescription(`${reply} Realm Lockdown enabled for \`${selectedRealm.realmName}\``)
                                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                                    await interaction.update({ embeds: [enabledEmbed], components: [] });
                                    await serverData.save();
                                    await menuCollector.stop();
                                    return await buttonCollector.stop();
                                } else if (interaction.customId === "lockdownDisable") {
                                    selectedRealm.settings.lockdown = false;
                                    const disabledEmbed = new EmbedBuilder()
                                        .setColor("#08F704")
                                        .setTitle(`${shield} | Realm Lockdown`)
                                        .setDescription(`${reply} Realm Lockdown disabled for \`${selectedRealm.realmName}\``)
                                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                                    await interaction.update({ embeds: [disabledEmbed], components: [] });
                                    await serverData.save();
                                    await menuCollector.stop();
                                    return await buttonCollector.stop();
                                }
                            });
                        }
                    });

                    

                    buttonCollector.on("end", () => {
                        return buttonCollector.stop();
                    });

                    menuCollector.on("end", () => {
                        return menuCollector.stop();
                    });
                } else if (interaction.options.getSubcommand() === "operators") {
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
                    const roleWithPerms = serverData.rolePermissions.some(role => memberRoles.has(role.roleID) && role.permissions.manageRealmPerms == true);
                    if (!isAdmin && !roleWithPerms) {
                        return interaction.reply({ content: `${alert} You don't have permission to use \`/realm operators\`.`, ephemeral: true });
                    }

                    if (!serverData.configedRealms.length > 0) {
                        return interaction.reply({ content: `${alert} You have no configed any realms yet, please run \`/config realm\``, ephemeral: true });
                    }

                    const embed = new EmbedBuilder()
                        .setColor("Yellow")
                        .setTitle(`${operator} | Realm Operators`)
                        .setDescription(`${reply} Fetching Guild Info ${load}`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.reply({ embeds: [embed] });

                    const opMenu = new StringSelectMenuBuilder()
                        .setCustomId("opMenu")
                        .setPlaceholder("Select a realm")
                        .setMaxValues(1)
                        .setMinValues(1)
                    for (const realm of serverData.configedRealms) {
                        opMenu.addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel(`${realm.realmName}`)
                                .setValue(realm.realmID)
                        )
                    }

                    const row = new ActionRowBuilder()
                        .addComponents(opMenu);

                    const embed2 = new EmbedBuilder()
                        .setColor("Orange")
                        .setTitle(`${operator} | Realm Operators`)
                        .setDescription(`${reply} Select a realm to view its operator list:`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.editReply({ embeds: [embed2], components: [row] });

                    var collector = interaction.channel.createMessageComponentCollector({
                        componentType: ComponentType.StringSelect,
                        filter: (i) => i.user.id === interaction.user.id,
                        time: 60000
                    });

                    collector.on("collect", async (interaction) => {
                        if (interaction.customId === "opMenu") {
                            const realmId = interaction.values[0];
                            const selectedRealm = serverData.configedRealms.find((realm) => realm.realmID === realmId);
                            if (!selectedRealm) {
                                const failEmbed = new EmbedBuilder()
                                    .setColor("Red")
                                    .setTitle(`Error`)
                                    .setDescription(`I was unable to find the realm you selected, please re-run this command.`)
                                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                                return await interaction.update({ embeds: [failEmbed], components: [] });
                            }

                            const embed3 = new EmbedBuilder()
                                .setColor("Yellow")
                                .setTitle(`${operator} | Realm Operators`)
                                .setDescription(`${reply} Fetching operator list for \`${selectedRealm.realmName}\` ${load}`)
                                .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                            await interaction.update({ embeds: [embed3], components: [] });

                            try {
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
                                  // realm auth
                                  const response2 = await axios.post(
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
                                  const realm_userhash = response2.data.DisplayClaims.xui[0].uhs;
                                  const realm_token = response2.data.Token;
                                  const response3 = await axios.get(`https://pocket.realms.minecraft.net/worlds/${selectedRealm.realmID.toString()}`, {
                                        headers: {
                                            "Accept": "",
                                            "Authorization": `XBL3.0 x=${realm_userhash};${realm_token}`,
                                            "Client-Version": process.env.CLIENT_VERSION,
                                            "User-Agent": "MCPE/UWP",
                                            "Accept-Language": "en-GB, en",
                                            "Accept-Encoding": "gzip, deflate, be",
                                            "Host": "pocket.realms.minecraft.net",
                                        }
                                });

                                const players = response3.data.players;
                                let xuid_collection = [];
                                for (const player of players) {
                                    if (player.operator === true) {
                                        const xuid = player.uuid;
                                        xuid_collection.push(xuid);
                                    }
                                }

                                // Authenticate the Realm Owner to Xbox Live
                                const response4 = await axios.post('https://xsts.auth.xboxlive.com/xsts/authorize', {
                                    Properties: {
                                        SandboxId: 'RETAIL',
                                        UserTokens: [response1.data.Token],
                                    },
                                    RelyingParty: "http://xboxlive.com",
                                    TokenType: 'JWT',
                                });
                                const xbox_hash = response4.data.DisplayClaims.xui[0].uhs;
                                const xbox_token = response4.data.Token;

                                const response5 = await axios.post(
                                    `https://profile.xboxlive.com/users/batch/profile/settings`,
                                    { userIds: xuid_collection, settings: ["Gamertag", "Gamerscore"] },
                                    {
                                        headers: {
                                            'Accept': '*/*', 
                                            'Authorization': `XBL3.0 x=${xbox_hash};${xbox_token}`, 
                                            'Content-Type': 'application/json', 
                                            'x-xbl-contract-version': 3, 
                                            'Accept-Encoding': 'gzip, deflate, br', 
                                            'Host': 'profile.xboxlive.com', 
                                            'Connection': 'Keep-Alive', 
                                            'Cache-Control': 'no-cache',
                                        }
                                    }
                                )
                                let operator_list = [];
                                const operators = response5.data.profileUsers;
                                for (const operator of operators) {
                                    operator_list.push(
                                        {
                                            Gamertag: operator.settings.find(obj => obj.id === "Gamertag").value,
                                            Gamerscore: operator.settings.find(obj => obj.id === "Gamerscore").value,
                                            XUID: operator.id
                                        }
                                    )
                                }

                                let number = 1;
                                const embed4 = new EmbedBuilder()
                                    .setColor("Gold")
                                    .setTitle(`${operator} | Realm Operators`)
                                    .setDescription(`${reply} Operator List Retrieved ${greencheck}\n**Operator Count:** \`${operator_list.length}\`\n\n` + `\`\`\`js\n${operator_list.map((data) => `${number++}. ${data.Gamertag} | Gamerscore: ${data.Gamerscore} | XUID: ${data.XUID}`).join("\n")}\`\`\``)

                                await interaction.editReply({ embeds: [embed4], components: [] });
                                await collector.stop();
                                return;

                            } catch (error) {
                                console.log(error);
                            }
                        }
                    });

                    collector.on("end", () => {
                        return collector.stop();
                    });

                    // Endpoint doesn't currently work, command is disabled
                } else if (interaction.options.getSubcommand() === "rename") {
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
                    const roleWithPerms = serverData.rolePermissions.some(role => memberRoles.has(role.roleID) && role.permissions.renameRealmPerms == true);
                    if (!isAdmin && !roleWithPerms) {
                        return interaction.reply({ content: `${alert} You don't have permission to use \`/realm rename\`.`, ephemeral: true });
                    }

                    if (!serverData.configedRealms.length > 0) {
                        return interaction.reply({ content: `${alert} You have no configed any realms yet, please run \`/config realm\``, ephemeral: true });
                    }

                    const newName = interaction.options.getString("name");

                    const embed = new EmbedBuilder()
                        .setColor("Yellow")
                        .setTitle(`${minecraft} | Realm Rename`)
                        .setDescription(`${reply} Fetching Guild Info ${load}`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.reply({ embeds: [embed] });

                    const renameMenu = new StringSelectMenuBuilder()
                        .setCustomId("renameMenu")
                        .setPlaceholder("Select a realm")
                        .setMaxValues(1)
                        .setMinValues(1)
                    for (const realm of serverData.configedRealms) {
                        renameMenu.addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel(realm.realmName)
                                .setValue(realm.realmID)
                        )
                    }

                    const row = new ActionRowBuilder()
                        .addComponents(renameMenu);

                    const embed2 = new EmbedBuilder()
                        .setColor("Orange")
                        .setTitle(`${minecraft} | Realm Rename`)
                        .setDescription(`${reply} Select a realm you want renamed to \`${newName}\``)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.editReply({ embeds: [embed2], components: [row] });

                    var collector = interaction.channel.createMessageComponentCollector({
                        componentType: ComponentType.StringSelect,
                        filter: (i) => i.user.id === interaction.user.id,
                        time: 30000
                    });


                    collector.on("collect", async (interaction) => {
                        if (interaction.customId === "renameMenu") {
                            const realmId = interaction.values[0];
                            const selectedRealm = serverData.configedRealms.find((realm) => realm.realmID === realmId);

                            if (!selectedRealm) {
                                const failEmbed = new EmbedBuilder()
                                    .setColor("Red")
                                    .setTitle("Error")
                                    .setDescription("I was unable to find the realm you selected, please re-run this command.")

                                await interaction.update({ embeds: [failEmbed], components: [] });
                                return collector.stop();
                            }

                            const embed3 = new EmbedBuilder()
                                .setColor("Yellow")
                                .setTitle(`${minecraft} | Realm Rename`)
                                .setDescription(`${reply} Renaming \`${selectedRealm.realmName}\` ${load}`)
                                .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                            await interaction.update({ embeds: [embed3], components: [] });

                            try {
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
                                  // realm auth
                                  const response2 = await axios.post(
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
                                  const realm_userhash = response2.data.DisplayClaims.xui[0].uhs;
                                  const realm_token = response2.data.Token;
                                  const headers = {
                                    headers: {
                                      'Accept': '*/*',
                                      'authorization': `XBL3.0 x=${realm_userhash};${realm_token}`,
                                      'charset': 'utf-8',
                                      'client-version': '1.20.72',
                                  } };
                                  const payload = {
                                    "description": { "description": "", "name": `${newName}` },
                                    "options": { "worldTemplateId": -1, "worldTemplateImage": "" }
                                  };
                                  const response3 = await axios.post(`https://pocket.realms.minecraft.net/worlds/${selectedRealm.realmID.toString()}/configuration`, payload, headers);

                                const embed4 = new EmbedBuilder()
                                    .setColor("#08F704")
                                    .setTitle(`${minecraft} | Realm Rename`)
                                    .setDescription(`${reply} Renamed \`${selectedRealm.realmName}\` to \`${newName}\` ${greencheck}`)
                                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                                await interaction.editReply({ embeds: [embed4], components: [] });
                                selectedRealm.realmName = newName;
                                await serverData.save();
                                return collector.stop();
                            } catch (error) {
                                console.log(error);
                            }
                        }
                    });

                    collector.on("end", () => {
                        return collector.stop();
                    });
                } else if (interaction.options.getSubcommand() === "backup") {
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
                    const roleWithPerms = serverData.rolePermissions.some(role => memberRoles.has(role.roleID) && role.permissions.renameRealmPerms == true);
                    if (!isAdmin && !roleWithPerms) {
                        return interaction.reply({ content: `${alert} You don't have permission to use \`/realm rename\`.`, ephemeral: true });
                    }

                    if (!serverData.configedRealms.length > 0) {
                        return interaction.reply({ content: `${alert} You have no configed any realms yet, please run \`/config realm\``, ephemeral: true });
                    }

                    const embed = new EmbedBuilder()
                        .setColor("Yellow")
                        .setTitle(`${minecoin} | Realm Backup`)
                        .setDescription(`${reply} Fetching Guild Info ${load}`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.reply({ embeds: [embed] });

                    const backupMenu = new StringSelectMenuBuilder()
                        .setCustomId("backupMenu")
                        .setPlaceholder("Select a realm")
                        .setMaxValues(1)
                        .setMinValues(1)
                    for (const realm of serverData.configedRealms) {
                        backupMenu.addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel(realm.realmName)
                                .setValue(realm.realmID.toString())
                                .setEmoji(minecraft)
                        )
                    }

                    const row = new ActionRowBuilder()
                        .addComponents(backupMenu);

                    const embed2 = new EmbedBuilder()
                        .setColor("Orange")
                        .setTitle(`${minecoin} | Realm Backup`)
                        .setDescription(`${reply} Select a realm to backup:`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.editReply({ embeds: [embed2], components: [row] });

                    var collector = interaction.channel.createMessageComponentCollector({
                        componentType: ComponentType.StringSelect,
                        filter: (i) => i.user.id === interaction.user.id,
                        time: 30000
                    });

                    collector.on("collect", async (interaction) => {
                        if (interaction.customId === "backupMenu") {
                            const realmId = interaction.values[0];
                            const selectedRealm = serverData.configedRealms.find(realm => realm.realmID.toString() === realmId);
                            if (!selectedRealm) {
                                const failEmbed = new EmebdBuilder()
                                    .setColor("Red")
                                    .setTitle(`${redcross} | Error`)
                                    .setDescription(`${reply} I was unable to find the realm you selected, please try again!`)
                                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                                await interaction.update({ embeds: [failEmbed], components: [] });
                                return collector.stop();
                            }

                            const embed3 = new EmbedBuilder()
                                .setColor("Yellow")
                                .setTitle(`${minecoin} | Realm Backup`)
                                .setDescription(`${reply} Fetching Backup Data ${load}`)
                                .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                            await interaction.update({ embeds: [embed3], components: [] });

                            try {
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
                                  // realm auth
                                  const response2 = await axios.post(
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
                                  const realm_userhash = response2.data.DisplayClaims.xui[0].uhs;
                                  const realm_token = response2.data.Token;

                                    const response3 = await axios.get(`https://pocket.realms.minecraft.net/worlds/${selectedRealm.realmID.toString()}/backups`, {
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

                                    let tempBackupList = []; // so we can access a little bit of data later

                                    if (response3.data.backups) {
                                        const selectMenu = new StringSelectMenuBuilder()
                                        .setCustomId("selectMenu")
                                        .setPlaceholder("Select a backup")
                                        .setMaxValues(1)
                                        .setMinValues(1)
                                    for (const backup of response3.data.backups) {

                                        const date = backup.backupId;

                                        const newDate = new Date(date);

                                        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

                                        // further formating
                                        const day = newDate.getUTCDate() || "Unknown";
                                        const month = monthNames[newDate.getUTCMonth()] || "Unknown";
                                        const year = newDate.getUTCFullYear() || "Unknown";
                                        const hours = newDate.getUTCHours() || "Unknown";
                                        const minutes = newDate.getUTCMinutes() || "Unknown";
                                        const seconds = newDate.getUTCSeconds() || "Unknown";

                                        const formattedDate = `${month} ${day}, ${year}`;
                                        const formattedTime = `${hours}:${minutes}:${seconds}`;

                                        const finalDate = `${formattedDate} | ${formattedTime}`;

                                        const worldSize = backup.size;
                                        const formattedSize = formatSize(worldSize);

                                        const name = backup.metadata.name || "Unknown";

                                        tempBackupList.push(
                                            {
                                                backupId: backup.backupId,
                                                fullDate: finalDate,
                                                realmSize: formattedSize
                                            }
                                        );

                                        selectMenu.addOptions(
                                            new StringSelectMenuOptionBuilder()
                                                .setLabel(`${finalDate} UTC`)
                                                .setDescription(`Realm Name: ${name} | Realm Size: ${formattedSize}`)
                                                .setValue(backup.backupId)
                                                .setEmoji(`${minecraft}`)
                                        )
                                    }

                                    const row2 = new ActionRowBuilder()
                                        .addComponents(selectMenu);

                                    const embed4 = new EmbedBuilder()
                                        .setColor("Orange")
                                        .setTitle(`${minecoin} | Realm Backup`)
                                        .setDescription(`${reply} Select a backup to restore for \`${selectedRealm.realmName}\`:`)
                                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                                    await interaction.editReply({ embeds: [embed4], components: [row2] });

                                    var collectorTwo = interaction.channel.createMessageComponentCollector({
                                        componentType: ComponentType.StringSelect,
                                        filter: (i) => i.user.id === interaction.user.id,
                                        time: 30000
                                    });

                                    collectorTwo.on("collect", async (interaction) => {
                                        const backupId = interaction.values[0];
                                        const thisBackup = tempBackupList.find((x) => x.backupId === backupId);
                                        const thisSize = thisBackup.realmSize;
                                        const thisDate = thisBackup.fullDate;
                                        try {
                                            if (interaction.customId === "selectMenu") {
                                                if (!backupId) {
                                                    const failEmbed = new EmbedBuilder()
                                                        .setColor("Red")
                                                        .setTitle(`${minecoin} | Realm Backup`)
                                                        .setDescription(`${reply} Unable to find the selected backup, try again.`)
                                                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });
    
                                                    await interaction.update({ embeds: [failEmbed] });
                                                    return collectorTwo.stop();
                                                }
    
                                                const embed5 = new EmbedBuilder()
                                                    .setColor("Yellow")
                                                    .setTitle(`${minecoin} | Realm Backup`)
                                                    .setDescription(`${reply} Restoring \`${selectedRealm.realmName}\` to \`${thisDate}\` ${load}`)
                                                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });
    
                                                await interaction.update({ embeds: [embed5], components: [] });
    
                                                var BackupRealm = {
                                                    method: "put",
                                                    url: `https://pocket.realms.minecraft.net/worlds/${selectedRealm.realmID.toString()}/backups?backupId=${backupId}&clientSupportsRetries`,
                                                    headers: {
                                                        "Accept": "*/*",
                                                        "Authorization": `XBL3.0 x=${realm_userhash};${realm_token}`,
                                                        "Client-Version": process.env.CLIENT_VERSION,
                                                        "User-Agent": "MCPE/UWP",
                                                        "Accept-Language": "en-GB, en",
                                                        "Accept-Encoding": "gzip, deflate, be",
                                                        "Host": "pocket.realms.minecraft.net",
                                                    }
                                                }
    
                                                await axios(BackupRealm).then(async (result) => {
                                                    if (result.status === 204) {
                                                        const embed6 = new EmbedBuilder()
                                                            .setColor(0x00FF00)
                                                            .setTitle(`${minecoin} | Backup Loaded!`)
                                                            .setDescription(`${reply} \`${selectedRealm.realmName}\` was successfully restored!\n\n${calander} **Restored to:** \`${thisDate}\`\n${minecraft} **World Size:** \`${thisSize}\``)
                                                            .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });
    
                                                        await interaction.editReply({ embeds: [embed6], components: [] });
                                                        await collectorTwo.stop();
                                                        return collector.stop();
                                                    }

                                                    if (result.status === 503) {
                                                        const embed6 = new EmbedBuilder()
                                                            .setColor(0x00FF00)
                                                            .setTitle(`${minecoin} | Backup Loaded!`)
                                                            .setDescription(`${reply} \`${selectedRealm.realmName}\` was successfully restored!\n\n${calander} **Restored to:** \`${thisDate}\`\n${minecraft} **World Size:** \`${thisSize}\``)
                                                            .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });
    
                                                        await interaction.editReply({ embeds: [embed6], components: [] });
                                                        await collectorTwo.stop();
                                                        return collector.stop();
                                                    }
                                                });
                                            }
                                        } catch (error) {
                                            const embed6 = new EmbedBuilder()
                                                .setColor(0x00FF00)
                                                .setTitle(`${minecoin} | Backup Loaded!`)
                                                .setDescription(`${reply} \`${selectedRealm.realmName}\` was successfully restored!\n\n${calander} **Restored to:** \`${thisDate}\`\n${minecraft} **World Size:** \`${thisSize}\``)
                                                .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });
    
                                            await interaction.editReply({ embeds: [embed6], components: [] });
                                            await collectorTwo.stop();
                                            return collector.stop();
                                        }
                                    });

                                    collectorTwo.on("end", () => {
                                        return collectorTwo.stop();
                                    });
                                    }

                            } catch (error) {
                                console.log(error);
                            }
                        }
                    });

                    collector.on("end", () => {
                        return collector.stop();
                    });
                }
            }
        }

        function getList(listData) {
            let line = listData.map((data) => {
                const gamertagObj = data.find(obj => obj.id === 'Gamertag');
                const gamerscoreObj = data.find(obj => obj.id === 'Gamerscore');
        
                if (gamertagObj && gamerscoreObj) {
                    const gamertag = gamertagObj.value;
                    const gamerscore = gamerscoreObj.value;
                    return `${person} ${gamertag}\n  - ${id} *Gamerscore:* \`${gamerscore}\``;
                } else {
                    return "N/A";
                }
            }).join("\n");
        
            return line;
        }

        function formatSize(worldSize) {
            const units = ["Bytes", "KB", "MB", "GB", "TB"];
            let size = worldSize;
            let unitIndex = 0;

            // Loop to find the appropriate unit
            while (size >= 1024 && unitIndex < units.length - 1) {
                size /= 1024;
                unitIndex++;
            }

            // Limit the size to two decimal places
            size = size.toFixed(2);

            // Return the formatted size with unit
            return `${size} ${units[unitIndex]}`;
        }
        