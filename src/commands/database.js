const {
    SlashCommandBuilder,
    ModalBuilder,
    ActionRowBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    EmbedBuilder
} = require("discord.js");
const crypto = require("crypto");
const { createCanvas, registerFont, loadImage } = require("canvas");
const userDB = require("../models/userDB");
const serverDB = require("../models/serverDB");
const hackerDB = require("../models/hackerDB");
const discordDB = require("../models/discordDB");
const reportDB = require("../models/reportDB");
const reportDBDiscord = require("../models/reportDBDiscord");
const realmProfileDB = require("../models/realmProfileDB");
const mongoose = require("mongoose");
const dbid = crypto.randomBytes(15).toString("hex");
let discordDbidGen = crypto.randomBytes(20).toString("hex");
const profileIDGenerator = crypto.randomBytes(7).toString("hex");
require("dotenv").config()
const { authenticate } = require("@xboxreplay/xboxlive-auth");
const XboxLiveAPI = require("@xboxreplay/xboxlive-api");
const { reply, load, alert, search, greencheck, id, warn, xuidd, database, autoMod, minecraft, person, reason, question, discord } = require("../utility/emojis");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("database")
        .setDescription("Commands to interact with the Realms+ Database.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("search")
                .setDescription("Search the Realms+ Database for a user.")
                .addStringOption(option =>
                    option
                        .setName("database")
                        .setDescription("Select the database to search.")
                        .setRequired(true)
                        .addChoices(
                            { name: "Realm Hacker Database", value: "realm" },
                            { name: "Discord User Database", value: "discord" }
                        )
                    )
                .addStringOption(option =>
                    option
                        .setName("gamertag")
                        .setDescription("Enter the gamertag to search for.")
                        .setRequired(false)
                    )
                .addStringOption(option =>
                    option
                        .setName("discord-id")
                        .setDescription("Enter the users Discord ID to search for.")
                        .setRequired(false)
                    )
                .addStringOption(option =>
                    option
                        .setName("fingerprint")
                        .setDescription("Enter the users Realms+ Fingerprint ID to search for.")
                    )
                )
        .addSubcommand(subcommand =>
            subcommand
                .setName("report")
                .setDescription("Report a player to the ARASR Team.")
                .addStringOption(option =>
                    option
                        .setName("database")
                        .setDescription("The database the user is reported to.")
                        .setRequired(true)
                        .addChoices(
                            { name: "Realm Hacker Database", value: "realm" },
                            { name: "Discord User Database", value: "discord" }
                        )
                    )
                .addStringOption(option =>
                    option
                        .setName("reason")
                        .setDescription("Provide a written statement for the report.")
                        .setRequired(true)
                    )
                .addAttachmentOption(option =>
                    option
                        .setName("proof")
                        .setDescription("Image / Video proof of the offense.")
                        .setRequired(true)
                    )
                .addStringOption(option =>
                    option
                        .setName("realm")
                        .setDescription("The realm the user affected.")
                        .setRequired(false)
                    )
                .addStringOption(option =>
                    option
                        .setName("gamertag")
                        .setDescription("The gamertag of the user.")
                        .setRequired(false)
                    )
                .addStringOption(option =>
                    option
                        .setName("discord-id")
                        .setDescription("The Discord ID of the user")
                        .setRequired(false)
                    )
                )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a player.')
                .addStringOption(option => option.setName('database').setDescription('The database you want to add to.').addChoices({
                    name: 'Realm Hacker Database',
                    value: 'realm'
                }, {
                    name: 'Discord User Database',
                    value: 'discord'
                }, ).setRequired(true)
            )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a player.')
                .addStringOption(option => option.setName('database-id').setDescription('The Database ID.').setRequired(true))
                .addStringOption(option => option.setName('database').setDescription('The database you want to remove from.').addChoices({
                    name: 'Realm Hacker Database',
                    value: 'realm'
                }, {
                    name: 'Discord User Database',
                    value: 'discord'
                }, ).setRequired(true)
            )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("leaderboard")
                .setDescription("Display the Realms+ Leaderboard")
                .addStringOption(option =>
                    option
                        .setName("type")
                        .setDescription("The type of leaderboard to view.")
                        .setRequired(true)
                        .addChoices(
                            { name: "Global Leaderboard", value: "global" },
                            { name: "Realm Leaderboard", value: "realm" },
                            { name: "Report Leaderboard", value: "user" },
                            { name: "Admin Leaderboard", value: "admin" }
                        )
                    )
                ),

    async execute(interaction) {
        try {
            if (mongoose.connection.readyState != 1) return await interaction.reply({ content: `${alert} Database not connected! Run the command again in \`5 seconds\`.`, ephemeral: true });
            const eventChannelId = interaction.client.channels.cache.get(`1179901777311715469`)
            let userData = await userDB.findOne(
                { userID: interaction.user.id },
            );
            if (!userData) {
                userData = new userDB(
                    {  
                        userID: interaction.user.id,
                        botBan: false,
                        xuid: "0",
                        email: "0",
                        gamertag: "0",
                        addCount: 0,
                        reportCount: 0,
                        isAdmin: false,
                        databasePerms: false
                    }
                )
              }
              userData.save().catch(error => {
                return console.log(error);
              });
              userData = await userDB.findOne(
                { userID: interaction.user.id },
              );
              let serverData = await serverDB.findOne(
                { serverID: interaction.guild.id },
              )
              if (!serverData) {
                serverData = new serverDB(
                  {
                      _id: new mongoose.Types.ObjectId(),
                      serverID: interaction.guild.id,
                      isBlacklisted: false,
                      addCount: 0,
                      configOptions: {
                          botAccount: true,
                          chatType: "normal"
                      },
                      linkData: {},
                      hasLinked: false,
                      ownedRealms: [],
                      configedRealms: [],
                      discordBanModule: false,
                      autoBanFromDB: false,
                      moderateDevices: {
                          Xbox: false,
                          Playstation: false,
                          Nintendo: false,
                          IOS: false,
                          Windows: false,
                          Android: false,
                          Unknown: false
                      },
                      moderateSkins: false,
                      moderateAlts: false,
                      moderateMovement: false,
                      moderateChat: false,
                      moderateBots: false,
                      moderateEmotes: false,
                      logs: {
                          bans: {
                              channelID: "0",
                          },
                          unbans: {
                              channelID: "0",
                          },
                          kicks: {
                              channelID: "0",
                          },
                          invites: {
                              channelID: "0",
                          },
                          joinsAndLeaves: {
                              channelID: "0",
                          },
                          chatRelay: {
                              channelID: "0",
                          },
                          autoMod: {
                              channelID: "0",
                          },
                          cmdExecution: {
                              channelID: "0",
                          }
                      },
                      rolePermissions: [],
                      whitelistedUsers: [],
                  }
              );
            }
            serverData.save().catch(error => {
                return console.log(error);
            });
            serverData = await serverDB.findOne(
                { userID: interaction.user.id },
            );
            if (interaction.options.getSubcommand() === "search") {
                const databaseType = interaction.options.getString("database");
                const gamertag = interaction.options.getString("gamertag");
                const discordId = interaction.options.getString("discord-id");
                const databaseId = interaction.options.getString("fingerprint");
                switch (databaseType) {
                    case "realm":
                        const embed1 = new EmbedBuilder()
                            .setColor("Yellow")
                            .setTitle(`${search} | Database Search`)
                            .setDescription(`${reply} Searching the Realm Hacker Database ${load}`)

                        const sentMessage = await interaction.reply({ embeds: [embed1] });

                        if (!gamertag && !discordId && !databaseId) {
                            const failEmbed = new EmbedBuilder()
                                .setColor("Red")
                                .setTitle("Error")
                                .setDescription(`You must provide at least one of the following:\n- Gamertag\n- Discord ID\n- Database ID (fingerprint)`)

                            return await sentMessage.edit({ embeds: [failEmbed] });
                        }

                        if (gamertag) {
                            let hackerProfile = await hackerDB.findOne({
                                gamertag: gamertag
                            });
                            if (!hackerProfile) {
                                const failEmbed = new EmbedBuilder()
                                    .setColor("Red")
                                    .setTitle("Not Found")
                                    .setDescription(`\`${gamertag}\` is not in the Realms+ Realm Hacker Database.`)
                                    
                                return await sentMessage.edit({ embeds: [failEmbed] });
                            }

                            const embed2 = new EmbedBuilder()
                                .setColor("Orange")
                                .setTitle(`${warn} | User Found`)
                                .setDescription(`\`${gamertag}\` is in our database for \`${hackerProfile.reason}\`.\n\n${xuidd} **XUID:** \`${hackerProfile.xuid}\`\n${discord} **Discord:** ${hackerProfile.discord}\n${xuidd} **Fingerprint ID:** \`${hackerProfile.dbid}\`\n${minecraft} **Caught on Realm:** \`${hackerProfile.realm}\``)
                                .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                            return await sentMessage.edit({ embeds: [embed2] });
                        }
                        if (databaseId) {
                            let hackerData = await hackerDB.findOne({
                                dbid: databaseId
                            });
                            if (!hackerData) {
                                const failEmbed = new EmbedBuilder()
                                    .setColor("Red")
                                    .setTitle("Not Found")
                                    .setDescription(`I was unable to find a user with the fingerprint \`${databaseId}\` in our Realm Hacker Database.`)
                                    
                                return await sentMessage.edit({ embeds: [failEmbed] });
                            }

                            const embed2 = new EmbedBuilder()
                                .setColor("Orange")
                                .setTitle(`${warn} | User Found`)
                                .setDescription(`Data found for fingerprint id: \`${databaseId}\`\n\n${person} **Gamertag:** \`${hackerData.gamertag}\`\n${xuidd} **XUID:** \`${hackerData.xuid}\`\n${minecraft} **Caught on Realm:** \`${hackerData.realm}\`\n**Reason:** \`${hackerData.reason}\``)
                                .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                            return await sentMessage.edit({ embeds: [embed2] });
                        }
                        if (discordId) {
                            let hackerData = await hackerDB.findOne({
                                discord: discordId
                            });
                            if (!hackerData) {
                                const failEmbed = new EmbedBuilder()
                                    .setColor("Red")
                                    .setTitle("Not Found")
                                    .setDescription(`I was unable to find <@${discordId}> in our Realm Hacker Database.`)
                                    
                                return await sentMessage.edit({ embeds: [failEmbed] });
                            }
                            const embed2 = new EmbedBuilder()
                                .setColor("Orange")
                                .setTitle(`${warn} | User Found`)
                                .setDescription(`Discord User <@${hackerData.discord}> found in our database for \`${hackerData.reason}\`.\n\n${person} **Gamertag:** \`${hackerData.gamertag}\`\n${xuidd} **XUID:** \`${hackerData.xuid}\`\n${minecraft} **Caught on Realm:** \`${hackerProfile.realm}\``)

                            return await sentMessage.edit({ embeds: [embed2] });
                        }
                        break
                    case "discord":
                        const embed3 = new EmbedBuilder()
                            .setColor("Yellow")
                            .setTitle(`${search} | Database Search`)
                            .setDescription(`${reply} Searching the Discord User Database ${load}`)

                        const staticMessage = await interaction.reply({ embeds: [embed3] });

                        if (gamertag) {
                            const invalidEmbed = new EmbedBuilder()
                                .setColor("Red")
                                .setTitle("Error")
                                .setDescription(`For the Discord User Database, input a Discord ID or a Fingerprint ID, not a Gamertag.`)
                                .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                            return await staticMessage.edit({ embeds: [invalidEmbed] });
                        }
                        if (discordId) {
                            let hackerProfile = await discordDB.findOne({
                                userID: discordId
                            });
                            const user = await interaction.client.users.fetch(`${discordId}`).catch((error) => {
                                return console.log(error);
                            });
                            if (!user) {
                                const failEmbed = new EmbedBuilder()
                                    .setColor("Red")
                                    .setTitle("Not Found")
                                    .setDescription(`\`${discordId}\` is not a valid Discord ID.`)
                                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });
                                    
                                return await staticMessage.edit({ embeds: [failEmbed] });
                            }
                            if (!hackerProfile) {
                                const failEmbed = new EmbedBuilder()
                                    .setColor("Red")
                                    .setTitle("Not Found")
                                    .setDescription(`<@${discordId}> is not in our Discord User Database.`)
                                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });
                                    
                                return await staticMessage.edit({ embeds: [failEmbed] });
                            }

                            const embed4 = new EmbedBuilder()
                                .setColor("Orange")
                                .setTitle(`${warn} | User Found`)
                                .setDescription(`<@${user.id}> is in the Realms+ Database for \`${hackerProfile.reason}\`\n\n${discord} **Discord Tag:** \`${user.tag}\`\n${xuidd} **Discord ID:** \`${hackerProfile.userID}\`\n${database} **Fingerprint ID:** \`${hackerProfile.dbid}\``)
                                .setThumbnail(`${user.displayAvatarURL({ dynamic: true })}`)
                                .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                            return await staticMessage.edit({ embeds: [embed4] });
                        }
                        if (databaseId) {
                            let hackerData = await discordDB.findOne({
                                dbid: databaseId
                            });
                            if (!hackerData) {
                                const failEmbed = new EmbedBuilder()
                                    .setColor("Red")
                                    .setTitle("Not Found")
                                    .setDescription(`I was unable to find a user with the fingerprint \`${databaseId}\` in our Discord User Database.`)
                                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });
                                    
                                return await staticMessage.edit({ embeds: [failEmbed] });
                            }
                            const user = await interaction.client.users.fetch(`${hackerData.userID}`).catch((error) => {
                                return console.log(error);
                            });
                            const embed5 = new EmbedBuilder()
                                .setColor("Orange")
                                .setTitle(`${warn} | User Found`)
                                .setDescription(`Results found for Fingerprint ID \`${databaseId}\`\n\n${discord} **Discord Tag:** \`${user.tag}\`\n${xuidd} **Discord ID:** \`${hackerData.userID}\`\n${database} **Fingerprint ID:** \`${hackerData.dbid}\``)
                                .setThumbnail(`${user.displayAvatarURL({ dynamic: true })}`)
                                .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                            return await staticMessage.edit({ embeds: [embed5] });
                        }
                        break
                }
            } else if (interaction.options.getSubcommand() === "report") {
                const databaseType = interaction.options.getString("database")
                const proof = interaction.options.getAttachment("proof")
                const reportReason = interaction.options.getString("reason")
                let realm = interaction.options.getString("realm")
                let gamertag = interaction.options.getString("gamertag")
                let discordId = interaction.options.getString("discord-id")

                switch (databaseType) {
                    case "realm":
                        proof.url.includes(".mov" || ".mp4" || ".wmv" || ".webm") ? proofType = "video" : proofType = "image"
                        if (!discordId) discordId = "N/A";
                        if (!realm) realm = "N/A";
                        if (!gamertag) gamertag = "N/A";
                        const embed1 = new EmbedBuilder()
                            .setColor(946466)
                            .setTitle(`${warn} | Realm Hacker Report`)
                            .setDescription(`New Hacker Database Report made by **${interaction.user.tag}**:\n\n${person} **Gamertag:** \`${gamertag}\`\n${id} **Discord ID:** \`${discordId}\`\n${minecraft} **Realm:** \`${realm}\`\n${reason} **Reason:** \`${reportReason}\``)
                            .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL })
                            .setTimestamp()

                        const channelId = process.env.REPORT_CHANNEL
                        const channel = await interaction.client.channels.cache.get(channelId);
                        const reportId = crypto.randomBytes(15).toString("hex");
                        const reportEmbed = await channel.send({ content: `Report ID: **${reportId}**`, embeds: [embed1] }).catch((error) => {
                            return console.log(error);
                        });
                        // thread for the proof image/video
                        const thread = await reportEmbed.startThread({
                            name: `Proof for ${reportId}`,
                            autoArchiveDuration: 60,
                            reason: `Proof for the Report ID: ${reportId}`
                        });
                        proofType === "video" ? proofType = ".mp4" : proofType = ".png"
                        thread.send({
                            files: [{
                                attachment: proof.url,
                                name: `proof-for-${reportId}${proofType}`
                            }]
                        })
                        // save report modal
                        let reportData = new reportDB({
                            serverID: `${interaction.guild.id}`,
                            authorID: `${interaction.user.id}`,
                            gamertag: `${gamertag}`,
                            discord: `${discordId}`,
                            dbid: `${reportId}`,
                            reason: `${reason}`,
                            proof: `${proof.url}`,
                            realm: `${realm}`,
                            reportID: `${reportId}`,
                        });
                        await reportData.save();
                        userData = await userDB.findOneAndUpdate(
                            { userID: `${interaction.user.id}` },
                            { $inc: {
                                reportCount: 1
                            } },
                        );
                        await userData.save();
                        await interaction.reply({ content: `${greencheck} Your report has been submitted to the ARASR Team to be reviewed, thank you for helping contribute to a safer bedrock community!` });
                        break
                    case "discord":
                        proof.url.includes(".mov" || ".mp4" || ".wmv" || ".webm") ? proofType = "video" : proofType = "image"
                        if (!discordId) discordId = "N/A";
                        if (!realm) realm = "N/A";
                        if (!gamertag) gamertag = "N/A";
                        const embed2 = new EmbedBuilder()
                            .setColor(946466)
                            .setTitle(`${warn} | Discord User Report`)
                            .setDescription(`New Discord Database Report made by **${interaction.user.tag}**:\n\n${person} **Gamertag:** \`${gamertag}\`\n${id} **Discord ID:** \`${discordId}\`\n${minecraft} **Realm:** \`${realm}\`\n${reason} **Reason:** \`${reportReason}\``)
                            .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL })
                            .setTimestamp()

                        const channelID = process.env.REPORT_CHANNEL
                        const Channel = await interaction.client.channels.cache.get(channelID);
                        const reportID = crypto.randomBytes(15).toString("hex");
                        const embed3 = await Channel.send({ content: `Report ID: **${reportID}**`, embeds: [embed2] }).catch((error) => {
                            return console.log(error);
                        });

                        const Thread = await embed3.startThread({
                            name: `Proof for ${reportID}`,
                            autoArchiveDuration: 60,
                            reason: `Proof for the Report ID: ${reportID}`
                        });
                        proofType === "video" ? proofType = ".mp4" : proofType = ".png"
                        Thread.send({
                            files: [{
                                attachment: proof.url,
                                name: `proof-for-${reportID}${proofType}`
                            }]
                        });
                        let reportProfile = new reportDB({
                            serverID: `${interaction.guild.id}`,
                            authorID: `${interaction.user.id}`,
                            gamertag: `${gamertag}`,
                            discord: `${discordId}`,
                            dbid: `${dbid}`,
                            reason: `${reason}`,
                            proof: `${proof.url}`,
                            realm: `${realm}`,
                            reportID: `${reportID}`,
                        });
                        await reportProfile.save();
                        userData = await userDB.findOneAndUpdate(
                            { userID: `${interaction.user.id}` },
                            { $inc: {
                                reportCount: 1
                            } },
                        );
                        await userData.save();
                        await interaction.reply({ content: `${greencheck} Your report has been submitted to the ARASR Team to be reviewed, thank you for helping contribute to a safer bedrock community!` });
                        break
                    }
            } else if (interaction.options.getSubcommand() === 'add') {
                // this command was being worked on, needs updating
              if (!userData.databasePerms) return await interaction.reply({
                content: `Invalid Permission! You can not add to the database!\nInstead make a report with \`/database report\`.`,
                ephemeral: true
            })
            const databaseType = interaction.options.getString('database')
            if (databaseType === 'realm') {
                const addModal = new ModalBuilder()
                    .setCustomId('addModal')
                    .setTitle('Add a player to the Hacker Database')
                const gamertagInput = new TextInputBuilder()
                    .setCustomId('gamertagInput')
                    .setLabel("The player's gamertag")
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(17)
                    .setMinLength(1)
                    .setPlaceholder('Example: MinteeMilk')
                    .setRequired(true)
                const discordIdInput = new TextInputBuilder()
                    .setCustomId('discordIdInput')
                    .setLabel("The player's Discord ID")
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(10)
                    .setPlaceholder('Example: 1038878247519277066')
                    .setRequired(false);
                const realmInput = new TextInputBuilder()
                    .setCustomId('realmInput')
                    .setLabel("The realm")
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Example: Rebirth Vanilla Anarchy')
                    .setRequired(false)
                const reasonInput = new TextInputBuilder()
                    .setCustomId('reasonInput')
                    .setLabel("The reason")
                    .setStyle(TextInputStyle.Paragraph)
                    .setMinLength(3)
                    .setPlaceholder('Example: CBE, Crashing, Illegal Items')
                    .setRequired(true)
                const actionRow1 = new ActionRowBuilder().addComponents(gamertagInput);
                const actionRow2 = new ActionRowBuilder().addComponents(discordIdInput);
                const actionRow3 = new ActionRowBuilder().addComponents(realmInput);
                const actionRow4 = new ActionRowBuilder().addComponents(reasonInput);
                addModal.addComponents(actionRow1, actionRow2, actionRow3, actionRow4);
                await interaction.showModal(addModal).catch((error) => {
                    return console.log(error)
                })
                const submitted = await interaction.awaitModalSubmit({
                    time: 99999,
                    filter: i => i.user.id === interaction.user.id && i.customId === 'addModal',
                }).catch(error => {
                    console.error(error)
                    return null
                })
                if (submitted) {
                    const gamertag = submitted.fields.getTextInputValue('gamertagInput');
                    let discordid = submitted.fields.getTextInputValue('discordIdInput');
                    let realm = submitted.fields.getTextInputValue('realmInput');
                    const reason = submitted.fields.getTextInputValue('reasonInput');
                    if (discordid) {
                        let discordUser = await discordDB.findOne({
                            userID: discordid
                        })
                        if (!discordUser) {
                            newUser = await discordDB.create({
                                userID: discordid,
                                dbid: discordDbidGen,
                                reason: `Realm Hacking [${reason}]`
                            });
                            newUser.save().catch((error) => {
                                return console.log(error)
                            })
                            discordUser = await discordDB.findOne({
                                userID: discordid
                            })
                        }

                    } else {
                        discordid = `N/A`
                    }
                    if (!realm) realm = `N/A`
                    authenticate(`${process.env.EMAIL}`, `${process.env.PASSWORD}`)
                        .then(response => {
                            XboxLiveAPI.getPlayerXUID(
                                `${gamertag}`, {
                                    userHash: `${response.user_hash}`,
                                    XSTSToken: `${response.xsts_token}`,
                                }
                            ).then(async(xuid) => {
                                if (realm) {
                                    var realmProfile = await realmProfileDB.findOne({
                                        name: realm
                                    })
                                    if (!realmProfile) {
                                        let newProfile = await realmProfileDB.create({
                                            profileID: profileIDGenerator,
                                            name: realm,
                                            hackerCount: 0
                                        })
                                        newProfile.save().catch((error) => {
                                            return console.log(error)
                                        })
                                    }
                                    realmProfile = await realmProfileDB.findOne({
                                        name: realm
                                    })
                                }
                                if (!xuid) xuid = 'N/A'
                                const inDB = await hackerDB.findOne({
                                    gamertag: gamertag
                                })
                                if (inDB) return await submitted.reply({
                                    content: `The user with the gamertag: **${gamertag}** is already in the database!`,
                                    ephemeral: true
                                })
                                const databaseEmbed = {
                                    color: 946466,
                                    title: 'Player added to the Hacker Database',
                                    description: 'A new player was just added to the Hacker Database.',
                                    fields: [
                                        {
                                            name: 'Gamertag',
                                            value: `\`${gamertag}\``,
                                            inline: true,
                                      },
                                        {
                                            name: 'XUID',
                                            value: `\`${xuid}\``,
                                            inline: true,
                                      },
                                        {
                                            name: 'Discord ID',
                                            value: `\`${discordid}\``,
                                            inline: true,
                                      },
                                        {
                                            name: 'Database ID',
                                            value: `\`${dbid}\``,
                                            inline: true,
                                      },
                                        {
                                            name: 'Realm',
                                            value: `\`${realm}\``,
                                            inline: true,
                                      },
                                        {
                                            name: 'Realm Profile ID',
                                            value: `\`${realmProfile.profileID}\``,
                                            inline: true,
                                      },
                                        {
                                            name: 'Reason',
                                            value: `\`${reason}\``,
                                            inline: true,
                                      },
                                    ],
                                    timestamp: new Date().toISOString(),
                                    footer: {
                                        text: `${process.env.FOOTER}`,
                                        icon_url: 'https://media.discordapp.net/attachments/1173966738195488768/1179853392357642361/73888008b19585ae23ee35ef7aea13b4.png?ex=657b4b19&is=6568d619&hm=049fddf7c70089c4c38069d954486ad3efd8b14a87b248b2c672be0117a74037&=&format=webp&quality=lossless&width=499&height=499',
                                    },
                                };
                                const dbLog = {
                                    color: 946466,
                                    title: 'New entry in the Database',
                                    description: 'A Realms+ admin added a new player to the Hacker Database.',
                                    fields: [
                                        {
                                            name: 'Author ID',
                                            value: `\`${interaction.user.id}\``,
                                            inline: true,
                                      },
                                        {
                                            name: 'Server ID',
                                            value: `\`${interaction.guild.id}\``,
                                            inline: true,
                                      },
                                        {
                                            name: 'Gamertag',
                                            value: `\`${gamertag}\``,
                                            inline: true,
                                      },
                                        {
                                            name: 'XUID',
                                            value: `\`${xuid}\``,
                                            inline: true,
                                      },
                                        {
                                            name: 'Discord ID',
                                            value: `\`${discordid}\``,
                                            inline: true,
                                      },
                                        {
                                            name: 'Database ID',
                                            value: `\`${dbid}\``,
                                            inline: true,
                                      },
                                        {
                                            name: 'Realm',
                                            value: `\`${realm}\``,
                                            inline: true,
                                      },
                                        {
                                            name: 'Realm Profile ID',
                                            value: `\`${realmProfile.profileID}\``,
                                            inline: true,
                                      },
                                        {
                                            name: 'Reason',
                                            value: `\`${reason}\``,
                                            inline: true,
                                      },
                                    ],
                                    timestamp: new Date().toISOString(),
                                    footer: {
                                        text: `${process.env.FOOTER}`,
                                        icon_url: 'https://media.discordapp.net/attachments/1173966738195488768/1179853392357642361/73888008b19585ae23ee35ef7aea13b4.png?ex=657b4b19&is=6568d619&hm=049fddf7c70089c4c38069d954486ad3efd8b14a87b248b2c672be0117a74037&=&format=webp&quality=lossless&width=499&height=499',
                                    },
                                };
                                await hackerDB.collection.insertOne({
                                    gamertag: `${gamertag}`,
                                    xuid: `${xuid}`,
                                    discord: `${discordid}`,
                                    dbid: `${dbid}`,
                                    realm: `${realm}`,
                                    reason: `${reason}`,
                                }).catch((error) => {
                                    return console.log(error)
                                })
                                await realmProfileDB.collection.updateOne({
                                    profileID: realmProfile.profileID
                                }, {
                                    $inc: {
                                        hackerCount: 1
                                    }
                                }).catch((error) => {
                                    return console.log(error)
                                })
                                await userData.collection.updateOne({
                                    userID: interaction.user.id
                                }, {
                                    $inc: {
                                        addCount: 1
                                    }
                                }).catch((error) => {
                                    return console.log(error)
                                })
                                const id2 = interaction.client.channels.cache.get(`1179887049789161543`)
                                let message = id2.send({
                                    embeds: [databaseEmbed]
                                }).catch((error) => {
                                    return console.log(error)
                                })
                                eventChannelId.send({
                                    embeds: [dbLog]
                                }).catch((error) => {
                                    return console.log(error)
                                })
                            })
                        })
                    return await submitted.reply({
                        content: `<a:checkmark:1183776368249536645> Successfully added **${gamertag}** to the Hacker Database!`,
                        ephemeral: true
                    }).catch((error) => {
                        return console.log(error)
                    })
                }
            }
            if (databaseType === 'discord') {
                if (!userData.databasePerms) return await interaction.followUp({
                    content: `Invalid Permission! You can not add to the Realms+ Discord User Database (RDUD)!`,
                    ephemeral: true
                })
                const discordAddModal = new ModalBuilder()
                    .setCustomId('discordAddModal')
                    .setTitle('Add a user to the Discord User Database');
                const discordIdInput = new TextInputBuilder()
                    .setCustomId('discordIdInput')
                    .setLabel("The user's Discord ID")
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(7)
                    .setPlaceholder('Example: 958179413034422343')
                    .setRequired(false);
                const reasonInput = new TextInputBuilder()
                    .setCustomId('reasonInput')
                    .setLabel("The reason")
                    .setStyle(TextInputStyle.Paragraph)
                    .setMinLength(3)
                    .setPlaceholder('Example: Crashing a realm')
                    .setRequired(true);
                const actionRow1 = new ActionRowBuilder().addComponents(discordIdInput);
                const actionRow2 = new ActionRowBuilder().addComponents(reasonInput);
                discordAddModal.addComponents(actionRow1, actionRow2);
                await interaction.showModal(discordAddModal);
                const submitted = await interaction.awaitModalSubmit({
                    time: 99999,
                    filter: i => i.user.id === interaction.user.id && i.customId === 'discordAddModal'
                }).catch(error => {
                    console.error(error)
                    return null
                })
                if (submitted) {
                    const discordID = submitted.fields.getTextInputValue('discordIdInput');
                    const reason = submitted.fields.getTextInputValue('reasonInput');
                    if (discordID) {
                        var user = await interaction.client.users.fetch(`${discordID}`).catch(async(error) => {
                            return await submitted.reply({
                                content: `Couldn't find a user with the Discord ID of: **${discordID}**!`,
                                ephemeral: true
                            })
                        })
                    }
                    let discordData = await discordDB.findOne({
                        userID: discordID
                    })
                    let discordIDCheck = await discordDB.findOne({
                        dbid: discordDbidGen
                    })
                    if (discordIDCheck) discordDbidGen = crypto.randomBytes(21).toString('hex')
                    if (discordData) return await submitted.reply({
                        content: `This user is already in the Discord User Database!`,
                        ephemeral: true
                    })
                    const databaseEmbed = {
                        color: 946466,
                        title: 'User added to the Discord User Database',
                        description: 'A new user was just added to the Discord User Database.',
                        fields: [
                            {
                                name: '<:DiscordTag:1179850332793225277> **Discord Tag**',
                                value: `\`${user.tag}\``,
                                inline: true,
                },
                            {
                                name: '<:ID:1179850424841416777> **Discord ID**',
                                value: `\`${discordID}\``,
                                inline: true,
                },
                            {
                                name: '<:database:1179850995900100751> **Database ID**',
                                value: `\`${discordDbidGen}\``,
                                inline: true,
                },
                            {
                                name: '<:reason:1181662602489761923> **Reason**',
                                value: `\`${reason}\``,
                                inline: true,
                },
              ],
                        timestamp: new Date().toISOString(),
                        footer: {
                            text: `${process.env.FOOTER}`,
                            icon_url: 'https://media.discordapp.net/attachments/1173966738195488768/1179853392357642361/73888008b19585ae23ee35ef7aea13b4.png?ex=657b4b19&is=6568d619&hm=049fddf7c70089c4c38069d954486ad3efd8b14a87b248b2c672be0117a74037&=&format=webp&quality=lossless&width=499&height=499',
                        },
                    };
                    const databaseAdd = {
                        color: 946466,
                        title: 'User added to the Discord User Database',
                        description: `${interaction.user.tag} added a user from the Discord User Database.`,
                        fields: [
                            {
                                name: 'Author ID',
                                value: `\`${interaction.user.id}\``,
                                inline: true,
                },
                            {
                                name: 'Server ID',
                                value: `\`${interaction.guild.id}\``,
                                inline: true,
                },
                            {
                                name: 'Discord Tag',
                                value: `\`${user.tag}\``,
                                inline: true,
                },
                            {
                                name: 'Discord ID',
                                value: `\`${discordID}\``,
                                inline: true,
                },
                            {
                                name: 'Database ID',
                                value: `\`${discordDbidGen}\``,
                                inline: true,
                },
                            {
                                name: 'Reason',
                                value: `\`${reason}\``,
                                inline: true,
                },
              ],
                        timestamp: new Date().toISOString(),
                        footer: {
                            text: `${process.env.FOOTER}`,
                            icon_url: 'https://media.discordapp.net/attachments/1173966738195488768/1179853392357642361/73888008b19585ae23ee35ef7aea13b4.png?ex=657b4b19&is=6568d619&hm=049fddf7c70089c4c38069d954486ad3efd8b14a87b248b2c672be0117a74037&=&format=webp&quality=lossless&width=499&height=499',
                        },
                    };
                    const id2 = interaction.client.channels.cache.get(`1179887124598755328`)
                    const announcement = await id2.send({
                        embeds: [databaseEmbed]
                    }).catch((error) => {
                        return console.log(error)
                    })
                    eventChannelId.send({
                        embeds: [databaseAdd]
                    }).catch((error) => {
                        return console.log(error)
                    })
                    await discordDB.collection.insertOne({
                        userID: `${discordID}`,
                        dbid: `${discordDbidGen}`,
                        reason: `${reason}`,
                    }).catch((error) => {
                        return console.log(error)
                    })
                    await submitted.reply({
                        content: `<a:checkmark:1183776368249536645> Successfully added **${user.tag}・${discordID}** to the Discord User Database!`,
                        ephemeral: true
                    })
                }
            }
            } else if (interaction.options.getSubcommand() === "remove") {
                if (!userData.databasePerms) return await interaction.editReply({
                    content: `Invalid Permission! You can not remove from the database!`,
                    ephemeral: true
                })
                const databaseType = interaction.options.getString('database')
                if (databaseType === 'realm') {
                    const dbid = interaction.options.getString('database-id')
                    let hackerData = await hackerDB.findOne({
                        dbid: dbid
                    })
                    if (!hackerData) return interaction.editReply({
                        content: `This player isn't in the database!`,
                        ephemeral: true
                    })
                    const removeLog = {
                        color: 946466,
                        title: `Successfully removed ${hackerData.gamertag}`,
                        description: `${interaction.user.tag} removed a player from the Hacker Database.`,
                        fields: [
                            {
                                name: 'Author ID',
                                value: `${interaction.user.id}`,
                                inline: true,
                      },
                            {
                                name: 'Server ID',
                                value: `${interaction.guild.id}`,
                                inline: true,
                      },
                            {
                                name: 'Gamertag',
                                value: `${hackerData.gamertag}`,
                                inline: true,
                      },
                            {
                                name: 'XUID',
                                value: `${hackerData.xuid}`,
                                inline: true,
                      },
                            {
                                name: 'Discord ID',
                                value: `${hackerData.discord}`,
                                inline: true,
                      },
                            {
                                name: 'Database ID',
                                value: `${hackerData.dbid}`,
                                inline: true,
                      },
                            {
                                name: 'Realm',
                                value: `${hackerData.realm}`,
                                inline: true,
                      },
                            {
                                name: 'Reason',
                                value: `${hackerData.reason}`,
                                inline: true,
                      },
                    ],
                        timestamp: new Date().toISOString(),
                        footer: {
                            text: `${process.env.FOOTER}`,
                            icon_url: `${process.env.ICON_URL}`,
                        },
                    };
                    await realmProfileDB.collection.updateOne({
                        name: hackerData.realm
                    }, {
                        $inc: {
                            hackerCount: -1
                        }
                    });
                    id.send({
                        embeds: [removeLog]
                    });
                    await submitted.editReply({
                        content: `<:yes:1070502230203039744> Successfully removed **${hackerData.gamertag}** from the Hacker Database!`,
                        ephemeral: true
                    })
                    return hackerDB.deleteOne({
                        dbid: dbid
                    })
                }
                if (databaseType === 'discord') {
                    const dbid = interaction.options.getString('database-id')
                    let hackerData = await discordDB.findOne({
                        dbid: dbid
                    })
                    if (!hackerData) return interaction.editReply({
                        content: `This user isn't in the database!`,
                        ephemeral: true
                    })
                    let user = await interaction.client.users.fetch(`${hackerData.userID}`).catch(error)
                    const removeLog = {
                        color: 946466,
                        title: 'Successfully removed \`${user.tag}\`',
                        description: `${interaction.user.tag} removed a player from the Realms+ Discord User Database.`,
                        fields: [
                            {
                                name: 'Author ID',
                                value: `${interaction.user.id}`,
                                inline: true,
                },
                            {
                                name: 'Server ID',
                                value: `${interaction.guild.id}`,
                                inline: true,
                },
                            {
                                name: 'Discord Tag',
                                value: `\`${user.tag}\``,
                                inline: true,
                },
                            {
                                name: 'Discord ID',
                                value: `${user.id}`,
                                inline: true,
                },
                            {
                                name: 'Database ID',
                                value: `${hackerData.dbid}`,
                                inline: true,
                },
                            {
                                name: 'Reason',
                                value: `${hackerData.reason}`,
                                inline: true,
                },
                ],
                        timestamp: new Date().toISOString(),
                        footer: {
                            text: `${process.env.FOOTER}`,
                            icon_url: `${process.env.ICON_URL}`,
                        },
                    };
                    eventChannelId.send({
                        embeds: [removeLog]
                    });
                    await submitted.editReply({
                        content: `<:yes:1070502230203039744> Successfully removed **${user.tag}・${user.id}** from the Realms+ Discord User Database!`,
                        ephemeral: true
                    })
                    return discordDB.deleteOne({
                        dbid: dbid
                    })
                }
            } else if (interaction.options.getSubcommand() === "leaderboard") {
                return await interaction.reply({ content: `${alert} This command is not finished yet.` })
            }
        } catch (error) {
            const errorChannel = interaction.client.channels.cache.get(`${process.env.ERROR_CHANNEL}`)
            if (interaction.channel) await errorChannel.send(`There has been an error! Here is the information sorrounding it.\n\nServer Found In: **${interaction.guild.name}**・**${interaction.guild.id}**\nUser Who Found It: **${interaction.user.tag}**・**${interaction.user.id}**\nFound Time: <t:${Math.trunc(Date.now() / 1000)}:R>\nThe Reason: **Database Command has an error**\nError: **${error.stack}**\n\`\`\` \`\`\``)
            console.log(error)
        }
    }
}