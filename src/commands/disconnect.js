// command to completely disconnect Realms+ from a guild
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const mongoose = require("mongoose");
const serverDB = require("../models/serverDB");
const userDB = require("../models/userDB");
const { reply, load, warn, redcross, alert, greencheck } = require("../utility/emojis");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("disconnect")
        .setDescription("Delete all account + guild data."),

    async execute(interaction) {
        const user = interaction.user.id;
        const guildOwner = interaction.guild.ownerId;
        const guildId = interaction.guild.id;

        if (mongoose.connection.readyState !== 1) {
            return await interaction.reply({
                content: `${alert} Database not connected! Run the command again in 5 seconds!`,
                ephemeral: true
            });
        }


        if (user !== guildOwner) {
            return await interaction.reply({
                content: `${alert} You must be the server owner to use this command!`,
                ephemeral: true
            });
        }

        const initialEmbed = new EmbedBuilder()
            .setColor("Yellow")
            .setTitle(`${warn} | Data Deletion`)
            .setDescription(`${reply} Fetching Guild Info ${load}`)
            .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

        const sentMessage = await interaction.reply({ embeds: [initialEmbed] });

        let serverData = await serverDB.findOne({ serverID: guildId });
        if (!serverData) {
            const replyEmbed = new EmbedBuilder()
                .setColor("Red")
                .setTitle(`${redcross} | Invalid Selection`)
                .setDescription(`${reply} No data found for either this guild or you!\n\n**If this is an error and you have data you wish to delete, please contact support:**\n${reply} https://discord.gg/Zh6SW8bZqg`)
                .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

            await sentMessage.edit({ embeds: [replyEmbed] });
        } else {

            const deletingEmbed = new EmbedBuilder()
                .setColor("Orange")
                .setTitle(`${warn} | Data Deletion`)
                .setDescription(`${reply} Deleting All Data ${load}`)
                .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

            await sentMessage.edit({ embeds: [deletingEmbed] });

            serverData = await serverDB.findOneAndDelete({ serverID: guildId });
            const deletedEmbed = new EmbedBuilder()
                .setColor("Red")
                .setTitle(`Data Deleted! ${greencheck}`)
                .setDescription(`${reply} All data was deleted!\n\n**All data associated with your account and this guild has been deleted. The bot will no longer function properly.**`)
                .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });
            await sentMessage.edit({ embeds: [deletedEmbed] });
        }
    }
}