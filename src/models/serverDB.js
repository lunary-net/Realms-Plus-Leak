const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
    // basic server information
    serverID: { type: String, unique: true },
    isBlacklisted: { type: Boolean, default: false },
    addCount: { type: Number, default: 0 },
    linkData: {
        userXUID: { type: String },
        accessToken: { type: String },
        refreshToken: { type: String },
        obtainedOn: { type: Date, default: Date.now() }
    },
    hasLinked: { type: Boolean, default: false },
    ownedRealms: { type: Array, default: [] }, // realms retrieved from authflow
    configedRealms: [
        {
            realmID: { type: String },
            realmName: { type: String },
            clubID: { type: String },
            settings: {
                botAccount: { type: Boolean, default: true },
                chatType: { type: String },
                lockdown: { type: Boolean },
                adminTag: { type: String, default: "none" },
                worldSpawn: { x: { type: Number }, y: { type: Number }, z: { type: Number } },
                MinFriends: { type: Number },
                MinFollowers: { type: Number },
                MinGamerscore: { type: Number },
                discordInvite: { type: String },
                bannedWords: { type: Array, default: [] },
                bannedLinks: { type: Array, default: [] },
                kickMessage: { type: String, default: "none" }
            }
        }
    ],
    // discord server modules
    discordBanModule: { type: Boolean, default: false },
    // realm modules
    autoBanFromDB: { type: Boolean, default: false },
    moderateDevices: {
        Xbox: { type: Boolean, default: false },
        Playstation: { type: Boolean, default: false },
        Nintendo: { type: Boolean, default: false },
        IOS: { type: Boolean, default: false },
        Windows: { type: Boolean, default: false },
        Android: { type: Boolean, default: false },
        Unknown: { type: Boolean, default: false }
    },
    moderateSkins: { type: Boolean, default: false },
    moderateAlts: { type: Boolean, default: false },
    moderateMovement: { type: Boolean, default: false },
    moderateChat: { type: Boolean, default: false },
    chatFilter: { type: Boolean, default: false },
    antiSpoof: { type: Boolean, default: false },
    autoReconnect: { type: Boolean, default: false },
    moderateBots: { type: Boolean, default: false },
    moderateEmotes: { type: Boolean, default: false },
    logs: {
        bans: {
            channelID: { type: String, default: "0" },
        },
        unbans: {
            channelID: { type: String, default: "0" },
        },
        kicks: {
            channelID: { type: String, default: "0" },
        },
        invites: {
            channelID: { type: String, default: "0" },
        },
        joinsAndLeaves: {
            channelID: { type: String, default: "0" },
        },
        deaths: {
            channelID: { type: String, default: "0" },
        },
        chatRelay: {
            channelID: { type: String, default: "0" },
        },
        autoMod: {
            channelID: { type: String, default: "0" },
        },
        cmdExecution: {
            channelID: { type: String, default: "0" },
        }
    },
    automations: {
        playerlist: {
            channelID: { type: String, default: "0" },
        },
        clubFeed: {
            channelID: { type: String, default: "0" },
        }
    },
    rolePermissions: [
        {
            roleID: { type: String, required: true },
            permissions: {
                banPlayerPerms: { type: Boolean, default: false },
                unbanPlayerPerms: { type: Boolean, default: false },
                kickPlayerPerms: { type: Boolean, default: false },
                configPerms: { type: Boolean, default: false },
                serverLogPerms: { type: Boolean, default: false },
                openRealmPerms: { type: Boolean, default: false },
                closeRealmPerms: { type: Boolean, default: false },
                manageRealmPerms: { type: Boolean, default: false },
                renameRealmPerms: { type: Boolean, default: false },
                playerlistPerms: { type: Boolean, default: false }, // NEW
                realmCodePerms: { type: Boolean, default: false },
                invitePlayersPerms: { type: Boolean, default: false },
                realmJoinPerms: { type: Boolean, default: false },
                realmLeavePerms: { type: Boolean, default: false },
                whitelistPerms: { type: Boolean, default: false },
            }
        }
    ],
    whitelistedUsers: [String],
  // realm modules
  // realmChatRelay: {type: Boolean, default: false},
  // autobanFromDB: {type: Boolean, default: false},
  // automod: {type: Boolean, default: false},
  // realm configs
  // configs: {type: Array, default: [{ banLogs: '0', automod: '0', logsChannel: '0', relayChannel: '0', adminRoleID: '0', moderatorRoleID: '0'}]}, //if 0 not added, if any other number its a channel id
  // commands
  // banCommand: {type: Array, default: [{ permission: ['404'], enabled: true}]}, //404 = default to owner only can run cmd, if any other number its a role id
  // kickCommand: {type: Array, default: [{ permission: ['404'], enabled: true}]},
  // statusCommand: {type: Array, default: [{ permission: ['404'], enabled: true}]},
  // playersCommand: {type: Array, default: [{ permission: ['0'], enabled: true}]},
  // editCommand: {type: Array, default: [{ permission: ['404'], enabled: true}]},
  // worldCommand: {type: Array, default: [{ permission: ['404'], enabled: true}]},
  // moduleCommand: {type: Array, default: [{ permission: ['404'], enabled: true}]},
  // permissionsCommand: {type: Array, default: [{ permission: ['404'], enabled: true}]},
  // consoleCommand: {type: Array, default: [{ permission: ['404'], enabled: true}]},
  // automodCommand: {type: Array, default: [{ permission: ['404'], enabled: true}]},
  // botCommand: {type: Array, default: [{ permission: ['404'], enabled: true}]},
  // realm stuff
  // realmID: {type: Array, default: [{ realmID: '0', name: '0'}]}, //0 = not connected, when linked, will update to realm IDs
  // botConnected: {type: Boolean, default: false},
  // realmStatus: {type: Array, default: [{ realmID: '0', status: '0'}]},
  // realmBans: {type: Array, default: [{ realmID: '0', banCount: '0'}]},
  // realmKicks: {type: Array, default: [{ realmID: '0', kickCount: '0'}]},
  // realmOperators: {type: Array, default: [{ realmID: '0', operators: ['0']}]}, //0 = none, their xuids will be placed in each string
  // automodLogic: {type: Array, default: [{ realmID: '0', logic: '0'}]}, //0 = no logic, 1 = preset 1, 2 = preset 2, etc.
});

const model = mongoose.model('serverDB', serverSchema);

module.exports = model;
