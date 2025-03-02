const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { reply, load, database, discord } = require("../utility/emojis");
const mongoose = require("mongoose");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Shows the bot's latency and its connected services."),
  async execute(interaction) {
    const startTime = Date.now();
    const embed1 = new EmbedBuilder()
      .setColor("Yellow")
      .setAuthor({ name: "Realms+ Ping", iconURL: process.env.ICON_URL })
      .setDescription(`Calculating Ping ${load}`);

    await interaction.reply({ embeds: [embed1] });

    const endTime = Date.now();
    const ping = endTime - startTime;

    const mongoStart = Date.now();
    await mongoose.connection.db.command({ ping: 1 });
    const mongoPing = Date.now() - mongoStart;

    const embed2 = new EmbedBuilder()
      .setColor("Random")
      .setAuthor({ name: "Realms+ Ping", iconURL: process.env.ICON_URL })
      .setDescription(
        `${discord} **WebSocket Ping:** \`${interaction.client.ws.ping}ms\`\n${database} **Database Ping:** \`${mongoPing}ms\`\n${reply} **Response Time:** \`${ping}ms\``
      );

    return await interaction.editReply({ embeds: [embed2] });
  },
};