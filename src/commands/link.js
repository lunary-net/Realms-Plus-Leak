const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const mongoose = require("mongoose");
const serverDB = require("../models/serverDB");
const statsDB = require("../models/statsDB");
const userDB = require("../models/userDB");
const { reply, load, greencheck, redcross, alert, microsoft, minecraft, id, question } = require("../utility/emojis");
const { Authflow, Titles } = require("prismarine-auth");
const axios = require("axios");
const { RED, WHITE } = require("../utility/colors");
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("link")
        .setDescription("Link your Microsoft Account to Realms+!"),

    async execute(interaction) {
        const user = interaction.user.id;
        const guildOwner = interaction.guild.ownerId;
        const guildId = interaction.guild.id;

        if (mongoose.connection.readyState !== 1) {
            return await interaction.reply({
                content: `${alert} Database not connected! Run the command again in 5 seconds!`,
                ephemeral: true
            });
        }


        if (user !== guildOwner) {
            return await interaction.reply({
                content: `${alert} You must be the server owner to use this command!`,
                ephemeral: true
            });
        }
        

            const initialEmbed = new EmbedBuilder()
                .setColor("Yellow")
                .setTitle(`${microsoft} | Realms+ Linking`)
                .setDescription(`${reply} Fetching Guild Info ${load}`)
                .setFooter({ text: process.env.FOOTER, icon_url: process.env.ICON_URL });

            await interaction.reply({ embeds: [initialEmbed] });

            let serverData = await serverDB.findOne({ serverID: interaction.guild.id });

            if (!serverData) {
                const creatingEmbed = new EmbedBuilder()
                    .setColor("Yellow")
                    .setTitle(`${microsoft} | Realms+ Linking`)
                    .setDescription(`${reply} No guild info found, creating guild model ${load}`)
                    .setFooter({ text: process.env.FOOTER, icon_url: process.env.ICON_URL });

                await interaction.editReply({ embeds: [creatingEmbed] });
                serverData = new serverDB(
                    {
                        _id: new mongoose.Types.ObjectId(),
                        serverID: interaction.guild.id,
                        isBlacklisted: false,
                        addCount: 0,
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
                            deaths: {
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
                            },
                        },
                        rolePermissions: [],
                        whitelistedUsers: [],
                    }
                );
                await serverData.save();

                const createdEmbed = new EmbedBuilder()
                    .setColor("Yellow")
                    .setTitle(`${microsoft} | Realms+ Linking`)
                    .setDescription(`${reply} Guild model created, continuing ${load}`)
                    .setFooter({ text: process.env.FOOTER, icon_url: process.env.ICON_URL });

                await interaction.editReply({ embeds: [createdEmbed] });

                const embed2 = new EmbedBuilder()
                    .setColor("Yellow")
                    .setTitle(`${microsoft} | Realms+ Linking`)
                    .setDescription(`${reply} Awaiting login ${load}`)
                    .setFooter({ text: process.env.FOOTER, icon_url: process.env.ICON_URL });

                await interaction.editReply({ embeds: [embed2] });
            }

            const embed = new EmbedBuilder()
                .setColor("Yellow")
                .setTitle(`${microsoft} | Realms+ Linking`)
                .setDescription(`${reply} Awaiting login ${load}`)

            await interaction.editReply({ embeds: [embed] });

            let accountFolder = `./Accounts/${interaction.guild.id}`;
            let username = `${interaction.user.id}`;
            const auth = new Authflow( username, accountFolder, { flow: "live", authTitle: Titles.MinecraftNintendoSwitch, deviceType: "Nintendo", doSisuAuth: true }, async (code) => {
            const url = code.verification_uri;
            const verifyCode = code.user_code;
            const signInEmbed = new EmbedBuilder()
                .setColor("Yellow")
                .setAuthor({ name: `Realms+ Link Menu`, iconURL: process.env.ICON_URL })
                .setTitle(`Hello **${interaction.user.username}**!`)
                .setDescription(`Follow the steps below to link your account:\n\n1. Go to this url and login with your **Main Account**:\n${reply} ${url}\n2. Enter this code to verify:\n${reply} \`${verifyCode}\`\nThis code will expire in \`5 minutes\`.\n***DO NOT SHARE THIS CODE WITH ANYONE***`)
                .setThumbnail(process.env.ICON_URL)

            await interaction.followUp({ embeds: [signInEmbed], ephemeral: true });
            });

            const token = await auth.getXboxToken();
            if (token) {
                try {
                await axios(`https://profile.xboxlive.com/users/xuid(${token.userXUID})/profile/settings?settings=Gamertag,GameDisplayPicRaw`, {
                    headers: { authorization: `XBL3.0 x=${token.userHash};${token.XSTSToken}`, 'x-xbl-contract-version': 2 }
                }).then(async (result) => {
                const gamertag = result.data.profileUsers[0].settings[0].value
                const gamerpic = result.data.profileUsers[0].settings[1].value

                // getting realms
                const authRealm = await auth.getXboxToken('https://pocket.realms.minecraft.net/')
                await axios('https://pocket.realms.minecraft.net/worlds', {
                    headers: { method: "GET", authorization: `XBL3.0 x=${authRealm.userHash};${authRealm.XSTSToken}`, 'client-version': '1.18.2', 'Accept-Language': 'en-GB' }
                }).then(async (result) => {


                    const realms = result.data.servers.filter((x) => x.ownerUUID == token.userXUID)

                    if (realms.length == 0) {
                        const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`${redcross} No Owned Realms`)
                        .setDescription(`${reply} Hold on **${gamertag}**, you don't own any realms!\n\nYour data was not stored, please link an account that owns at least 1 realm.`)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL })
                        .setTimestamp();
                        return interaction.editReply({embeds: [embed]})
                    }

                    let userData = await userDB.findOne({ userID: interaction.user.id });

                    let statsData = await statsDB.findOne({ query: "global" });

                    if (!userData) {
                        newUser = await userDB.create({
                            userID: interaction.user.id,
                            botBan: false,
                            xuid: token.userXUID,
                            gamertag: gamertag,
                            addCount: 0,
                            reportCount: 0,
                            botBan: false,
                            isAdmin: false,
                            databasePerms: false
                        });
                        newUser.save().catch((error) => {
                            return console.log(error);
                        });
                        userData = await userDB.findOne({ userID: interaction.user.id });
                    }

                    // we store gamertag + xuid to associate the realm owner (discord) with their microsoft account
                    await userDB.findOneAndUpdate(
                        { userID: interaction.user.id },
                        { $set: {
                            xuid: token.userXUID,
                            gamertag: gamertag
                        } },
                        { upsert: true }
                    );

                    userData.save().catch((error) => {
                        return console.warn(RED + "[ERROR]" + WHITE + "  >>>  Error occurred while saving userData:", error);
                    });

                    // Retrieve access_token and refresh_token from cache file
                    const folderPath = `./Accounts/${interaction.guild.id}/`;
                    const files = fs.readdirSync(folderPath);
                    const correctFile = files.find(file => file.endsWith("_live-cache.json"));
                    if (!correctFile) {
                        console.log(`${RED}[AUTH ERROR]${WHITE}  >>>  No _live-cache.json file found in ${folderPath}`);
                        const errorEmbed = new EmbedBuilder()
                            .setColor("Red")
                            .setTitle(`${redcross} Error`)
                            .setDescription(`${reply} There was an error during authentication, please try again later.`)
                            .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL })
                            .setTimestamp();

                        return interaction.editReply({ embeds: [errorEmbed] });
                    }
                    const cachePath = path.join(folderPath, correctFile);
                    let cacheData = {};
                    try {
                        cacheData = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
                    } catch (error) {
                        console.log(`${RED}[AUTH ERROR]${WHITE}  >>>  Error reading cache file:`, error);
                        const errorEmbed = new EmbedBuilder()
                            .setColor("Red")
                            .setTitle(`${redcross} Error`)
                            .setDescription(`${reply} There was an error during authentication, please try again later.`)
                            .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL })
                            .setTimestamp();
                        return interaction.editReply({ embeds: [errorEmbed] });
                    }
                    // we store linkData in the serverDB for the following reasons:
                    // 1. If other users (besides the guild owner / authed user) with correct perms try using /realm commands, they need to start an authflow with the stored data
                    //     - if the data is stored in the serverDB, we can use interaction.guild.id to retrieve it and start an authflow
                    // 2. If the owner (linked user) uses Realms+ in another guild, they may want to setup another realm for that guild (meaning 2 guilds each with their own realm being managed)
                    await serverDB.findOneAndUpdate(
                        { serverID: interaction.guild.id },
                        { $set: {
                            linkData: {
                                userXUID: token.userXUID,
                                accessToken: cacheData.token.access_token,
                                refreshToken: cacheData.token.refresh_token,
                                obtainedOn: Date.now(),
                            },
                            ownedRealms: realms,
                            hasLinked: true
                        } },
                        { upsert: true, new: true }
                    )

                    await serverData.save().catch((error) => {
                        return console.warn(RED + "[ERROR]" + WHITE + "  >>>  Error occurred while saving userData:", error);
                    });

                    const successEmbed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle(`${microsoft} | Account Linked!`)
                        .setDescription(`Welcome **${gamertag}**!\n${reply} Login was successful ${greencheck}\n**__Owned Realms__**\n${realms.map(realm => `${minecraft} \`${realm.name}\` \`(${realm.id})\` ||||| State: \`${realm.state}\``).join('\n')}`)
                        .setThumbnail(gamerpic)
                        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                    await interaction.editReply({ embeds: [successEmbed] });

                    statsData.linkedAccounts += 1;
                    await statsData.save();

                    const logChannel = interaction.client.channels.cache.get(process.env.LINKS_CHANNEL);

                    const logEmbed = new EmbedBuilder()
                        .setColor("DarkAqua")
                        .setTitle(`${microsoft} | New Account Linked!`)
                        .setDescription(`**Server Name:** \`${interaction.guild.name}\`\n**Server ID:** \`${interaction.guild.id}\`\n**Linked User:** <@${interaction.user.id}>`)
                        .setThumbnail(interaction.user.displayAvatarURL())

                    if (logChannel) {
                        await logChannel.send({ embeds: [logEmbed] });
                    }
                    return;
                })
            })
        } catch (error) {
            console.log(error);
        }
            } else {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle(`${redcross} | Authentication Failed`)
                    .setDescription(`${reply} There was a problem during login, please try again.`)
                    .setFooter({ text: process.env.FOOTER, icon_url: process.env.ICON_URL });

                return await interaction.editReply({ embeds: [errorEmbed] });
            }
        }
}