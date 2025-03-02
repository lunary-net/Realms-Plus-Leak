const { Events, EmbedBuilder } = require("discord.js");
const { warn, alert, greencheck, discord, id, person, calander } = require("../utility/emojis");
const { BG_GREEN, RESET, WHITE, MAGENTA, GREEN, YELLOW, BLUE } = require("../utility/colors");
const userDB = require("../models/userDB");
const serverDB = require("../models/serverDB");
const mongoose = require("mongoose");

module.exports = {
  name: Events.GuildCreate,
  once: false,
  async execute(guild) {
    try {
      if (mongoose.connection.readyState !== 1) return;

      let userData = await userDB.findOne({ userID: guild.ownerId });
      if (!userData) {
        userData = new userDB({
          userID: guild.ownerId,
          botBan: false,
          xuid: "0",
          gamertag: "0",
          email: "0",
          addCount: 0,
          reportCount: 0,
          isAdmin: false,
          databasePerms: false
        });
        await userData.save();
        userData = await userDB.findOne({ userID: guild.ownerId });
      }

      let serverData = await serverDB.findOne({ serverID: guild.id });
      if (!serverData) {
        serverData = new serverDB(
          {
              _id: new mongoose.Types.ObjectId(),
              serverID: guild.id,
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
      serverData = await serverDB.findOne({ serverID: guild.id });
      }

      const channelID = await guild.client.channels.fetch("1174027490591768679");

      if (userData.botBan === true || serverData.isBlacklisted === true) {
        const warnEmbed = new EmbedBuilder()
          .setColor("Orange")
          .setTitle(`${warn} Blacklisted Join Blocked`)
          .setDescription(`A blacklisted server and/or user just tried to invite Realms+!\n\n**Owner:** <@${guild.ownerId}>\n**Guild Name:** \`${guild.name}\`\n**Guild ID:** \`${guild.id}\``)
          .setThumbnail(guild.iconURL())
          .setFooter({ text: `Realms+ Auto-Left this server.` })

          if (channelID) {
            await channelID.send({ embeds: [warnEmbed] });
          }
        return await guild.leave();
      }

      console.log(`[ ${BG_GREEN}New Server${RESET} ]  >>>  ${GREEN}Realms+ ${WHITE}has joined a new server! ${MAGENTA}Server Name: ${YELLOW}${guild.name} ${MAGENTA}Server ID: ${YELLOW}${guild.id} ${MAGENTA}Member Count: ${YELLOW}${guild.memberCount}`);

      const joinEmbed = new EmbedBuilder()
        .setColor(946466)
        .setTitle(`Thanks for inviting Realms+!`)
        .setDescription(`> Run \`/help\` for command info!\n\nFor further assistance, join our Support Server: https://discord.gg/Q2ndaxNqVy`)
        .setThumbnail(`${process.env.ICON_URL}`)
        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL })
        .setTimestamp();

      if (guild.systemChannel) {
        await guild.systemChannel.send({ embeds: [joinEmbed] });
      }

      const joinLogEmbed = new EmbedBuilder()
        .setColor(946466)
        .setTitle(`Realms+ joined a new server!`)
        .setDescription(`> ${discord} **Guild Name:** \`${guild.name}\`\n> ${id} **Guild ID:** \`${guild.id}\`\n> ${person} **Member Count:** \`${guild.memberCount}\`\n> **Owner:** <@${guild.ownerId}>`)
        .setThumbnail(guild.iconURL())
        .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL })
        .setTimestamp();

      if (channelID) {
        await channelID.send({ embeds: [joinLogEmbed] });
      }
    } catch (error) {
      const errorChannel = await guild.client.channels.fetch(`${process.env.ERROR_CHANNEL}`);
      await errorChannel.send(`There has been an error! Here is the information surrounding it.\n\nServer Found In: **${guild.name}**\nUser Who Found It: **${guild.ownerId}**\nFound Time: <t:${Math.trunc(Date.now() / 1000)}:R>\nThe Reason: **guildCreate event has an error**\nError: **${error.stack}**\n\`\`\` \`\`\``);
      console.log(error);
    }
  }
}