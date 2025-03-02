const {
  Events,
  ActivityType
} = require('discord.js');
const userDB = require('../models/userDB')
const serverDB = require('../models/serverDB')
const hackerDB = require('../models/hackerDB')
const mongoose = require('mongoose')
require('dotenv').config()
module.exports = {
  name: Events.MessageCreate,
  once: false,
  async execute(message) {
      try {
          if (mongoose.connection.readyState != 1) return
          if (message.author.bot) return
          let userData = await userDB.findOneAndUpdate(
              { userID: message.author.id },
              {},
              { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          if (userData.botBan) return
          let serverData = await serverDB.findOneAndUpdate(
              { serverID: message.guild.id },
              {},
              { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          if (userData.isAdmin || !serverData) return
      } catch (error) {
          const errorChannel = await message.client.channels.fetch(`${process.env.ERROR_CHANNEL}`)
          if (message.channel) await errorChannel.send(`There has been an error! Here is the information surrounding it.\n\nServer Found In: **${message.guild.name}**・**${message.guild.id}**\nUser Who Found It: **${message.author.tag}**・**${message.author.id}**\nFound Time: <t:${Math.trunc(Date.now() / 1000)}:R>\nThe Reason: **messageCreate event has an error**\nError: **${error.stack}**\n\`\`\` \`\`\``)
          console.log(error)
      }
  },
};


