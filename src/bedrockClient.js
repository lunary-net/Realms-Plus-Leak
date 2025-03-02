const bedrock = require("bedrock-protocol");
const serverDB = require("./models/serverDB");
const hackerDB = require("./models/hackerDB");
const playerDB = require("./models/playerDB");
const statsDB = require("./models/statsDB");
const botDB = require("./models/botDB");
const axios = require("axios");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { getUserInfo } = require("./functions/getUserInfo.js");
const { getTitleHistory } = require("./functions/getTitleHistory.js");
const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { greencheck, reply, load, minecraft, warn } = require("./utility/emojis");
const { RED, WHITE, GREEN, YELLOW, CYAN, MAGENTA } = require("./utility/colors");

class RealmsPlusClient {
    constructor(realmId, realmName, selectedRealm, client, guildId, guildName, serverData, value) {
        this.RealmID = realmId;
        this.RealmName = realmName;
        this.SelectedRealm = selectedRealm; // this is so we can access settings object for this realm
        this.DiscordBot = client;
        this.GuildID = guildId;
        this.GuildName = guildName;
        this.ServerData = serverData;
        this.BedrockClient = null;
        // for movement moderation
        this.ClientData = {
            previousPosition: null,
            previousTimestamp: null
        }
        this.RealmsPlusStartup(value);
    }

    async RealmsPlusStartup(value) {
        switch (value) {
            case true:
                this.BedrockClient = await this.BotAccount();
                this.RealmsPlusModeration()
                break
            case false:
                this.BedrockClient = await this.MainAccount();
                this.RealmsPlusModeration()
                break
        }
    }

    async BotAccount() {
        return new Promise((resolve, reject) => {
            try {
                const bot = bedrock.createClient({
                    username: "ARASR8261",
                    connectTimeout: 10000,
                    skipPing: true,
                    offline: false,
                    realms: {
                        realmId: this.RealmID,
                    },
                });
                resolve(bot);
            } catch (error) {
                reject(error);
            }
        });
    }

    async MainAccount() {
        return new Promise(async (resolve, reject) => {
            try {
                const bot = bedrock.createClient({
                    profilesFolder: `../Accounts`,
                    username: await getUserInfo(this.ServerData),
                    connectTimeout: 10000,
                    skipPing: true,
                    offline: false,
                    realms: {
                        realmId: this.RealmID
                    }
                });
                resolve(bot);
            } catch (error) {
                console.log(error);
            }
        });
    }

    async RealmsPlusModeration() {


        // Client Join Log + Message
        this.BedrockClient.on("play_status", async (packet) => {
            if (packet.status === "player_spawn") {
                console.log(`${GREEN}[NEW CONNECTION]${WHITE}  >>>  Realms+ Connected to ${CYAN}${this.RealmName}${WHITE} as ${this.BedrockClient.profile.name}`)
                const guild = this.DiscordBot.guilds.cache.get(this.GuildID);
                const RelayChannel = guild.channels.cache.get(this.ServerData.logs.chatRelay.channelID);
                if (RelayChannel) {
                    const embed = new EmbedBuilder()
                        .setColor("#08F704")
                        .setAuthor({ name: "Connection", iconURL: process.env.ICON_URL })
                        .setDescription(`Realms+ Connected, chat relay active ${greencheck}`)

                    await RelayChannel.send({ embeds: [embed] });
                }
            }
        });


        // Realm Lockdown
        this.BedrockClient.on("join", async (packet) => {
            if (this.SelectedRealm.settings.lockdown === true) {
                setInterval(() => {
                    this.BedrockClient.write("command_request", {
                        command: `tp @a[tag=!${this.SelectedRealm.settings.adminTag}] 0 0 0`, // world spawn
                        version: 2,
                        origin: {
                            type: 0,
                            uuid: "",
                            request_id: "",
                        },
                    });
                }, 2000); // every 2 seconds
            }
            const guild = this.DiscordBot.guilds.cache.get("1173782568143966329");
            const logChannel = guild.channels.cache.get(process.env.CONNECTIONS_CHANNEL);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setColor("DarkGreen")
                    .setTitle(`${minecraft} | New Client Connection!`)
                    .setDescription(`> **Realm Name:** \`${this.RealmName}\`\n> **Server Name:** \`${this.GuildName}\`\n> **Server ID:** \`${this.GuildID}\``)

                await logChannel.send({ embeds: [embed] });
            }
        });

        // Player Joins + Leaves
        this.BedrockClient.on("player_list", async (packet) => {
            const RelayChannelID = this.ServerData.logs.joinsAndLeaves.channelID;
            const RelayChannel = this.DiscordBot.channels.cache.get(RelayChannelID);
            switch (packet.records.type) {
                case "add":
                    const players = packet.records.records;
                    for (const player of players) {
                        //console.log(player);
                        const Username = player.username;
                        const UUID = player.uuid;
                        const XUID = player.xbox_user_id;
                        let Device = player.build_platform;
                        if (player.build_platform === 0) Device = "Unknown"
                        if (player.build_platform === 1) Device = "Android"
                        if (player.build_platform === 2) Device = "IOS"
                        if (player.build_platform === 3) Device = "Mac OS"
                        if (player.build_platform === 4) Device = "Fire OS"
                        if (player.build_platform === 5) Device = "GearVR"
                        if (player.build_platform === 6) Device = "Hololens"
                        if (player.build_platform === 7) Device = "Windows"
                        if (player.build_platform === 8) Device = "Windows"
                        if (player.build_platform === 9) { // ain't nobody but spammers play on this shit
                            Device = "Dedicated Server";
                            this.GlobalBan(Username, UUID, XUID, Device);
                        }
                        if (player.build_platform === 11) Device = "Playstation"
                        if (player.build_platform === 12) Device = "Nintendo Switch"
                        if (player.build_platform === 13) Device = "Xbox"
                        if (player.build_platform === 14) Device = "Windows"
                        if (player.build_platform === 15) Device = "Linux"
                        if (player.build_platform >= 40) { // temp fix to sr hacker issue
                            Device = "SR Hacker"; // see who reacts to this first lol
                            this.GlobalBan(Username, UUID, XUID, Device);
                        }
                        if (Username === this.BedrockClient.profile.name) {

                        } else {
                            // Player Processing + Statistics Updating

                            let playerData = await playerDB.findOne({ UUID: UUID });
                            let statsData = await statsDB.findOne({ query: "global" });
                            // Specific SubClient Check for SR Hacker's Accounts
                            if (Username.length >= 25) {
                                this.BedrockClient.write("command_request", {
                                    command: `kick "${Username}" §cSub Clients not allowed.`,
                                    version: 2,
                                    origin: {
                                        type: 0,
                                        uuid: "",
                                        request_id: "",
                                    },
                                });
                                console.log(`${RED}[AUTO-MOD]${WHITE}  >>>   Sub Client detected and kicked. [${YELLOW}T1${WHITE}] | Realm: ${CYAN}${this.RealmName}${WHITE}`)
                            }
                            if (!playerData) {
                                playerData = new playerDB({
                                    UUID: UUID,
                                    Gamertag: Username,
                                    XUID: XUID,
                                    CurrentDevice: Device,
                                    RecentDevices: [Device],
                                    Realms: [this.RealmName],
                                    LastSeen: Date.now()
                                });
                                statsData.playersProcessed += 1;
                                await playerData.save();
                                await statsData.save();
                            } else {
                                if (Device !== playerData.CurrentDevice) { // update CurrentDevice
                                    playerData.CurrentDevice = Device;
                                }
                                if (!playerData.RecentDevices.includes(Device)) { // add new device to RecentDevices array
                                    playerData.RecentDevices.push(Device);
                                }
                                if (!playerData.Realms.includes(this.RealmName)) { // update Realms array
                                    playerData.Realms.push(this.RealmName);
                                }
                                if (playerData.LastSeen < Date.now()) { // update LastSeen date
                                    playerData.LastSeen = Date.now();
                                }
                                await playerData.save();
                            }
                           // Auto Ban From DB Module
                            if (this.ServerData.autoBanFromDB === true) {
                                const hackerData = await hackerDB.findOne({ gamertag: Username });
                                if (hackerData) {
                                    this.GlobalBan(Username, UUID, XUID, Device);
                                }
                            }
                            if (this.ServerData.whitelistedUsers.includes(Username)) {

                            } else {
                                // Bot Mitigation
                                if (this.ServerData.moderateBots === true) { // call this first so we can process bots quickly
                                    this.BotMitigation(Username, UUID, XUID, Device, player);
                                }
                                // Device Filter Module + Anti Spoof Checks
                                switch (true) {
                                    case this.ServerData.moderateDevices.Xbox === true && Device === "Xbox":
                                        this.DeviceFilter(Username, UUID, XUID, Device);
                                        break
                                    case this.ServerData.moderateDevices.Playstation === true && Device === "Playstation":
                                        this.DeviceFilter(Username, UUID, XUID, Device);
                                        break
                                    case this.ServerData.moderateDevices.Nintendo === true && Device === "Nintendo Switch":
                                        this.DeviceFilter(Username, UUID, XUID, Device);
                                        break
                                    case this.ServerData.moderateDevices.IOS === true && Device === "IOS":
                                        this.DeviceFilter(Username, UUID, XUID, Device);
                                        break
                                    case this.ServerData.moderateDevices.Windows === true && Device === "Windows":
                                        this.DeviceFilter(Username, UUID, XUID, Device);
                                        break
                                    case this.ServerData.moderateDevices.Android === true && Device === "Android":
                                        this.DeviceFilter(Username, UUID, XUID, Device);
                                        break
                                    case this.ServerData.moderateDevices.Unknown === true && Device === "Unknown":
                                        this.DeviceFilter(Username, UUID, XUID, Device);
                                        break
                                }
                                // Anti-Unfair Skins Module
                                if (this.ServerData.moderateSkins === true) {
                                    this.SkinModeration(Username, UUID, XUID, player);
                                }
                                // Anti-Alts
                                if (this.ServerData.moderateAlts === true) {
                                    this.AltModeration(Username, UUID, XUID, Device);
                                }
                                // Anti-Spoof
                                if (this.ServerData.antiSpoof === true) {
                                    if (Username.includes("§")) {
                                        this.SpoofModeration(Username, UUID, XUID, Device, "floodKick")
                                    } else {
                                        this.SpoofModeration(Username, UUID, XUID, Device, "normal")
                                    }
                                    // SubClient Handling
                                    if (!XUID) {
                                        this.BedrockClient.write("command_request", {
                                            command: `kick "${Username}" §cFlood Prevention §f[§eT1§f]`,
                                            version: 2,
                                            origin: {
                                                type: 0,
                                                uuid: "",
                                                request_id: "",
                                            },
                                        });
                                        console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} for being a subclient (${YELLOW}Flood Prevention [T1]${WHITE}) | Realm: ${CYAN}${this.RealmName}${WHITE}`);
                                    }
                                    /*
                                    // Further SubClient Handling
                                    if (player.build_platform === 11 || player.build_platform === 12 && player.platform_chat_id && player.skin_data.geometry_data.persona === true) {
                                        this.BedrockClient.write("command_request", {
                                            command: `kick "${Username}" §cBot Detection §f[§eT1§f]`,
                                            version: 2,
                                            origin: {
                                                type: 0,
                                                uuid: "",
                                                request_id: "",
                                            },
                                        });
                                        console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} for being a bot ${WHITE}(${YELLOW}Bot Detection [T1]${WHITE}) | Realm: ${CYAN}${this.RealmName}${WHITE}`);
                                        this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Bot Mitigation", "Bot Detection [T1]");
                                    }
                                    if (player.skin_data.geometry_data === 'null\n') {
                                        this.BedrockClient.write("command_request", {
                                            command: `kick "${Username}" §cBot Detection §f[§eT2§f]`,
                                            version: 2,
                                            origin: {
                                                type: 0,
                                                uuid: "",
                                                request_id: "",
                                            },
                                        });
                                        console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} for being a bot ${WHITE}(${YELLOW}Bot Detection [T1]${WHITE}) | Realm: ${CYAN}${this.RealmName}${WHITE}`);
                                        this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Bot Mitigation", "Bot Detection [T1]");
                                    }*/
                                }
                            }
                            if (RelayChannel) {
                                this.BedrockClient.write("command_request", {
                                    command: `tellraw @a {"rawtext":[{"text":"§i[§aRealms§f+§i] >> ${Username} has joined on ${Device}"}]}`,
                                    version: 2,
                                    origin: {
                                        type: 0,
                                        uuid: "",
                                        request_id: "",
                                    },
                                });
                                this.JoinEmbed(Username, XUID, UUID, Device);
                            }
                        }
                    }
                    break
                case "remove":
                    packet.records.records.forEach((player) => {
                        const UUID = player.uuid;
                        this.LeaveEmbed(UUID);
                    });
                    break
            }
        });

        // Device Validation
        this.BedrockClient.on("add_player", async (packet) => {
            const UUID = packet.uuid;
            const Username = packet.username;
            const PermissionLevel = packet.permission_level;
            const DeviceID = packet.device_id;
            const PlatformChatID = packet.platform_chat_id;
            const ThisDeviceValue = packet.device_os;
            let playerData = await playerDB.findOne({ UUID: UUID });
            if (playerData) {
                playerData = await playerDB.findOneAndUpdate({ UUID: UUID }, {
                    $push: {
                        DeviceIDS: DeviceID
                    }
                }, { new: true });
                await playerData.save();
            }
            const XUID = playerData.XUID;
            // Spoof Checks :)
            if (this.ServerData.antiSpoof === true && !this.ServerData.whitelistedUsers.includes(Username)) {
                // Device ID Checks
                if (playerData.CurrentDevice === "Xbox" && !DeviceID.endsWith("=")) {
                    this.SpoofModeration(Username, UUID, XUID, ThisDeviceValue, "autoKick");
                }
                /*    TEMP DISABLED
                // Platform Chat ID Checks
                if (playerData.CurrentDevice === "Playstation" && PlatformChatID) {
                    this.SpoofModeration(Username, UUID, XUID, playerData.CurrentDevice, "autoKick");
                }
                if (playerData.CurrentDevice === "Nintendo Switch" && PlatformChatID.length !== 20 && PlatformChatID !== '') {
                    this.SpoofModeration(Username, UUID, XUID, playerData.CurrentDevice, "autoKick");
                }
                */
            }
        });

        // Death Relay
        this.BedrockClient.on("text", async (packet) => {
            if (packet.type === "translation") {
                const Message = packet.message;
                const guild = this.DiscordBot.guilds.cache.get(this.GuildID);
                const RelayChannel = guild.channels.cache.get(this.ServerData.logs.deaths.channelID);
                let embedMessage = "";
                const playerData = await playerDB.findOne({ Gamertag: packet.parameters[0] });
                switch (true) {
                    case Message === "§e%multiplayer.player.joined.realms":
                        break
                    case Message === "§e%multiplayer.player.left.realms":
                        break
                    case Message === "death.attack.player":
                        embedMessage = `${packet.parameters[0]} was killed by ${packet.parameters[1]} :0`
                        break
                    case Message === "death.attack.magic":
                        embedMessage = `${packet.parameters[0]} was killed by ${packet.parameters[1]} using magic!`
                        break
                    case Message === "death.attack.onFire":
                        embedMessage = `${packet.parameters[0]} has burned to death ):`
                        break
                    case Message === "death.attack.onFire.player":
                        embedMessage = `${packet.parameters[0]} burned to death while fighting **${packet.parameters[1]}**`
                        break
                    case Message === "death.attack.inFire":
                        embedMessage = `${packet.parameters[0]} has burned to death ):`
                        break
                    case Message === "death.attack.inFire.player":
                        embedMessage = `${packet.parameters[0]} burned to death while fighting ${packet.parameters[1]}`
                        break
                    case Message === "death.attack.lava":
                        embedMessage = `${packet.parameters[0]} just died trying to swim in lava :skull:`
                        break
                    case Message === "death.attack.lava.player":
                        embedMessage = `${packet.parameters[0]} just died trying to swim in lava to escape from ${packet.parameters[1]}`
                        break
                    case Message == "death.attack.drown":
                        embedMessage = `${packet.parameters[0]} just drowned!`
                        break
                    case Message === "death.attack.explosion.player":
                        embedMessage = `${packet.parameters[0]} was blown up by ${getMobName(packet.parameters[1])}`
                        break
                    case Message === "death.attack.explosion":
                        embedMessage = `${packet.parameters[0]} randomly exploded :0`
                        break
                    case Message === "death.attack.drown.player":
                        embedMessage = `${packet.parameters[0]} was blown up by ${packet.parameters[1]}`
                        break
                    case Message === "death.attack.inWall":
                        embedMessage = `${packet.parameters[0]} just suffocated in a wall ):`
                        break
                    case Message === "death.attack.fall":
                        embedMessage = `${packet.parameters[0]} just broke their legs!`
                        break
                    case Message === "death.fell.accident.generic":
                        embedMessage = `${packet.parameters[0]} thought they could make the jump!`
                        break
                    case Message === "death.attack.trident":
                        embedMessage = `${packet.parameters[0]} was impaled by a trident!`
                        break
                    case Message === "death.attack.thrown":
                        embedMessage = `${packet.parameters[0]} was impaled by ${packet.parameters[1]}!`
                        break
                    case Message === "death.attack.arrow":
                        embedMessage = `${packet.parameters[0]} was shot by ${getMobName(packet.parameters[1])}!`
                        break
                    case Message === "death.attack.generic":
                        embedMessage = `${packet.parameters[0]} just died!`
                        break
                    case Message === "death.attack.lightningBolt":
                        embedMessage = `${packet.parameters[0]} was struck by lightning :0`
                        break
                    // these two need separate handlers to find the mob + item
                    case Message === "death.attack.mob.item":
                        embedMessage = `${packet.parameters[0]} was killed by ${packet.parameters[1]} using ${packet.parameters[3]}`
                        break
                    case Message === "death.attack.mob":
                        embedMessage = `${packet.parameters[0]} was killed by ${getMobName(packet.parameters[1])}`
                        break
                    case Message === "death.attack.outOfWorld":
                        embedMessage = `${packet.parameters[0]} just fell out of the world!`
                        break
                    // this might need a handler as well
                    case Message === "death.attack.player.item":
                        if (packet.parameters[2].includes("§")) {
                            const sword = JSON.parse(packet.parameters[2].replace(/§./g, ""));
                            embedMessage = `${packet.parameters[0]} was killed by ${packet.parameters[1]} using ${sword}`
                        }
                        break
                    case Message === "death.attack.starve":
                        embedMessage = `${packet.parameters[0]} starved to death!`
                        break
                    case Message === "death.attack.wither":
                        embedMessage = `${packet.parameters[0]} withered away!`
                        break
                    case Message === "death.attack.freeze":
                        embedMessage = `${packet.parameters[0]} froze to death!`
                        break
                }
                if (RelayChannel && embedMessage && playerData) {
                    const Gamerpic = playerData.Gamerpic;
                    const embed = new EmbedBuilder()
                        .setColor("Orange")
                        .setAuthor({ name: `${embedMessage}`, iconURL: `${Gamerpic}` })

                    await RelayChannel.send({ embeds: [embed] });
                }
            }
        });


        const messages = [];

        let clientData = {
            xuid: null,
            wasKicked: false,
            wasBanned: false
        }

        if (this.ServerData.moderateChat == true) {
            setInterval(async () => {
                const messageCounts = {};

                // increase count
                messages.forEach((message) => {
                    if (!messageCounts[message.xuid]) {
                        messageCounts[message.xuid] = 0;
                    }
                    messageCounts[message.xuid]++;
                });

                const spamThreshold = 5;
                for (const [xuid, count] of Object.entries(messageCounts)) {
                    clientData.xuid = xuid;
                    if (count > spamThreshold) {
                        if (clientData.wasKicked !== true) { // prevents spam kicking
                            this.ChatModeration("normal", null, xuid);
                            clientData.wasKicked = true; // set wasKicked to true, this is no longer triggered
                        } else {
                            if (clientData.wasBanned !== true) { // prevents spam banning
                                this.AutoBan(xuid);
                                clientData.wasBanned = true; // set wasBanned to true, this is no longer triggered
                            }
                        }
                        if (clientData.xuid === xuid) {
                            clientData.wasKicked = true;
                        }
                        clearInterval();

                        const playerData = await playerDB.findOne({ XUID: xuid });

                        // logging the account
                        const supportServer = this.DiscordBot.guilds.cache.get(`1173782568143966329`);
                        const channel = supportServer.channels.cache.get(process.env.SPAM_CHANNEL);

                        playerData.KickCount += 1;
                        await playerData.save();

                        if (playerData.KickCount >= 3) {
                            playerData.FlaggedAccount = true;
                            await playerData.save();
                            await this.AutoBan(xuid);
                        }

                        const data = await getTitleHistory(xuid, this.ServerData);

                        let TitleHistory;
                        let subClient = false;

                        if (data === "SUB CLIENT DETECTED") {
                            TitleHistory = "None.";
                            subClient = true;
                        }

                        const Gamerpic = playerData.Gamerpic;
                        const Gamertag = playerData.Gamertag;
                        TitleHistory = data;
                        const Device = playerData.CurrentDevice;
                        const RealmHistory = playerData.Realms;
                        const RecentDevices = playerData.RecentDevices;

                        const embed = new EmbedBuilder()
                            .setColor("Orange")
                            .setTitle(`${warn} | New Spam Account!`)
                            .setDescription(`**Account Data:**\n\n> **Gamertag:** \`${Gamertag}\`\n> **XUID:** \`${xuid}\`\n> **CurrentDevice:** \`${Device}\`\n> **Recent Devices:** \`${RecentDevices}\`\n> **Member of Realms:** \`${RealmHistory}\`\n> **Title History:** \`${TitleHistory}\``)
                            .setThumbnail(`${Gamerpic}`)
                            .setFooter({ text: `Kick Count: ${playerData.KickCount} | Sub Client: ${subClient}` })

                        await channel.send({ embeds: [embed] });

                    }
                }

                // reset array
                messages.length = 0;
            }, 1800);
        }

        const sleepSpam = [];

        if (this.ServerData.moderateChat == true) {
            setInterval(() => {
                // reset array
                sleepSpam.length = 0;
              }, 1800);
        }

        this.BedrockClient.on("text", async (packet) => {
            if (this.SelectedRealm.settings.chatType === "normal") {
                const Username = packet.source_name;
                const XUID = packet.xuid;
                const message = packet.message;
                //if (!XUID) return;
                const playerData = await playerDB.findOne({ Gamertag: Username });
                const guild = this.DiscordBot.guilds.cache.get(this.GuildID);
                const RelayChannel = guild.channels.cache.get(this.ServerData.logs.chatRelay.channelID);
                let statsData = await statsDB.findOne({ query: "global" });

                    // NORMAL MESSAGES
                if (packet.type === "chat") {
                    // ANTI SPAM TRACKING
                    messages.push({
                        username: packet.source_name,
                        xuid: packet.xuid,
                        message: packet.message,
                      });
                      // CHAT FILTER
                      if (this.ServerData.chatFilter == true && !this.ServerData.whitelistedUsers.includes(Username)) {
                        const BannedWords = this.SelectedRealm.settings.bannedWords[0];
                        const FoundWord = BannedWords.find(word => message.toLowerCase().includes(word.toLowerCase()));
                        if (FoundWord) {
                            await this.ChatFilter(Username, XUID, message, playerData);
                        }
                        const BannedLinks = this.SelectedRealm.settings.bannedLinks[0];
                        const FoundLink = BannedLinks.find(link => message.toLowerCase().includes(link.toLowerCase()));
                        if (FoundLink) {
                            await this.ChatFilter(Username, XUID, message, playerData);
                        }
                        const Gamerpic = playerData.Gamerpic;
                        const embed = new EmbedBuilder()
                            .setColor("Navy")
                            .setAuthor({ name: `${Username} > ${message}`, iconURL: `${Gamerpic}` })
                        if (!message.includes("* External") && !message.includes("Borion - the best minecraft bedrock utility mod")) {
                            await RelayChannel.send({ embeds: [embed] });
                        }
                        statsData.normalTextRelayed += 1;
                        await statsData.save();
                    }
                } else if (packet.type === "json" && packet.needs_translation === false) {
                    
                    // ANTI SLEEP SPAM
                } else if (packet.type === "json" && packet.needs_translation === true) {
                    if (packet.message.includes("chat.type.sleeping")) {
                        sleepSpam.push({
                            username: packet.source_name,
                            xuid: packet.xuid,
                            message: packet.message,
                          });
                        if (sleepSpam.length > 4) {
                            this.ChatModeration("sleepSpam", packet.parameters[0], null);
                            clearInterval();
                            sleepSpam.length = 0;
                        }
                    }
                } else if (packet.type === "announcement") {
                    // Announcement Relay (i.e: [SERVER] Lag Clear in 5 seconds)
                    if (RelayChannel) {
                        const message = packet.message;
                        const finalMessage = message.replace(/§./g, "");
                        const embed = new EmbedBuilder()
                            .setColor("White")
                            .setDescription(`${finalMessage}`)

                        await RelayChannel.send({ embeds: [embed] });
                    }
                }
            } else if (this.SelectedRealm.settings.chatType === "gameTest") {
                const guild = this.DiscordBot.guilds.cache.get(this.GuildID);
                const RelayChannel = guild.channels.cache.get(this.ServerData.logs.chatRelay.channelID);
                let statsData = await statsDB.findOne({ query: "global" });
                // anti spam
                if (packet.type === "chat") {
                    messages.push({
                        username: packet.source_name,
                        xuid: packet.xuid,
                        message: packet.message,
                      });
                } else if (packet.type === "json" && packet.needs_translation === false) {

                } else if (packet.type === "json" && packet.needs_translation === true) {
                    // anti sleep spam
                    if (packet.message.includes("chat.type.sleeping")) {
                        sleepSpam.push({
                            username: packet.source_name,
                            xuid: packet.xuid,
                            message: packet.message,
                          });
                        if (sleepSpam.length > 4) {
                            this.ChatModeration("sleepSpam", packet.parameters[0], null);
                            clearInterval();
                            sleepSpam.length = 0;
                        }
                    }

                    // gametest relay
                    const parsedMsg = JSON.parse(packet.message);
                    const message = parsedMsg.rawtext.map((textObj) => textObj.text.replace(/§[0-9a-fklmnor]/g, "")).join("");
                    if (!message.includes("* External") && RelayChannel) {
                        // Chat Filter
                        /*
                        if (message.includes(this.SelectedRealm.settings.bannedWords.some(word => message.includes(word)))) {
                            await this.ChatFilter(Username, XUID, message, playerData);
                        }
                        if (message.includes(this.SelectedRealm.settings.bannedLinks.some(link => message.includes(link)))) {
                            await this.ChatFilter(Username, XUID, message, playerData);
                        }
                        */
                        const embed = new EmbedBuilder()
                            .setColor("Random")
                            .setAuthor({ name: `GameTest Relay` })
                            .setDescription(`${message}`);
                        await RelayChannel.send({ embeds: [embed] });
                        statsData.jsonTextRelayed += 1;
                        await statsData.save();
                    }
                    // announcement relay
                } else if (packet.type === "announcement") {
                    if (RelayChannel) {
                        const message = packet.message;
                        const finalMessage = message.replace(/§./g, "");
                        const embed = new EmbedBuilder()
                            .setColor("White")
                            .setDescription(`${finalMessage}`)

                        await RelayChannel.send({ embeds: [embed] });
                    }
                }
            }
        });

        // Entity
        this.BedrockClient.on("add_entity", async (packet) => {});

        // Movement
        // does not currently work (takes too long to trigger)
        /*
        this.BedrockClient.on("move_player", async (packet) => {
            if (this.ServerData.moderateMovement === true) {
                const currentPosition = packet.position
                const teleportReason = packet.teleport
                const currentTimestamp = Date.now()
                if (this.ClientData.previousPosition && this.ClientData.previousTimestamp) {
                    const deltaTime = currentTimestamp - this.ClientData.previousTimestamp
                    
                    const deltaX = Math.abs(currentPosition.x - this.ClientData.previousPosition.x)
                    const deltaY = Math.abs(currentPosition.y - this.ClientData.previousPosition.y)

                    if (deltaX >= 2 && deltaY >= 2) {// moved more than or equal to two blocks for X and Y
                        if (deltaTime >= 3000) { // if previous check happened within 3 seconds
                            this.MovementModeration(1)
                        }
                    }
                }
            }
        });
        */

        /*
        this.BedrockClient.on("emote", async (packet) => {
            console.log(packet);
            const EmoteID = packet.emote_id;
            const XUID = packet.xuid;
            const Flags = packet.flags;
            const RelayChannelID = this.ServerData.logs.chatRelay.channelID;
            const RelayChannel = this.DiscordBot.channels.cache.get(RelayChannelID);
            let playerData = await playerDB.findOne({ XUID: XUID });
            
        });
        */

        // Command Execution Logging
        this.BedrockClient.on("command_output", async (packet) => {
            //console.log(packet);
        });

        // Skin Change (Apart of Chat Relay)
        this.BedrockClient.on("player_skin", async (packet) => {
            const UUID = packet.uuid;
            const PlayFabID = packet.skin.play_fab_id;
            const Width = packet.skin.skin_data.width;
            const Height = packet.skin.skin_data.height;
            const guild = this.DiscordBot.guilds.cache.get(this.GuildID);
            const RelayChannel = guild.channels.cache.get(this.ServerData.logs.chatRelay.channelID);
            const playerData = await playerDB.findOne({ UUID: UUID });
            if (this.ServerData.moderateSkins === true && playerData) {
                const Username = playerData.Gamertag;
                const XUID = playerData.XUID;
                const Gamerpic = playerData.Gamerpic;
                const embed = new EmbedBuilder()
                    .setColor("Yellow")
                    .setAuthor({ name: `${Username} has updated their appearance!`, iconURL: `${Gamerpic}` })

                if (RelayChannel) {
                    await RelayChannel.send({ embeds: [embed] });
                }
                if (!this.ServerData.whitelistedUsers.includes(Username)) {
                    this.SkinModeration2(Username, UUID, XUID, PlayFabID, Width, Height);
                }
            } else {
                // do nothing
            }
        });

        // Disconnection 
        this.BedrockClient.on("disconnect", async (packet) => {
            //console.log(packet);
            const Reason = packet.reason;
            const guild = this.DiscordBot.guilds.cache.get(this.GuildID);
            const RelayChannel = guild.channels.cache.get(this.ServerData.logs.chatRelay.channelID);
            const embed = new EmbedBuilder()
                .setColor("Orange")
                .setDescription(`Client Crash Detected, attempting reconnect ${load}`)

            if (Reason === "server_id_conflict") {
                // account is already in the realm, user probably ran /join twice
            } else if (packet.message === "%disconnect.kicked.reason Manual Leave") {
                // someone used .leave in relay channel, don't reconnect
            } else if (packet.message === "disconnectionScreen.serverFull") {
                // servers full, don't attempt reconnect
            } else {
                if (this.ServerData.autoReconnect === true) {
                    await RelayChannel.send({ embeds: [embed] });
                    new RealmsPlusClient(this.RealmID, this.RealmName, this.SelectedRealm, this.DiscordBot, this.GuildID, this.GuildName, this.ServerData, true);
                }
            }
        });

        // Client Kick
        this.BedrockClient.on("kick", async (packet) => {
            if (packet) {
                const guild = this.DiscordBot.guilds.cache.get(this.GuildID);
                this.BedrockClient = null; // same here
                new RealmsPlusClient(this.RealmID, this.RealmName, this.SelectedRealm, this.DiscordBot, this.GuildID, this.ServerData, true);
            }
        });

        // Client Close
        this.BedrockClient.on("close", async (packet) => {
            if (packet) {
                new RealmsPlusClient(this.RealmID, this.RealmName, this.SelectedRealm, this.DiscordBot, this.GuildID, this.ServerData, true);
            }
        });

        // Client End
        this.BedrockClient.on("end", async (packet) => {
            new RealmsPlusClient(this.RealmID, this.RealmName, this.SelectedRealm, this.DiscordBot, this.GuildID, this.ServerData, true);
        });

        // Client Errors
        this.BedrockClient.on("error", async (packet) => {
            console.log(`${RED}[ERROR]${WHITE}  >>>  BedrockClient Error Detected:`, packet);
        });

        // Discord -> Minecraft Relay
        try {
            this.DiscordBot.on("messageCreate", async (message) => {
                if (message.author.id === this.DiscordBot.user.id) {
                    return;
                }
                const RelayChannelID = this.ServerData.logs.chatRelay.channelID;
                if (message.channelId === RelayChannelID) {
                    const Username = message.author.username || "Unknown";
                    const Content = message.content || "";
                    const Prefix = ".";
                    const args = message.content.slice(Prefix.length).trim().split(/ +/g);
                    if (!message.content.startsWith(Prefix)) {
                        if (this.BedrockClient) { // temp fix to a "Cannot read properties of null (reading 'write')" error
                            this.BedrockClient.write('command_request', {
                                command: `/tellraw @a {"rawtext":[{"text":"[§bDiscord§f] [§6${Username}§f] >> ${Content}"}]}`,
                                origin: {
                                    type: 0,
                                    uuid: '',
                                    request_id: ''
                                },
                                internal: false,
                                version: 66
                            });
                        }
                    } else if (message.content.startsWith(Prefix)) {
                        const member = message.guild.members.cache.get(message.author.id);
                        if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
                        if (message.content.includes("leave")) {
                            this.Disconnect();
                            //await message.reply(`Disconnected from \`${this.RealmName}\` ${greencheck}`)
                            const logChannel = this.DiscordBot.channels.cache.get(process.env.CONNECTIONS_CHANNEL);
                            const embed = new EmbedBuilder()
                                .setColor("Red")
                                .setTitle("Client Disconnection")
                                .setDescription(`**Realm:** \`${this.RealmName}\`\n**Server Name:** \`${message.guild.name}\`\n**Server ID:** \`${message.guild.id}\``)
                                .setThumbnail(message.guild.iconURL())

                            if (logChannel) {
                                await logChannel.send({ embeds: [embed] });
                            }
                            return;
                        } else {
                            const command = args.join(" ");
                            this.BedrockClient.write('command_request', {
                                command: `${command}`,
                                origin: {
                                    type: 0,
                                    uuid: '',
                                    request_id: ''
                                },
                                internal: false,
                                version: 66
                            });
                            //await message.reply(`Executed \`${command}\` ${greencheck}`);
                            return;
                        }
                    }
                }
            });
        } catch (error) {
            console.log(`${RED}[ERROR]${WHITE}  >>>  Discord Relay has an error:`, error);
        }
    }

    // Join + Leave Embeds
    async JoinEmbed(Username, XUID, UUID, Device) {
        const guild = this.DiscordBot.guilds.cache.get(this.GuildID);
        const RelayChannel = guild.channels.cache.get(this.ServerData.logs.joinsAndLeaves.channelID);
        let playerData = await playerDB.findOne({ XUID: XUID });
        let Gamerpic = null;
        if (RelayChannel && playerData) {
            if (playerData.Gamerpic === "0" || playerData.Gamerpic === null || playerData.Gamerpic === undefined) {
                
                // SubClient handling
                if (!XUID) return;
                
                const response1 = await axios.post(
                    "https://user.auth.xboxlive.com/user/authenticate",
                    {
                      Properties: {
                        AuthMethod: "RPS",
                        RpsTicket:
                          this.ServerData.linkData.accessToken,
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
                const response3 = await axios.get(`https://profile.xboxlive.com/users/xuid(${(XUID)})/profile/settings?settings=GameDisplayPicRaw`, {
                    headers: {
                        "x-xbl-contract-version": "2",
                        "Authorization": `XBL3.0 x=${xbox_hash};${xbox_token}`,
                        "Accept-Language": "en-US",
                        "maxRedirects": 1,
                    }
                });
                const xbox_data = response3.data.profileUsers;
                if (xbox_data) {
                    Gamerpic = xbox_data[0].settings.find(obj => obj.id === 'GameDisplayPicRaw').value

                    playerData.Gamerpic = Gamerpic;
                    await playerData.save();
                }
            } else {
                Gamerpic = playerData.Gamerpic;
            }
            console.log(`${GREEN}[+] ${MAGENTA}Player Join ${WHITE}| Username: ${CYAN}${Username}${WHITE} | Device: ${CYAN}${Device} ${WHITE}| Realm: ${CYAN}${this.RealmName} ${WHITE}| XUID: ${CYAN}${XUID} ${WHITE}| UUID: ${CYAN}${UUID}${WHITE}`)
            const joinEmbed = new EmbedBuilder()
                .setColor("#08F704")
                .setAuthor({ name: `Player Join`, iconURL: process.env.ICON_URL })
                .setDescription(`**${Username}** has joined the realm!\n${reply} **XUID:** \`${XUID}\`\n${reply} **Device:** \`${Device}\``)
                .setThumbnail(Gamerpic)

            await RelayChannel.send({ embeds: [joinEmbed] });
        }
    }

    async LeaveEmbed(UUID) {
        const guild = this.DiscordBot.guilds.cache.get(this.GuildID);
        const RelayChannel = guild.channels.cache.get(this.ServerData.logs.joinsAndLeaves.channelID);
        let playerData = await playerDB.findOne({ UUID: UUID });
        const Username = playerData.Gamertag;
        const XUID = playerData.XUID;
        const Device = playerData.CurrentDevice;
        if (RelayChannel) {

            // SubClient handling
            if (!XUID) return;

            const response1 = await axios.post(
                "https://user.auth.xboxlive.com/user/authenticate",
                {
                  Properties: {
                    AuthMethod: "RPS",
                    RpsTicket:
                      this.ServerData.linkData.accessToken,
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
            const response3 = await axios.get(`https://profile.xboxlive.com/users/xuid(${(XUID)})/profile/settings?settings=GameDisplayPicRaw`, {
                headers: {
                    "x-xbl-contract-version": "2",
                    "Authorization": `XBL3.0 x=${xbox_hash};${xbox_token}`,
                    "Accept-Language": "en-US",
                    "maxRedirects": 1,
                }
            });
            const xbox_data = response3.data.profileUsers;
            if (xbox_data && playerData) {
                console.log(`${RED}[-] ${MAGENTA}Player Leave ${WHITE}| Username: ${CYAN}${Username}${WHITE} | Device: ${CYAN}${Device} ${WHITE}| Realm: ${CYAN}${this.RealmName} ${WHITE}| XUID: ${CYAN}${XUID} ${WHITE}| UUID: ${CYAN}${UUID}${WHITE}`)
                const Gamerpic = xbox_data[0].settings.find(obj => obj.id === 'GameDisplayPicRaw').value
                // update Gamerpics
                if (playerData.Gamerpic !== Gamerpic) {
                    playerData.Gamerpic = Gamerpic;
                    await playerData.save();
                }
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setAuthor({ name: "Player Leave", iconURL: process.env.ICON_URL })
                    .setDescription(`**${Username}** has left the realm!`)
                    .setThumbnail(Gamerpic)

                await RelayChannel.send({ embeds: [embed] });
            }
        }
    }



    // Device Filter
    async DeviceFilter(Username, UUID, XUID, Device) {
        if (this.ServerData.antiSpoof === true && !this.ServerData.whitelistedUsers.includes(Username)) {
            this.SpoofModeration(Username, UUID, XUID, Device, "normal") // validate the users device first, if they spoofing handle it
        }
        // further filter logic
        let statsData = await statsDB.findOne({ query: "global" });
        switch (true) {
            case Device === "Xbox":
                this.BedrockClient.write("command_request", {
                    command: `kick "${Username}" §cXbox Devices not allowed.`,
                    version: 2,
                    origin: {
                        type: 0,
                        uuid: "",
                        request_id: "",
                    },
                });
                statsData.globalKicks += 1;
                await statsData.save();
                console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} ${YELLOW}(${XUID})${WHITE} for being on a blocked device. (${RED}${Device}${WHITE}) | Realm: ${CYAN}${this.RealmName}${WHITE}`);
                this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Device Filter", "Being on a blocked device (Xbox).")
                break;
            case Device === "Playstation":
                this.BedrockClient.write("command_request", {
                    command: `kick "${Username}" §cPS Devices not allowed.`,
                    version: 2,
                    origin: {
                        type: 0,
                        uuid: "",
                        request_id: "",
                    },
                });
                statsData.globalKicks += 1;
                await statsData.save();
                console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} ${YELLOW}(${XUID})${WHITE} for being on a blocked device. (${RED}${Device}${WHITE}) | Realm: ${CYAN}${this.RealmName}${WHITE}`);
                this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Device Filter", "Being on a blocked device (Playstation).")
                break;
            case Device === "Android":
                this.BedrockClient.write("command_request", {
                    command: `kick "${Username}" §cAndroid Devices not allowed.`,
                    version: 2,
                    origin: {
                        type: 0,
                        uuid: "",
                        request_id: "",
                    },
                });
                statsData.globalKicks += 1;
                await statsData.save();
                console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} ${YELLOW}(${XUID})${WHITE} for being on a blocked device. (${RED}${Device}${WHITE}) | Realm: ${CYAN}${this.RealmName}${WHITE}`);
                this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Device Filter", "Being on a blocked device (Android).")
                break;
            case Device === "IOS":
                this.BedrockClient.write("command_request", {
                    command: `kick "${Username}" §cIOS Devices not allowed.`,
                    version: 2,
                    origin: {
                        type: 0,
                        uuid: "",
                        request_id: "",
                    },
                });
                statsData.globalKicks += 1;
                await statsData.save();
                console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} ${YELLOW}(${XUID})${WHITE} for being on a blocked device. (${RED}${Device}${WHITE}) | Realm: ${CYAN}${this.RealmName}${WHITE}`);
                this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Device Filter", "Being on a blocked device (IOS).")
                break;
            case Device === "Nintendo Switch":
                this.BedrockClient.write("command_request", {
                    command: `kick "${Username}" §cNintendo Devices not allowed.`,
                    version: 2,
                    origin: {
                        type: 0,
                        uuid: "",
                        request_id: "",
                    },
                });
                statsData.globalKicks += 1;
                await statsData.save();
                console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} ${YELLOW}(${XUID})${WHITE} for being on a blocked device. (${RED}${Device}${WHITE}) | Realm: ${CYAN}${this.RealmName}${WHITE}`);
                this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Device Filter", "Being on a blocked device (Nintendo Switch).")
                break;
            case Device === "Windows":
                this.BedrockClient.write("command_request", {
                    command: `kick "${Username}" §cWindows Devices not allowed.`,
                    version: 2,
                    origin: {
                        type: 0,
                        uuid: "",
                        request_id: "",
                    },
                });
                statsData.globalKicks += 1;
                await statsData.save();
                console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} ${YELLOW}(${XUID})${WHITE} for being on a blocked device. (${RED}${Device}${WHITE}) | Realm: ${CYAN}${this.RealmName}${WHITE}`);
                this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Device Filter", "Being on a blocked device (Windows).")
                break;
            case Device === "Unknown":
                this.BedrockClient.write("command_request", {
                    command: `kick "${Username}" §cUnknown Devices not allowed.`,
                    version: 2,
                    origin: {
                        type: 0,
                        uuid: "",
                        request_id: "",
                    },
                });
                statsData.globalKicks += 1;
                await statsData.save();
                console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} ${YELLOW}(${XUID})${WHITE} for being on a blocked device. (${RED}${Device}${WHITE}) | Realm: ${CYAN}${this.RealmName}${WHITE}`);
                this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Device Filter", "Being on a blocked device (Unknown).")
                break;
        }
    }

    // Anti - Unfair Skins
    async SkinModeration(Username, UUID, XUID, player) {
        const guild = this.DiscordBot.guilds.cache.get(this.GuildID);
        const RelayChannel = guild.channels.cache.get(this.ServerData.logs.autoMod.channelID);
        let statsData = await statsDB.findOne({ query: "global" });
        const Player = player;
        const playerData = await playerDB.findOne({ UUID: UUID });
        const Device = playerData.CurrentDevice;
        /* GIVING FALSE POSITIVES
        if (Device !== "Nintendo Switch" && Player.skin_data.play_fab_id !== '' && Player.skin_data.play_fab_id.length !== 16) { // T1 = Possible PlayFabID spoofing and/or Junk Data
            this.BedrockClient.write("command_request", { // ignore Nintendo Switch
                command: `kick "${Username}" §cBad Skin Data`,
                version: 2,
                origin: {
                    type: 0,
                    uuid: "",
                    request_id: "",
                },
            });
            statsData.globalKicks += 1;
            await statsData.save();
            console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} ${YELLOW}(${XUID})${WHITE} for Bad Skin Data (${YELLOW}[T1]${WHITE}) | Realm: ${CYAN}${this.RealmName}${WHITE}`)
            if (RelayChannel && playerData) {
                const Device = playerData.CurrentDevice
                this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Anti Unfair Skins", "Bad Skin Data (T1)");
            }
        }
        */
        if (Player.skin_data.skin_data.width < 16 || Player.skin_data.skin_data.height < 16) { // T2 = Possible Small Skin, kick for being too small
            this.BedrockClient.write("command_request", {
                command: `kick "${Username}" §cBad Skin Data §e(Too Small)`,
                version: 2,
                origin: {
                    type: 0,
                    uuid: "",
                    request_id: "",
                },
            });
            statsData.globalKicks += 1;
            await statsData.save();
            console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} ${YELLOW}(${XUID})${WHITE} for Bad Skin Data (${YELLOW}[T2]${WHITE}) | Realm: ${CYAN}${this.RealmName}${WHITE}`)
            this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Anti Unfair Skins", "Bad Skin Data (T2)");
        }

        if (Player.skin_data.skin_resource_pack.includes('"default" : "geometry.humanoid"\n')) {
            this.BedrockClient.write("command_request", {
                command: `kick "${Username}" §cNo Invis Skins!`,
                version: 2,
                origin: {
                    type: 0,
                    uuid: "",
                    request_id: "",
                },
            });
            statsData.globalKicks += 1;
            await statsData.save();
            console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} ${YELLOW}(${XUID})${WHITE} for Bad Skin Data (${YELLOW}[T3]${WHITE}) | Realm: ${CYAN}${this.RealmName}${WHITE}`)
            this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Anti Unfair Skins", "Invis Skin Detected");
        }
    }

    async SkinModeration2(Username, UUID, XUID, PlayFabID, Width, Height) {
        const guild = this.DiscordBot.guilds.cache.get(this.GuildID);
        const RelayChannel = guild.channels.cache.get(this.ServerData.logs.autoMod.channelID);
        let statsData = await statsDB.findOne({ query: "global" });
        const playerData = await playerDB.findOne({ UUID: UUID });
        if (RelayChannel && playerData) {
            const Device = playerData.CurrentDevice;
            switch (true) {
                /* GIVING FALSE POSITIVES
                case Device !== "Nintendo Switch" && PlayFabID !== '' && PlayFabID.length !== 16:
                    this.BedrockClient.write("command_request", {
                        command: `kick "${Username}" §cBad Skin Data`,
                        version: 2,
                        origin: {
                            type: 0,
                            uuid: "",
                            request_id: "",
                        },
                    });
                    statsData.globalKicks += 1;
                    await statsData.save();
                    console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} ${YELLOW}(${XUID})${WHITE} for Bad Skin Data (${YELLOW}[T1]${WHITE}) | Realm: ${CYAN}${this.RealmName}${WHITE}`)
                    this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Anti Unfair Skins", "Bad Skin Data (T1)")
                    break
                    */
                case Width < 16 || Height < 16:
                    this.BedrockClient.write("command_request", {
                        command: `kick "${Username}" §cBad Skin Data §e(Too Small)`,
                        version: 2,
                        origin: {
                            type: 0,
                            uuid: "",
                            request_id: "",
                        },
                    });
                    statsData.globalKicks += 1;
                    await statsData.save();
                    console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} ${YELLOW}(${XUID})${WHITE} for Bad Skin Data (${YELLOW}[T2]${WHITE}) | Realm: ${CYAN}${this.RealmName}${WHITE}`)
                    this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Anti Unfair Skins", "Bad Skin Data (T2)")
                    break
            }
        }
    }

    // AutoBanFromDB
    async GlobalBan(Username, UUID, XUID, Device) {
        let statsData = await statsDB.findOne({ query: "global" });
        this.BedrockClient.write("command_request", {
            command: `kick "${Username}" §cYou are globally banned by §aRealms§f+`,
            version: 2,
            origin: {
                type: 0,
                uuid: "",
                request_id: "",
            },
        });
        statsData.globalKicks += 1;
        await statsData.save();
        console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} ${YELLOW}(${XUID})${WHITE} for being globally banned | Realm: ${CYAN}${this.RealmName}${WHITE}`)
        this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] AutoBanFromDB", "User found in our Realm Hacker Database.")
    }

    // Anti Alt
    async AltModeration(Username, UUID, XUID, Device) {
        const guild = this.DiscordBot.guilds.cache.get(this.GuildID);
        const RelayChannel = guild.channels.cache.get(this.ServerData.logs.autoMod.channelID);
        let statsData = await statsDB.findOne({ query: "global" });
        if (RelayChannel) {
            try {
                // Endpoint Requests

                if (!XUID) return;

            const response1 = await axios.post(
                "https://user.auth.xboxlive.com/user/authenticate",
                {
                  Properties: {
                    AuthMethod: "RPS",
                    RpsTicket:
                      this.ServerData.linkData.accessToken,
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
            const response3 = await axios.get(`https://profile.xboxlive.com/users/xuid(${(XUID)})/profile/settings?settings=Gamerscore`, {
                headers: {
                    "x-xbl-contract-version": "2",
                    "Authorization": `XBL3.0 x=${xbox_hash};${xbox_token}`,
                    "Accept-Language": "en-US",
                    "maxRedirects": 1,
                }
            });
            const response4 = await axios.get(`https://social.xboxlive.com:443/users/xuid(${(XUID)})/summary`, {
                headers: {
                    'x-xbl-contract-version': 1,
                    accept: 'application/json',
                    Authorization: `XBL3.0 x=${xbox_hash};${xbox_token}`,
                    'accept-language': 'en-US',
                    Connection: 'Keep-Alive',
                    'Accept-Encoding': 'gzip',
                    'User-Agent': 'okhttp/4.9.1',
                }
            });
            const xbox_data = response3.data.profileUsers;
            if (xbox_data) {
                const Gamerscore = response3.data.profileUsers[0].settings.find(obj => obj.id === 'Gamerscore').value
                const Friends = response4.data.targetFollowingCount;
                const Followers = response4.data.targetFollowerCount;
                switch (true) {
                    // Moderation based off Endpoint Data
                    case Gamerscore == 0 && Device == "Xbox": // 100% an alt
                        this.BedrockClient.write("command_request", {
                            command: `kick "${Username}" §cSuspected Alt Account.`,
                            version: 2,
                            origin: {
                                type: 0,
                                uuid: "",
                                request_id: "",
                            },
                        });
                        statsData.globalKicks += 1;
                        await statsData.save();
                        console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} ${YELLOW}(${XUID})${WHITE} for possibly being an Alt Account ${YELLOW}[T2]${WHITE} | Realm: ${CYAN}${this.RealmName}${WHITE}`)
                        this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Anti Alt", "Suspected Alt Account [T2]")
                        break
                    case Friends < this.SelectedRealm.settings.MinFriends: // not enough friends
                        this.BedrockClient.write("command_request", {
                            command: `kick "${Username}" §cSuspected Alt Account §f[§aT3§f]`,
                            version: 2,
                            origin: {
                                type: 0,
                                uuid: "",
                                request_id: "",
                            },
                        });
                        statsData.globalKicks += 1;
                        await statsData.save();
                        console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} ${YELLOW}(${XUID})${WHITE} for possibly being an Alt Account ${YELLOW}[T3]${WHITE} | Realm: ${CYAN}${this.RealmName}${WHITE}`)
                        this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Anti Alt", "Suspected Alt Account [T3]")
                        break
                    case Followers < this.SelectedRealm.settings.MinFollowers: // not enough followers
                        this.BedrockClient.write("command_request", {
                            command: `kick "${Username}" §cSuspected Alt Account §f[§aT4§f]`,
                            version: 2,
                            origin: {
                                type: 0,
                                uuid: "",
                                request_id: "",
                            },
                        });
                        statsData.globalKicks += 1;
                        await statsData.save();
                        console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} ${YELLOW}(${XUID})${WHITE} for possibly being an Alt Account ${YELLOW}[T4]${WHITE} | Realm: ${CYAN}${this.RealmName}${WHITE}`)
                        this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Anti Alt", "Suspected Alt Account [T4]")
                        break
                    case Gamerscore < this.SelectedRealm.settings.MinGamerscore: // not enough gamerscore
                        this.BedrockClient.write("command_request", {
                            command: `kick "${Username}" §cSuspected Alt Account §f[§aT5§f]`,
                            version: 2,
                            origin: {
                                type: 0,
                                uuid: "",
                                request_id: "",
                            },
                        });
                        statsData.globalKicks += 1;
                        await statsData.save();
                        console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} ${YELLOW}(${XUID})${WHITE} for possibly being an Alt Account ${YELLOW}[T5]${WHITE} | Realm: ${CYAN}${this.RealmName}${WHITE}`)
                        this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Anti Alt", "Suspected Alt Account [T5]")
                        break;
                }
            }
        } catch (error) {
            console.log(error);
        }
        }
    }

    // Anti Fly / Speed Hacks
    async MovementModeration(value) {
        switch (true) {
            case value === 1: // Speed Hacks
                this.BedrockClient.write("command_request", {
                    command: `tellraw @a {"rawtext":[{"text":"[§aRealms§f+] §cSpeed Hacks Detected !"}]}`,
                    version: 2,
                    origin: {
                        type: 0,
                        uuid: "",
                        request_id: "",
                    },
                });
                console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Speed Hacks Detected | Realm: ${CYAN}${this.RealmName}${WHITE}`)
                break
            case value === 2: // Fly Hacks
                break
        }
    }

    // Anti Spoof (Device ID's, Packet Data, Title History + Device Types)
    /*

                    Device Spoof Detection Types:

        T1: Device ID's were incorrect for CurrentDevice and/or PlatformChatID's were present when they shouldn't be.
        T2: Title History for the player states they've opened Minecraft on a different device more recently than their CurrentDevice.
        T3: The players most recent title is NOT minecraft.
        T4: The player has too many RecentDevices, kicks them, flags account, and resets array.

                    Flood Prevention Types:
        
        T1: The player's Gamertag contains "§" symbol.
        T2: The player is the source of 2 or more subclients attempting to connect.

    */
    async SpoofModeration(Username, UUID, XUID, Device, value) {
        let statsData = await statsDB.findOne({ query: "global" });
        if (value === "autoKick") {
            this.BedrockClient.write("command_request", {
                command: `kick "${Username}" §cAnti Spoof §f[§aT1§f]`,
                version: 2,
                origin: {
                    type: 0,
                    uuid: "",
                    request_id: "",
                },
            });
            console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} ${YELLOW}(${XUID})${WHITE} for Spoofing Device Types ${YELLOW}[T1]${WHITE} | Realm: ${CYAN}${this.RealmName}${WHITE}`)
            statsData.globalKicks += 1;
            await statsData.save();
            this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Anti Spoof", "Device Spoof Detection [T1]")
        }
        if (value === "floodKick") {
            this.BedrockClient.write("command_request", {
                command: `kick ${XUID} §cFlood Prevention §f[§aT1§f]`,
                version: 2,
                origin: {
                    type: 0,
                    uuid: "",
                    request_id: "",
                },
            });
            console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} ${YELLOW}(${XUID})${WHITE} for Flood Account ${YELLOW}[T1]${WHITE} | Realm: ${CYAN}${this.RealmName}${WHITE}`)
            statsData.globalKicks += 1;
            await statsData.save();
            this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Anti Spoof", "Flood Prevention [T1]")
        }
        if (value === "normal") {
            try {

                // SubClients have no XUID, return here to prevent error code spamming
                if (!XUID) return;

                const response1 = await axios.post(
                    "https://user.auth.xboxlive.com/user/authenticate",
                    {
                      Properties: {
                        AuthMethod: "RPS",
                        RpsTicket:
                          this.ServerData.linkData.accessToken,
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
        
                const response3 = await axios.get(`https://titlehub.xboxlive.com:443/users/xuid(${(XUID)})/titles/titlehistory/decoration/achievement,image,scid`, {
                    headers: {
                        "x-xbl-contract-version": 1,
                        "Accept": "application/json",
                        "Authorization": `XBL3.0 x=${xbox_hash};${xbox_token}`,
                        "accept-language": "en-US",
                        "Connection": 'Keep-Alive',
                        "Accept-Encoding": "gzip",
                        "User-Agent": "okhttp/4.9.1"
                    }
                });
                const RecentGames = response3.data.titles.slice(0, 4);

                const MinecraftTitles = [
                    "1828326430", // Xbox
                    "1810924247", // IOS
                    "896928775", // Windows
                    "1916611344", // Windows 10 Mobile
                    "1794566092", // Minecraft Launcher
                    "2047319603", // Nintendo Switch
                    "1944307183", // Kindle Fire (FireOS)
                    "1739947436", // Android
                    "2044456598" // Playstation
                ];

                let playerData = await playerDB.findOne({ UUID: UUID });


                // FURTHER DEVICE VALIDATION
                switch (true) {
                    case !MinecraftTitles.includes(RecentGames[0].titleId): // not on Minecraft
                        if (RecentGames[0].titleId === "1794566092") {
                            
                        } else {
                            this.BedrockClient.write("command_request", {
                                command: `kick "${Username}" §cAnti Device Spoof §f[§aT3§f]`,
                                version: 2,
                                origin: {
                                    type: 0,
                                    uuid: "",
                                    request_id: "",
                                },
                            });
                            console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} ${YELLOW}(${XUID})${WHITE} for Minecraft not being their recent title ${YELLOW}[T3]${WHITE} | Realm: ${CYAN}${this.RealmName}${WHITE}`);
                            statsData.globalKicks += 1;
                            await statsData.save();
                            this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Anti Spoof", "Device Spoof Detected [T3] (Minecraft is not your most recent game.)");
                        }
                        break;
                    case playerData.RecentDevices.length >= 4: // too many recent devices
                        this.BedrockClient.write("command_request", {
                                command: `kick "${Username}" §cAnti Device Spoof §f[§aT4§f]`,
                                version: 2,
                                origin: {
                                    type: 0,
                                    uuid: "",
                                    request_id: "",
                                },
                            });
                        playerData.RecentDevices = [];
                        await playerData.save();
                        console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} ${YELLOW}(${XUID})${WHITE} for too many recent devices ${YELLOW}[T4]${WHITE} | Realm: ${CYAN}${this.RealmName}${WHITE}`);
                        statsData.globalKicks += 1;
                        await statsData.save();
                        this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Anti Spoof", "Device Spoof Detected [T4] (Too many recent devices.)");
                        break;
                    case Device === "Xbox" && RecentGames[0].titleId !== "1828326430": // not on XBOX
                        if (RecentGames[0].titleId === "1794566092") {
                            // this is the Minecraft Launcher, we're going to ignore it
                        } else {
                            this.BedrockClient.write("command_request", {
                                command: `kick "${Username}" §cAnti Device Spoof §f[§aT2§f]`,
                                version: 2,
                                origin: {
                                    type: 0,
                                    uuid: "",
                                    request_id: "",
                                },
                            });
                            console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} ${YELLOW}(${XUID})${WHITE} for Spoofing Device Types ${YELLOW}[T2]${WHITE} | Realm: ${CYAN}${this.RealmName}${WHITE}`);
                            statsData.globalKicks += 1;
                            await statsData.save();
                            this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Anti Spoof", "Device Spoof Detected [T2]");
                        }
                        break;
                    case Device === "IOS" && RecentGames[0].titleId !== "1810924247": // not on IOS
                        if (RecentGames[0].titleId === "1794566092") {

                        } else {
                            this.BedrockClient.write("command_request", {
                                command: `kick "${Username}" §cAnti Device Spoof §f[§aT2§f]`,
                                version: 2,
                                origin: {
                                    type: 0,
                                    uuid: "",
                                    request_id: "",
                                },
                            });
                            console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} ${YELLOW}(${XUID})${WHITE} for Spoofing Device Types ${YELLOW}[T2]${WHITE} | Realm: ${CYAN}${this.RealmName}${WHITE}`);
                            statsData.globalKicks += 1;
                            await statsData.save();
                            this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Anti Spoof", "Device Spoof Detected [T2]");
                        }
                        break;
                    case Device === "Windows" && RecentGames[0].titleId !== "896928775" || "1916611344": // not on WINDOWS
                        if (RecentGames[0].titleId === "1794566092") {
                            
                        } else {
                            this.BedrockClient.write("command_request", {
                                command: `kick "${Username}" §cAnti Device Spoof §f[§aT2§f]`,
                                version: 2,
                                origin: {
                                    type: 0,
                                    uuid: "",
                                    request_id: "",
                                },
                            });
                            console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} ${YELLOW}(${XUID})${WHITE} for Spoofing Device Types ${YELLOW}[T2]${WHITE} | Realm: ${CYAN}${this.RealmName}${WHITE}`);
                            statsData.globalKicks += 1;
                            await statsData.save();
                            this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Anti Spoof", "Device Spoof Detected [T2]");
                        }
                        break;
                    case Device === "Playstation" && RecentGames[0].titleId !== "2044456598": // not on PLAYSTATION
                        if (RecentGames[0].titleId === "1794566092") {
                            
                        } else {
                            this.BedrockClient.write("command_request", {
                                command: `kick "${Username}" §cAnti Device Spoof §f[§aT2§f]`,
                                version: 2,
                                origin: {
                                    type: 0,
                                    uuid: "",
                                    request_id: "",
                                },
                            });
                            console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} ${YELLOW}(${XUID})${WHITE} for Spoofing Device Types ${YELLOW}[T2]${WHITE} | Realm: ${CYAN}${this.RealmName}${WHITE}`);
                            statsData.globalKicks += 1;
                            await statsData.save();
                            this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Anti Spoof", "Device Spoof Detected [T2]");
                        }
                        break;
                    case Device === "Nintendo Switch" && RecentGames[0].titleId !== "2047319603": // not on NINTENDO SWITCH
                        if (RecentGames[0].titleId === "1794566092") {
                            
                        } else {
                            this.BedrockClient.write("command_request", {
                                command: `kick "${Username}" §cAnti Device Spoof §f[§aT2§f]`,
                                version: 2,
                                origin: {
                                    type: 0,
                                    uuid: "",
                                    request_id: "",
                                },
                            });
                            console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} ${YELLOW}(${XUID})${WHITE} for Spoofing Device Types ${YELLOW}[T2]${WHITE} | Realm: ${CYAN}${this.RealmName}${WHITE}`);
                            statsData.globalKicks += 1;
                            await statsData.save();
                            this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Anti Spoof", "Device Spoof Detected [T2]");
                        }
                        break;
                    case Device === "Android" && RecentGames[0].titleId !== "1739947436": // not on ANDROID
                        if (RecentGames[0].titleId === "1794566092") {
                            
                        } else {
                            this.BedrockClient.write("command_request", {
                                command: `kick "${Username}" §cAnti Device Spoof §f[§aT2§f]`,
                                version: 2,
                                origin: {
                                    type: 0,
                                    uuid: "",
                                    request_id: "",
                                },
                            });
                            console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} ${YELLOW}(${XUID})${WHITE} for Spoofing Device Types ${YELLOW}[T2]${WHITE} | Realm: ${CYAN}${this.RealmName}${WHITE}`);
                            statsData.globalKicks += 1;
                            await statsData.save();
                            this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Anti Spoof", "Device Spoof Detected [T2]");
                        }
                        break;
                    case Device === "FireOS" && RecentGames[0].titleId !== "1944307183": // not on FIREOS
                        if (RecentGames[0].titleId === "1794566092") {
                            
                        } else {
                            this.BedrockClient.write("command_request", {
                                command: `kick "${Username}" §cAnti Device Spoof §f[§aT2§f]`,
                                version: 2,
                                origin: {
                                    type: 0,
                                    uuid: "",
                                    request_id: "",
                                },
                            });
                            console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} ${YELLOW}(${XUID})${WHITE} for Spoofing Device Types ${YELLOW}[T2]${WHITE} | Realm: ${CYAN}${this.RealmName}${WHITE}`);
                            statsData.globalKicks += 1;
                            await statsData.save();
                            this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Anti Spoof", "Device Spoof Detected [T2]");
                        }
                        break;
                    case Device === "Unknown" && RecentGames[0].titleId === "896928775" || "2044456598" || "1828326430":
                        if (RecentGames[0].titleId === "1794566092") {
                            
                        } else {
                            this.BedrockClient.write("command_request", {
                                command: `kick "${Username}" §cAnti Device Spoof §f[§aT2§f]`,
                                version: 2,
                                origin: {
                                    type: 0,
                                    uuid: "",
                                    request_id: "",
                                },
                            });
                            console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} ${YELLOW}(${XUID})${WHITE} for Spoofing Device Types ${YELLOW}[T2]${WHITE} | Realm: ${CYAN}${this.RealmName}${WHITE}`);
                            statsData.globalKicks += 1;
                            await statsData.save();
                            this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Anti Spoof", "Device Spoof Detected [T2]");
                        }
                        break;
                }
            } catch (error) {
                console.log(error);
            }
        }
    }

    /*
    *                       Bot Detection Types:
    *
    *                   - T1: Skin ID Regex came back as true, 100% a TSL Bot Account
    *                   - T2: Full Skin ID & Geometry Data & Device came back as true, specific check for Windows and PlayStation
    *                   - T3: FlaggedAccount = true
    *                   - T4: API Checks return null or minimal data & player is new Club Member
    *                   - T5: API Checks return null or minimal data & RecentDevices only includes Windows and/or PlayStation && Skin Data is minimal
    */

    async BotMitigation(Username, UUID, XUID, Device, player) {
        let botData = await botDB.findOne({ XUID: XUID });
        let statsData = await statsDB.findOne({ query: "global" });

        // Authentication
        /*
        const response1 = await axios.post(
            "https://user.auth.xboxlive.com/user/authenticate",
            {
              Properties: {
                AuthMethod: "RPS",
                RpsTicket:
                  this.ServerData.linkData.accessToken,
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

        // Request 1: Title History
        const response3 = await axios.get(`https://titlehub.xboxlive.com:443/users/xuid(${(XUID)})/titles/titlehistory/decoration/achievement,image,scid`, {
            headers: {
                "x-xbl-contract-version": 1,
                "Accept": "application/json",
                "Authorization": `XBL3.0 x=${xbox_hash};${xbox_token}`,
                "accept-language": "en-US",
                "Connection": 'Keep-Alive',
                "Accept-Encoding": "gzip",
                "User-Agent": "okhttp/4.9.1"
            }
        });

        const RecentGames = response3.data.titles.slice(0, 4);

        // Request 2: Achievment History
        const response4 = await axios.get(`https://achievements.xboxlive.com:443/users/xuid(${XUID})/achievements`, {
            headers: {
                "x-xbl-contract-version": 1,
                "Accept": "application/json",
                "Authorization": `XBL3.0 x=${xbox_hash};${xbox_token}`,
                "accept-language": "en-US",
                "Connection": 'Keep-Alive',
                "Accept-Encoding": "gzip",
                "User-Agent": "okhttp/4.9.1"
            }
        });

        const RecentAchievements = response4.data.achievements.slice(0, 4);

        // Request 4: Club Data for this User
        const content_restrictions = "eyJ2ZXJzaW9uIjoyLCJkYXRhIjp7Imdlb2dyYXBoaWNSZWdpb24iOiJVUyIsIm1heEFnZVJhdGluZyI6MjU1LCJwcmVmZXJyZWRBZ2VSYXRpbmciOjI1NSwicmVzdHJpY3RQcm9tb3Rpb25hbENvbnRlbnQiOmZhbHNlfX0"
        const response6 = await axios.get(`https://clubhub.xboxlive.com/clubs/Ids(${this.SelectedRealm.clubID})/decoration/ClubPresence,Roster,Settings`, {
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

        const ClubData = response6.data.clubs[0].clubPresence;
        */

       const skinIdRegex = /^[^\.]{48}$/;
       const playerData = await playerDB.findOne({ XUID: XUID });

        switch (true) {
            case skinIdRegex.test(player.skin_data.skin_id) === true:
                this.BedrockClient.write("command_request", {
                    command: `kick "${Username}" §cBot Mitigation §f[§aT2§f]`,
                    version: 2,
                    origin: {
                        type: 0,
                        uuid: "",
                        request_id: "",
                    },
                });
                if (!botData) {
                    botData = new botDB({
                        Gamertag: Username,
                        XUID: XUID,
                        UUID: UUID,
                        Realms: playerData.Realms,
                        PlayerlistPacket: player,
                        AddPlayerPacket: null
                    });
                    await botData.save();
                    await this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Bot Migitation", "Suspected Bot [T1]");
                    statsData.globalKicks += 1;
                    await statsData.save();
                }

                const supportServer = this.DiscordBot.guilds.cache.get("1173782568143966329");
                const channel = supportServer.channels.cache.get(process.env.BOTS_CHANNEL);
                const Gamerpic = playerData.Gamerpic;

                const embed = new EmbedBuilder()
                    .setColor("Orange")
                    .setTitle(`${warn} | New Bot Detection!`)
                    .setDescription(`> **Gamertag:** \`${Username}\`\n> **XUID:** \`${XUID}\`\n> **Device:** \`${Device}\``)
                    .setThumbnail(Gamerpic)
                    .setFooter({ text: `Found on Realm: ${this.RealmName}`, iconURL: process.env.ICON_URL });

                await channel.send({ embeds: [embed] });
                break;
            // add more later
        }
    }

    async ChatModeration(type, username, xuid) {
        let statsData = await statsDB.findOne({ query: "global" });
        if (type === "normal") {
            let playerData = await playerDB.findOne({ XUID: xuid });
            const Username = playerData.Gamertag;
            const Device = playerData.CurrentDevice;
            this.BedrockClient.write("command_request", {
                command: `/kick "${Username}" §cSPAM DETECTED`,
                origin: {
                  type: 0,
                  uuid: "",
                  request_id: "",
                },
                internal: false,
                version: 66,
              });
              statsData.globalKicks += 1;
              await statsData.save();
              console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${xuid} ${WHITE}for being a Spam Bot (${YELLOW}T1${WHITE}) | Realm: ${CYAN}${this.RealmName}${WHITE}`);
              this.KickEmbed(Username, xuid, Device, "[AUTO-MOD] Anti Spam", "Spam Detected [T1]");
        }
        if (type === "sleepSpam") {
            let playerData = await playerDB.findOne({ Gamertag: username });
            const XUID = playerData.XUID;
            const Device = playerData.CurrentDevice;
            this.BedrockClient.write("command_request", {
                command: `/kick "${username}" §cSPAM DETECTED`,
                origin: {
                  type: 0,
                  uuid: "",
                  request_id: "",
                },
                internal: false,
                version: 66,
              });
              statsData.globalKicks += 1;
              await statsData.save();
              console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${username} ${WHITE}for being a Spam Bot (${YELLOW}T2${WHITE}) | Realm: ${CYAN}${this.RealmName}${WHITE}`);
              this.KickEmbed(username, XUID, Device, "[AUTO-MOD] Anti Spam", "Spam Detected [T2]");
        }
    }

    async ChatFilter(Username, XUID, message) {
        let playerData = await playerDB.findOne({ Gamertag: Username });
        const Device = playerData.CurrentDevice;
        if (playerData.WarnCount >= 3) {
            this.BedrockClient.write("command_request", {
                command: `kick "${Username}" §cChat Filter Triggered.`,
                version: 2,
                origin: {
                    type: 0,
                    uuid: "",
                    request_id: "",
                },
            });
            console.log(`${RED}[AUTO-MOD]${WHITE}  >>>  Action Taken on ${CYAN}${Username} for exceeding the warn limit ${WHITE}(${YELLOW}Chat Filter${WHITE}) | Realm: ${CYAN}${this.RealmName}${WHITE}`);
            this.KickEmbed(Username, XUID, Device, "[AUTO-MOD] Chat Filter", "User exceeded warn limit (using banned words/links more than 3 times.)");
            playerData.WarnCount = 0;
            await playerData.save();
        } else {
            this.BedrockClient.write("command_request", {
                command: `tellraw "${Username}" {"rawtext":[{"text":"§i§8[§aRealms§f+§i§8] > §cYou have used a word/link that is not allowed on this realm.\nPlease follow this realms rules for chatting, on your third warning you will be kicked.\n§eWarn Count: §f${playerData.WarnCount}"}]}`,
                version: 2,
                origin: {
                    type: 0,
                    uuid: "",
                    request_id: "",
                },
            });
            playerData = await playerDB.findOneAndUpdate({ Gamertag: Username }, { WarnCount: playerData.WarnCount + 1 }, { new: true });
            await playerData.save();
        }
    }

    async AutoBan(xuid) {
        const response1 = await axios.post(
            "https://user.auth.xboxlive.com/user/authenticate",
            {
              Properties: {
                AuthMethod: "RPS",
                RpsTicket:
                  this.ServerData.linkData.accessToken,
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
        const realm_token = response2.data.Token;
        const realm_userhash = response2.data.DisplayClaims.xui[0].uhs;
        var PlayerBan = {
            method: "post",
            url: `https://pocket.realms.minecraft.net/worlds/${this.RealmID.toString()}/blocklist/${xuid}`,
            headers: {
                "Cache-Control": "no-cache",
                Charset: "utf-8",
                "Client-Version": process.env.CLIENT_VERSION,
                "User-Agent": "MCPE/UWP",
                "Accept-Language": "en-US",
                "Accept-Encoding": "gzip, deflate, br",
                Host: "pocket.realms.minecraft.net",
                Authorization: `XBL3.0 x=${realm_userhash};${realm_token}`,
            },
        };
           

        await axios(PlayerBan);
    }

    // Kick Embed
    async KickEmbed(Username, XUID, Device, type, reason) {
        const guild = this.DiscordBot.guilds.cache.get(this.GuildID);
        const RelayChannel = guild.channels.cache.get(this.ServerData.logs.autoMod.channelID);
        if (RelayChannel) {
            const response1 = await axios.post(
                "https://user.auth.xboxlive.com/user/authenticate",
                {
                  Properties: {
                    AuthMethod: "RPS",
                    RpsTicket:
                      this.ServerData.linkData.accessToken,
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
            const response3 = await axios.get(`https://profile.xboxlive.com/users/xuid(${(XUID)})/profile/settings?settings=GameDisplayPicRaw`, {
                headers: {
                    "x-xbl-contract-version": "2",
                    "Authorization": `XBL3.0 x=${xbox_hash};${xbox_token}`,
                    "Accept-Language": "en-US",
                    "maxRedirects": 1,
                }
            });
            const xbox_data = response3.data.profileUsers;
            if (xbox_data) {
                const Gamerpic = xbox_data[0].settings.find(obj => obj.id === 'GameDisplayPicRaw').value
                const embed = new EmbedBuilder()
                    .setColor("Orange")
                    .setAuthor({ name: `${type}`, iconURL: process.env.ICON_URL })
                    .setDescription(`**${Username}** was kicked from ${this.RealmName}\n${reply} **Reason:** \`${reason}\`\n${reply} **XUID:** \`${XUID}\`\n${reply} **Device:** \`${Device}\``)
                    .setThumbnail(Gamerpic)

                await RelayChannel.send({ embeds: [embed] });
            }
        }
    }


    // Manual Disconnect
    async Disconnect() {
        this.BedrockClient.write("command_request", {
            command: `kick ARASR8261 Manual Leave`,
            version: 2,
            origin: {
                type: 0,
                uuid: "",
                request_id: "",
            },
        });
    }
}

function getMobName(MobName) {
    let Mob = "";
    switch (true) {
        case MobName === "%entity.zombie.name":
            Mob = "Zombie"
            break
        case MobName === "%entity.spider.name":
            Mob = "Spider"
            break
        case MobName === "%entity.blaze.name":
            Mob = "Blaze"
            break
        case MobName === "%entity.pillager.name":
            Mob = "Pillager"
            break
        case MobName === "%entity.skeleton.name":
            Mob = "Skeleton"
            break
        case MobName === "%entity.creeper.name":
            Mob = "Creeper"
            break
        case MobName === "%entity.wither.name":
            Mob = "Wither"
            break
        case MobName === "%entity.breeze.name":
            Mob = "Breeze"
            break
        case MobName === "%entity.ghast.name":
            Mob = "Ghast"
            break
        case MobName === "%entity.enderman.name":
            Mob = "Enderman"
            break
        case MobName === "%entity.piglin.name":
            Mob = "Piglin"
            break
        case MobName === "%entity.piglin_brute.name":
            Mob = "Piglin Brute"
            break
        case MobName === "%entity.zombie_pigman.name":
            Mob = "Zombified Piglin"
            break
        case MobName === "%entity.ravager.name":
            Mob = "Ravager"
            break
        case MobName === "%entity.wither_skeleton.name":
            Mob = "Wither Skeleton"
            break
        case MobName === "%entity.hoglin.name":
            Mob = "Hoglin"
            break
        case MobName === "%entity.zoglin.name":
            Mob = "Zoglin"
            break
        case MobName === "%entity.guardian.name":
            Mob = "Guardian"
            break
        case MobName === "%entity.elder_guardian.name":
            Mob = "Elder Guardian"
            break
        case MobName === "%entity.vindicator.name":
            Mob = "Vindicator"
            break
        case MobName === "%entity.husk.name":
            Mob = "Husk"
            break
    }
    return Mob;
}


module.exports = {
    RealmsPlusClient
}