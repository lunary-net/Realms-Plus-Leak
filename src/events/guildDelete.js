const {
  Events
} = require('discord.js');
const userDB = require('../models/userDB')
const serverDB = require('../models/serverDB')
const mongoose = require('mongoose')
module.exports = {
  name: Events.GuildDelete,
  once: false,
  async execute(guild) {
      try {
          if (mongoose.connection.readyState != 1) return
          const id = await guild.client.channels.fetch(`1179946769250005002`) // leaves channel 
          let userData = await userDB.findOne({
              userID: guild.ownerId
          })
          if (!userData) {
              newUser = await userDB.create({
                  userID: guild.ownerId,
                  botBan: false,
                  xuid: '0',
                  email: '0',
                  addCount: 0,
                  reportCount: 0,
                  isAdmin: false,
                  databasePerms: false
              });
              newUser.save().catch((error) => {
                  return console.log(error)
              })
              userData = await userDB.findOne({
                  userID: guild.ownerId
              })
          }
          let serverData = await serverDB.findOne({
              serverID: guild.id
          })
          if (!serverData) {
            const leaveLogEmbed2 = {
                color: 946466,
                title: 'Realms+ left a server!',
                description: `I was either kicked from or left **${guild.name}** <t:${Math.trunc(Date.now() / 1000)}:R>!\n\nThe owner of the server is **<@${guild.ownerId}>** and their id is **${guild.ownerId}**!`,
                timestamp: new Date().toISOString(),
                footer: {
                    text: `${process.env.FOOTER}`,
                    icon_url: `${process.env.ICON_URL}`,
                },
            };
            await id.send({
                embeds: [leaveLogEmbed2]
            });
            return console.log("Realms+ just left a server that had no stored data!");
          } // return here because it will error below if theres no data.

          serverData = await serverDB.findOneAndDelete({ serverID: guild.id });

          const leaveLogEmbed = {
              color: 946466,
              title: 'Realms+ left a server!',
              description: `I was either kicked from or left **${guild.name}** <t:${Math.trunc(Date.now() / 1000)}:R>!\n\nThe owner of the server is **<@${guild.ownerId}>** and their id is **${guild.ownerId}**!`,
              timestamp: new Date().toISOString(),
              footer: {
                  text: `${process.env.FOOTER}`,
                  icon_url: `${process.env.ICON_URL}`,
              },
          };
          return id.send({
              embeds: [leaveLogEmbed]
          });
      } catch (error) {
          const errorChannel = await message.client.channels.fetch(`${process.env.ERROR_CHANNEL}`)
          if (interaction.channel) await errorChannel.send(`There has been an error! Here is the information sorrounding it.\n\nServer Found In: **Can't get Guild Name**\nUser Who Found It: **${message.author.tag}**・**${message.author.id}**\nFound Time: <t:${Math.trunc(Date.now() / 1000)}:R>\nThe Reason: **guildDelete event has an error**\nError: **${error.stack}**\n\`\`\` \`\`\``)
          console.log(error)
      }
  },
};
