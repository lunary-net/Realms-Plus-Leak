const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ComponentType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionsBitField } = require("discord.js");
const { load, reply, minecraft, person, greencheck, redcross, alert, warn } = require("../utility/emojis");
const { RED, WHITE } = require("../utility/colors");
const mongoose = require("mongoose");
const userDB = require("../models/userDB");
const serverDB = require("../models/serverDB");
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Connect Realms+ to a selected realm."),

  async execute(interaction, client) {
    if (mongoose.connection.readyState !== 1) {
      return await interaction.reply({ content: `${alert} The bot is not connected to the database, please try again in 5 seconds.`, ephemeral: true });
    }
    const serverData = await serverDB.findOne({ serverID: interaction.guild.id });
    if (!serverData) {
        return await interaction.reply({ content: `${alert} No guild info found, please run </link:1219001806256869396>`, ephemeral: true });
    }
    if (serverData.hasLinked === false) {
        return await interaction.reply({ content: `${alert} The server owner has not linked their account yet, please run </link:1219001806256869396>`, ephemeral: true });
    }
    const memberRoles = interaction.member.roles.cache;
    const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
    const roleWithPerms = serverData.rolePermissions.some(role => memberRoles.has(role.roleID) && role.permissions.realmJoinPerms == true);
    if (!isAdmin && !roleWithPerms) {
      return interaction.reply({ content: `${alert} You don't have permission to use \`/join\`.`, ephemeral: true });
    }

    const embed1 = new EmbedBuilder()
      .setColor("Yellow")
      .setTitle(`${minecraft} | Realm Connection`)
      .setDescription(`${reply} Fetching Guild Info ${load}`)
      .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

    await interaction.reply({ embeds: [embed1] });

    if (serverData.configedRealms.length === 0) {
      const errorEmbed = new EmbedBuilder()
          .setColor("Red")
          .setTitle(`${redcross} | Invalid Selection`)
          .setDescription(`${reply} No realms are configured, please run \`/config realm\``)
          .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

      interaction.editReply({ embeds: [errorEmbed] });
      return;
  }

    const joinMenu = new StringSelectMenuBuilder()
      .setCustomId("joinMenu")
      .setPlaceholder("Select a realm")
      .setMaxValues(1)
      .setMinValues(1)
    for (const realm of serverData.configedRealms) {
      joinMenu.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(realm.realmName)
          .setValue(realm.realmID.toString())
          .setDescription("Click to connect Realms+")
          .setEmoji(minecraft)
      );
    }

    const row = new ActionRowBuilder()
      .addComponents(joinMenu);

    const embed2 = new EmbedBuilder()
      .setColor("Orange")
      .setTitle(`${minecraft} | Realm Connection`)
      .setDescription(`${reply} Select a realm below to connect Realms+ to`)
      .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

    await interaction.editReply({ embeds: [embed2], components: [row] });

    var collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 30000 });

    collector.on("collect", async (interaction) => {
      if (!interaction.isStringSelectMenu()) return;
      if (interaction.customId === "joinMenu") {
        const { RealmsPlusClient } = require("../bedrockClient");
        const realmId = interaction.values[0];
        const guildId = interaction.guild.id;
        const selectedRealm = serverData.configedRealms.find((realm) => realm.realmID.toString() === realmId);
        const realmName = selectedRealm.realmName;
        if (!selectedRealm) {
          const errorEmbed = new EmbedBuilder()
              .setColor("Red")
              .setTitle(`${redcross} | Data Error`)
              .setDescription(`${reply} I was unable to retrieve data for the selected realm, please run \`/config reset\` and then \`/config realm\``)
              .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

          interaction.update({ embeds: [errorEmbed], components: [] });
          return collector.stop();
      }
      switch (selectedRealm.settings.botAccount) {
        case true:
          const embed3 = new EmbedBuilder()
            .setColor("Yellow")
            .setTitle(`${minecraft} | Realm Connection`)
            .setDescription(`${reply} Connecting to \`${realmName}\` ${load}`)

          await interaction.update({ embeds: [embed3], components: [] });
          const { client } = require("../index");
          new RealmsPlusClient(realmId, realmName, selectedRealm, client, guildId, interaction.guild.name, serverData, true);
          setTimeout(async () => {
            const embed4 = new EmbedBuilder()
              .setColor("#08F704")
              .setTitle(`Realms+ Connected`)
              .setDescription(`${reply} Established a connection to \`${realmName}\` ${greencheck}\n\nEnjoying Realms+? Consider upvoting us on [top.gg](https://top.gg/bot/1169402081006845972?s=06393496c67fc)!`)
              .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

          await interaction.editReply({ embeds: [embed4], components: [] });
          return collector.stop();
          }, 2000);
          break
        case false:
          const embed5 = new EmbedBuilder()
            .setColor("Yellow")
            .setTitle(`${minecraft} | Realm Connection`)
            .setDescription(`${reply} Connecting to \`${realmName}\` ${load}`)

          await interaction.update({ embeds: [embed5], components: [] });
          new RealmsPlusClient(realmId, realmName, selectedRealm, client, guildId, interaction.guild.name, serverData, false);
          setTimeout(async () => {
            const embed6 = new EmbedBuilder()
              .setColor("#08F704")
              .setTitle(`Realms+ Connected`)
              .setDescription(`${reply} Established a connection to \`${realmName}\` ${greencheck}\n\nEnjoying Realms+? Consider upvoting us on [top.gg](https://top.gg/bot/1169402081006845972?s=06393496c67fc)!`)
              .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

          await interaction.editReply({ embeds: [embed6], components: [] });
          return collector.stop();
          }, 2000);
          break
      }
      }
    });

    collector.on("end", () => {
      return collector.stop();
    });
    }
}