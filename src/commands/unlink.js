const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const serverDB = require("../models/serverDB");
const mongoose = require("mongoose");
const { reply, load, greencheck, redcross, alert, microsoft, minecraft, id, question } = require("../utility/emojis");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unlink")
        .setDescription("Unlink your Microsoft Account from Realms+"),

    async execute(interaction) {
        if (mongoose.connection.readyState !== 1) {
            return await interaction.reply({ content: `${alert} The database is not connected, please wait 5 seconds!`, ephemeral: true });
        }
        let serverData = await serverDB.findOne({ serverID: interaction.guild.id });
        if (!serverData) {
            return await interaction.reply({ content: `${alert} This guild has no data, your account is not linked.`, ephemeral: true });
        }
        if (interaction.user.id === interaction.guild.ownerId) {
            if (serverData.hasLinked === false) {
                return await interaction.reply({ content: `${alert} You have not linked your Microsoft Account to Realms+.`, ephemeral: true });
            }
            const embed1 = new EmbedBuilder()
                .setColor("Yellow")
                .setTitle(`${microsoft} | Unlinking`)
                .setDescription(`${reply} Fetching Guild Info ${load}`)
                .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

            await interaction.reply({ embeds: [embed1] });

            serverData = await serverDB.findOneAndUpdate(
                { serverID: interaction.guild.id },
                { $set: {
                    hasLinked: false,
                    linkData: {},
                } },
                { new: true }
            );
            await serverData.save();

            const embed2 = new EmbedBuilder()
                .setColor("Green")
                .setTitle(`Success`)
                .setDescription(`${reply} Your account has been unlinked from Realms+ ${greencheck}`)
                .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

            await interaction.editReply({ embeds: [embed2] });
            return;
        }
    }
}