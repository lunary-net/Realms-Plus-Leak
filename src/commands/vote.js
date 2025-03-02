const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { GREEN, WHITE } = require("../utility/colors");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("vote")
        .setDescription("Upvote Realms+ and help support the bot!"),

        async execute(interaction) {
            
            const initialEmbed = new EmbedBuilder()
                .setColor("Random")
                .setTitle("Upvote Realms+")
                .setDescription("> [Upvote Realms+ | Top.gg](https://top.gg/bot/1169402081006845972?s=06393496c67fc)")
                .setThumbnail("https://cdn.discordapp.com/attachments/981774405812224011/1084919697868328960/image_4.png")
                .setFooter({
                    text: process.env.FOOTER,
                    iconURL: process.env.ICON_URL
                });

            await interaction.reply({ embeds: [initialEmbed] });
        }
}