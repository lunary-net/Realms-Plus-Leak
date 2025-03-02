const { SlashCommandBuilder } = require("discord.js");
const { Algorithm } = require("../handlers/algorithm");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("test")
        .setDescription("test command"),

        async execute(interaction) {
            await interaction.reply("testing");
            new Algorithm()
                .scanType("playerDB");
        }
}