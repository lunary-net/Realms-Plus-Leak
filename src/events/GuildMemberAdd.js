const {
  Events
} = require('discord.js');
const userDB = require('../models/userDB')
const serverDB = require('../models/serverDB')
const discordDB = require('../models/discordDB')
const mongoose = require('mongoose')
module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(guildMember) {
      try {
          if (mongoose.connection.readyState != 1) return
          let userData = await userDB.findOne({
              userID: guildMember.id
          })
          if (!userData) {
              newUser = await userDB.create({
                  userID: guildMember.id,
                  botBan: false,
                  xuid: '0',
                  accessToken: '0',
                  email: '0',
                  ownedRealms: [{
                      realmID: '0',
                      realmName: '0'
                  }],
                  addCount: 0,
                  reportCount: 0,
                  isAdmin: false,
                  databasePerms: false
              });
              newUser.save().catch((error) => {
                  return console.log(error)
              })
              userData = await userDB.findOne({
                  userID: guildMember.id
              })
          }
          let discordUser = await discordDB.findOne({
              userID: guildMember.id
          })
          let serverData = await serverDB.findOne({
              serverID: guildMember.guild.id
          })
          if (!serverData) {
            serverData = new serverDB(
                {
                    _id: new mongoose.Types.ObjectId(),
                    serverID: guildMember.guild.id,
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
              serverData.save().catch((error) => {
                  return console.log(error)
              });
          }
      } catch (error) {
          console.log(error)
      }
  },
};
