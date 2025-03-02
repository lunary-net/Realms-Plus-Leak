const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');
const userDB = require('../models/userDB');
const serverDB = require('../models/serverDB');
const hackerDB = require('../models/hackerDB');
const { authenticate } = require('@xboxreplay/xboxlive-auth');
const XboxLiveAPI = require('@xboxreplay/xboxlive-api');
const { RealmAPI } = require('prismarine-realms');
const realmProfileDB = require('../models/realmProfileDB');
const { load, greencheck, question, reason, altdetect, redcross, reply, medal, bio, gamertag, xuidd, discord, gamerscore, database, reputation, medal2 } = require('../utility/emojis');
const { RED, WHITE } = require('../utility/colors');
const fs = require('node:fs');

async function authenticateRealm() {
    const Authflow = require('prismarine-auth').Authflow;

    const flow = Authflow.FLOW_XBOX;

    const authflow = new Authflow({
        username: process.env.EMAIL,
        password: process.env.PASSWORD,
        flow: flow,
        authTitle: '00000000402b5328',
        relyingParty: 'rp:api.minecraftservices.com/'
    });

    return RealmAPI.from(authflow, 'bedrock');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lookup')
        .setDescription('Lookup a player or realm')
        .addSubcommand(subcommand =>
            subcommand
                .setName('player')
                .setDescription('Lookup a player')
                .addStringOption(option =>
                    option.setName('gamertag')
                        .setDescription('Xbox Gamertag or XUID')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('realm')
                .setDescription('Lookup a realm')
                .addStringOption(option =>
                    option.setName('query')
                        .setDescription('Realm invite code')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {

            let response;
                try {
                    response = await authenticate(process.env.EMAIL, process.env.PASSWORD);
                } catch (authError) {
                    console.error(authError);
                    await interaction.reply({
                        content: `<:error:1179864735945068736> An error occurred during authentication. Please try again later.`,
                        ephemeral: true
                    });
                    return;
                }

            if (interaction.options.getSubcommand() === 'realm') {
                const query = interaction.options.getString('query');
                const { Authflow } = require('prismarine-auth');
                const { RealmAPI } = require('prismarine-realms');

                const authflow = new Authflow();

                const api = RealmAPI.from(authflow, 'bedrock');
                const realm = await api.getRealmFromInvite(`${query}`).catch(async (error) => {
                    console.log(error);
                    await interaction.editReply({ content: `Invalid Query! I couldn't find that realm!`, ephemeral: true });
                    return;
                });

                

                var realmData = await realmProfileDB.findOne({ profileID: realm.name });
                if (realmData != null) {
                    var realmProfileID = realmData.profileID;
                    var hackerCount = realmData.hackerCount;
                }

                var realmData = await realmProfileDB.findOne({ profileID: realm.id });
                var realmProfileID = realmData ? realmData.profileID : 'N/A';
                var hackerCount = realmData ? realmData.hackerCount : 'N/A';
                var worldOwner = realm.worldOwner ? realm.worldOwner : 'Couldn\'t Fetch Info';
                var realm_status = realm.expired ? 'Expired' : 'Active';
                var motd = realm.motd ? realm.motd : 'No Realm Description.';
                var trial = realm.gracePeriod ? 'True' : 'False';               
                var daysLeft = typeof realm.daysLeft === 'number' ? `${realm.daysLeft} days` : 'Couldn\'t Fetch Info';
                var version = realm.version || 'N/A';
                var creationDate = realm.creationDate || 'N/A';

                const finalEmbed = {
                    color: 946466,
                    title: `${realm.name}`,
                    description: `<:Bio:1179850071446134917> **MOTD**: *${motd}*

__**Basic Info**__
<:Realms:1179850605104205996> **Realm Name**: 
${realm.name}
<a:3helper:1179849815526494383> **Realm Owner:**
${worldOwner}
<:Xuid:1179850758955487244> **Owner XUID**: 
${realm.ownerUUID}
<:settings:1181662645229736006> **Realm ID**: 
${realm.id}
<:settings:1181662645229736006> **Club ID**: 
${realm.clubId}
<:settings:1181662645229736006> **Profile ID**: 
${realmProfileID}
<:hackerdatabase:1183613963552948315> **Database Hacker Count**: 
${hackerCount}
<:emoji_63:1179851096039116840> **Status**: 
${realm.state}

__**Subscription Info**__
<:settings:1181662645229736006> **Subscription ID**: 
${realm.remoteSubscriptionId}
<:emoji_63:1179851096039116840> **Status**: 
${realm_status}

__**Extra Statistics**__
<:DiscordTag:1179850332793225277> **Using Free Trial**: 
${trial}
<:emoji_65:1179851156864893068> **Days Until Expiration**: 
${daysLeft}
<:error:1179864735945068736> **Realm Version:** 
${version}
<:Date:1179850267643089028> **Creation Date:** 
${creationDate}`,
                    timestamp: new Date().toISOString(),
                    footer: {
                        text: `${process.env.FOOTER}`,
                        icon_url: `${process.env.ICON_URL}`,
                    },
                };
                await interaction.editReply({
                    content: `<a:checkmark:1183776368249536645> Operation Successful!`,
                    ephemeral: true
                });
                return await interaction.channel.send({
                    content: `Result found for **${interaction.user.tag}**!`,
                    embeds: [finalEmbed]
                }).catch(async (error) => {
                    const errorChannel = interaction.client.channels.cache.get(`${process.env.ERROR_CHANNEL}`);
                    if (errorChannel) {
                        await errorChannel.send(`An error occurred in the lookup command:\n\nServer: **${interaction.guild.name}** (ID: ${interaction.guild.id})\nUser: **${interaction.user.tag}** (ID: ${interaction.user.id})\nTime: <t:${Math.trunc(Date.now() / 1000)}:R>\nError: ${error.message}\n\n${error.stack}`);
                    } else {
                        console.error('Error channel not found.');
                    }
                    console.error(error);
                    await interaction.editReply({
                        content: `An error occurred while processing your request. Please try again later.`,
                        ephemeral: true
                    });
                });
            } else if (interaction.options.getSubcommand() === 'player') {
                if (mongoose.connection.readyState !== 1) return await interaction.reply({
                    content: `Database not connected! Run the command again in 5 seconds!`,
                    ephemeral: true
                });
                let userData = await userDB.findOne({
                    userID: interaction.user.id
                })
                if (!userData) {
                    userData = new userDB({
                        userID: interaction.user.id,
                        xuid: "0",
                        gamertag: "0",
                        email: "0",
                        addCount: 0,
                        reportCount: 0,
                        botBan: false,
                        isAdmin: false,
                        databasePerms: false
                    });
                    await userData.save();
                }
                let serverData = await serverDB.findOne({
                    serverID: interaction.guild.id
                });
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
                            logs: [],
                            rolePermissions: [],
                            whitelistedUsers: [],
                        }
                    );
                }
              const query = interaction.options.getString("gamertag");

              const initialEmbed = new EmbedBuilder()
                .setColor("Yellow")
                .setTitle(`Player Lookup`)
                .setDescription(`> Searching for: \`${query}\` ${load}`)
                .setFooter({
                  text: process.env.FOOTER,
                  iconURL: process.env.ICON_URL,
                });

              const sentMessage = await interaction.reply({
                embeds: [initialEmbed],
              });

              const hackerData = await hackerDB.findOne({
                $or: [{ xuid: query }, { gamertag: query }],
              });
              const discordID = hackerData ? hackerData.discord : "N/A";
              const s = hackerData ? "True" : "False";

              const xuid = await XboxLiveAPI.getPlayerXUID(query, {
                userHash: response.user_hash,
                XSTSToken: response.xsts_token,
              });

              const settings = await XboxLiveAPI.getPlayerSettings(
                query,
                {
                  userHash: response.user_hash,
                  XSTSToken: response.xsts_token,
                },
                [
                  "GameDisplayPicRaw",
                  "Gamerscore",
                  "Gamertag",
                  "XboxOneRep",
                  "Bio",
                  "AccountTier",
                  "Location",
                  "RealName",
                  "PreferredColor",
                ]
              );
              const Gamerpic = settings[0].value;
              const Gamerscore = parseInt(settings[1].value);
              const Gamertag = settings[2].value;
              const XboxOneRep = settings[3].value;
              const Bio = settings[4].value ? settings[4].value : "N/A";
              const AccountTier = settings[5].value;
              const Location = settings[6].value ? settings[6].value : "N/A";
              const RealName = settings[7].value ? settings[7].value : "N/A";
              const PreferredColor = settings[8].value;

              // for the embed color
              const colorResponse = await fetch(PreferredColor);
              const colorData = await colorResponse.json();
              const primaryColor = colorData.primaryColor;

              const activityResponse =
                await XboxLiveAPI.getPlayerActivityHistory(query, {
                  userHash: response.user_hash,
                  XSTSToken: response.xsts_token,
                  qs: {
                    numItems: 300,
                    activityTypes: "Achievement, Played",
                    excludeTypes: "Screenshot, GameDVR",
                    contentTypes: "Game",
                    startDate: "2021-01-01T00:00:00Z",
                  },
                });
              const bulkData = Array.isArray(activityResponse?.activityItems)
                ? activityResponse.activityItems
                : [];

              let altPercent = 0;

              //  (First Pass) *** Gamerscore \\
              switch (true) {
                case Gamerscore <= 2000 && Gamerscore > 1500:
                  altPercent = Math.trunc(Math.random() * (17 - 14) + 14);
                  break;
                case Gamerscore <= 1500 && Gamerscore > 1000:
                  altPercent = Math.trunc(Math.random() * (26 - 23) + 23);
                  break;
                case Gamerscore <= 1000 && Gamerscore > 800:
                  altPercent = Math.trunc(Math.random() * (38 - 35) + 35);
                  break;
                case Gamerscore <= 800 && Gamerscore > 600:
                  altPercent = Math.trunc(Math.random() * (55 - 52) + 52);
                  break;
                case Gamerscore <= 600 && Gamerscore > 325:
                  altPercent = Math.trunc(Math.random() * (70 - 67) + 67);
                  break;
                case Gamerscore <= 325 && Gamerscore > 200:
                  altPercent = Math.trunc(Math.random() * (83 - 80) + 80);
                  break;
                case Gamerscore <= 200 && Gamerscore > 100:
                  altPercent = Math.trunc(Math.random() * (87 - 84) + 84);
                  break;
                case Gamerscore <= 100 && Gamerscore > 50:
                  altPercent = Math.trunc(Math.random() * (91 - 88) + 88);
                  break;
                case Gamerscore <= 50 && Gamerscore > 0:
                  altPercent = Math.trunc(Math.random() * (95 - 92) + 92);
                  break;
                case Gamerscore === 0:
                  altPercent = Math.trunc(Math.random() * (99.99 - 96) + 96);
                  break;
              }

              switch (true) {
                case bulkData.length === 0:
                  altPercent += Math.trunc(Math.random() * (10 - 5) + 5);
                  break;
                case bulkData.length > 5:
                    altPercent += - 30;
              }

              switch (true) {
                case AccountTier === "Silver":
                  altPercent += Math.trunc(Math.random() * (6 - 1) - 4);
                  break;
                case AccountTier === "Silver" && altPercent > 70:
                  altPercent += Math.trunc(Math.random() * (20 / 5) + 0.3);
                  break;
                case AccountTier === "Silver" && bulkData.length <= 0:
                  altPercent += Math.trunc(Math.random() * (200 - 195) + 195);
                  break;
                case AccountTier === "Gold":
                    altPercent += - 50;
              }

              altPercent = Math.max(0, Math.min(100, altPercent));

              const successEmbed = new EmbedBuilder()
                .setColor(`${primaryColor}`)
                .setTitle(`${Gamertag}`)
                .setDescription(
                  `${bio} **Bio:** \`${Bio}\`\n\n${xuidd} **XUID:** \`${xuid}\`\n${gamerscore} **Gamerscore:** \`${Gamerscore}\`\n${reputation} **Xbox Live Rep:** \`${XboxOneRep}\`\n${medal2} **Account Tier:** \`${AccountTier}\`\n${question} **Location:** \`${Location}\`\n${reason} **Real Name:** \`${RealName}\`\n${discord} **Discord:** \`${discordID}\`\n${altdetect} **Alt Detect:** \`${altPercent}%\`\n\n**__Recent Achievements:__**\n${getList(
                    bulkData
                  )}`
                )
                .setThumbnail(Gamerpic)
                .setFooter({
                  text: process.env.FOOTER,
                  iconURL: process.env.ICON_URL,
                });

              await sentMessage.edit({ embeds: [successEmbed] });
            }
    }
}

function getList(bulkData) {
    let line = bulkData.slice(0, 4).map((data) => {
        const achievementName = data.achievementName;
        //const achievementDescription = data.achievementDescription;
        const date = new Date(data.date).getTime();
        const gameName = data.contentTitle;
        const platform = data.platform;
        return `${medal} **${gameName}**\n- \`${achievementName}\` | **Unlocked:** <t:${Math.floor(date / 1000)}:R>\n  - **Platform:** \`${platform}\``;
    }).join("\n");
    if (bulkData.length < 1) line = "\`NONE FOUND\`";
    return line;
}