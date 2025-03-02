const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const userDB = require("../models/userDB");
const mongoose = require("mongoose");

const hackerDB = require("../models/hackerDB");
const discordDB = require("../models/discordDB");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("bot-info")
    .setDescription("Information about Realms+."),
  async execute(interaction) {
    try {
      if (mongoose.connection.readyState != 1)
        return await interaction.reply({
          content: `Database not connected! Run the command again in 5 seconds!`,
          ephemeral: true,
        });
      let userData = await userDB.findOne({
        userID: interaction.user.id,
      });
      if (!userData) {
        newUser = await userDB.create({
          userID: interaction.user.id,
          botBan: false,
          xuid: "0",
          accessToken: "0",
          email: "0",
          ownedRealms: [
            {
              realmID: "0",
              realmName: "0",
            },
          ],
          addCount: 0,
          reportCount: 0,
          isAdmin: false,
          databasePerms: false,
        });
        newUser.save().catch((error) => {
          return console.log(error);
        });
        userData = await userDB.findOne({
          userID: interaction.user.id,
        });
      }
      const hackerCount = await hackerDB.countDocuments({});
      const discordCount = await discordDB.countDocuments({});
      let totalSeconds = interaction.client.uptime / 1000;
      let days = Math.floor(totalSeconds / 86400);
      totalSeconds %= 86400;
      let hours = Math.floor(totalSeconds / 3600);
      totalSeconds %= 3600;
      let minutes = Math.floor(totalSeconds / 60);
      let seconds = Math.floor(totalSeconds % 60);
      const infoEmbed = {
        color: 946466,
        title: "Information about Realms+",
        fields: [
          {
            name: "<:emoji_67:1179851254885797959> Server Count",
            value: ` \`${interaction.client.guilds.cache.size}\` `,
            inline: true,
          },
          {
            name: "<:database:1179850995900100751> Hacker Database Count",
            value: ` \`${hackerCount}\` `,
            inline: true,
          },
          {
            name: "<:database:1179850995900100751> Discord User Database Count",
            value: ` \`${discordCount}\` `,
            inline: true,
          },
          {
            name: "<:Discord:1179850297535893545> Support Server",
            value: `[Here](https://discord.gg/Zh6SW8bZqg)`,
            inline: true,
          },
          {
            name: "<:emoji_63:1179851096039116840> Realms+ Dashboard",
            value: ` \`Coming soon!\` `,
            inline: true,
          },
          {
            name: "<:discord_botdev:1179851026002612344> Developers",
            value: `[NoVa Gh0ul](https://github.com/NoVa-Gh0ul)\n[Shwp](https://discord.com/users/1014174658179899503)\n[Shadowfrost](https://github.com/Shadowfrost4886)\n[Determinated](https://github.com/Determinated738)\n[AlterSaber](https://github.com/A1terSaberr)`,
            inline: true,
          },
          {
            name: "<:error:1179864735945068736> Version",
            value: ` \`v${process.env.VERSION}\` `,
            inline: true,
          },
          {
            name: "<:altdetect:1179850867839606875> Ping",
            value: ` \`${interaction.client.ws.ping}\` `,
            inline: true,
          },
          {
            name: "<:Date:1179850267643089028> Uptime",
            value: ` \`${days}d:${hours}h:${minutes}m:${seconds}s\` `,
            inline: true,
          },
          {
            name: "<:Badge_ServerBooster9:1179850028047675413> Birthday",
            value: ` \`January 4th, 2023\` `,
            inline: true,
          },
          {
            name: "<:1operator:1179849670751694868> Original Creators",
            value: `[Point](https://github.com/PointTheDeveloper)\n[Optic Spiderant](https://github.com/OpticSpiderant)`,
            inline: true,
          },
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: `${process.env.FOOTER}`,
          icon_url: `${process.env.ICON_URL}`,
        },
      };
      return interaction.reply({
        embeds: [infoEmbed],
      });
    } catch (error) {
      const errorChannel = interaction.client.channels.cache.get(
        process.env.ERROR_CHANNEL,
      );
      const errorMessage =
        `There has been an error! Here is the information surrounding it.\n\n` +
        `Server Found In: **${interaction.guild.name}**・**${interaction.guild.id}**\n` +
        `User Who Found It: **${interaction.user.tag}**・**${interaction.user.id}**\n` +
        `Found Time: <t:${Math.trunc(Date.now() / 1000)}:R>\n` +
        `The Reason: **Bot Information Command has an error**\n` +
        `Error: **${error.stack}**`;

      if (errorChannel) await errorChannel.send(errorMessage);
      console.error(error);
    }
  },
};
