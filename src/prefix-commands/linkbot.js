const { EmbedBuilder } = require("discord.js");
const mongoose = require("mongoose");
require("dotenv").config();
const serverDB = require("../models/serverDB");
const axios = require("axios");
const { Authflow, Titles } = require("prismarine-auth");
const { RED, WHITE } = require("../utility/colors");
const fs = require('fs');
const path = require('path');
const { load, reply, greencheck, redcross } = require("../utility/emojis");

module.exports = {
    name: "linkbot",
    description: "Link the ARASR8261 account to the support server.",

    async run(message, args) {
        if (!args.length) return message.reply(`**linkbot** is a command to link the ARASR8261 account to the Support Server.\n\nSyntax: \`!linkbot true\``);

        if (args.length > 3) {
            let serverData = serverDB.findOne({ serverID: message.guild.id });
            if (!serverData) {
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

                await interaction.reply({ content: `Awaiting login ${load}` });

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

                    // Retrieve access_token and refresh_token from cache file
                    const folderPath = `./Accounts/${interaction.guild.id}/`;
                    const files = fs.readdirSync(folderPath);
                    const correctFile = files.find(file => file.endsWith("_live-cache.json"));
                    if (!correctFile) {
                        console.log(`${RED}[AUTH ERROR]${WHITE}  >>>  No _live-cache.json file found in ${folderPath}`);

                        return interaction.editReply({ content: `${redcross} Error when reading auth cache. \`Line 115.\`` });
                    }
                    const cachePath = path.join(folderPath, correctFile);
                    let cacheData = {};
                    try {
                        cacheData = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
                    } catch (error) {
                        console.log(`${RED}[AUTH ERROR]${WHITE}  >>>  Error reading cache file:`, error);

                        return interaction.editReply({ content: `${redcross} Error when reading auth cache. \`Line 124.\`` });
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

                    await interaction.editReply({ content: `Successfully linked \`ARASR8261\` to \`${interaction.guild.name}\! ${greencheck}` });

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
        } catch (error) {
            console.log(error);
        }
            } else {

                return await interaction.editReply({ content: `Failed to login, retry again ${redcross}` });
            }
            }
        }
    }
}