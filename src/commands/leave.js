const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require("discord.js");
const { load, reply, minecraft, person, greencheck, redcross, alert, warn } = require("../utility/emojis");
const { RED, WHITE } = require("../utility/colors");
//const RealmsPlusClient = require("../bedrockClient");
const mongoose = require("mongoose");
const serverDB = require("../models/serverDB");

module.exports = { // adding this later
    data: new SlashCommandBuilder()
        .setName("leave")
        .setDescription("Disconnect Realms+ from a selected realm."),

    async execute(interaction) {
        await interaction.reply({ content: `${alert} This feature is not yet implemented!`, ephemeral: true });
    }
}