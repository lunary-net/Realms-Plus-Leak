const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const mongoose = require("mongoose");
const serverDB = require("../models/serverDB");
const {
    on,
    off,
    load,
    minecraft,
    reply
} = require("../utility/emojis");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("guild-info")
        .setDescription("Returns information for your server."),

    async execute(interaction) {
        try {
            if (mongoose.connection.readyState !== 1) {
                return await interaction.reply({
                    content: "Database is not connected. Run the command again in 5 seconds!",
                    ephemeral: true
                });
            }

            const initialEmbed = new EmbedBuilder()
                .setColor("Yellow")
                .setDescription(`> Fetching Guild Info ${load}`);

            const sentMessage = await interaction.reply({ embeds: [initialEmbed] });

            const guild = interaction.guild;
            const guildOwner = await guild.members.fetch(guild.ownerId);
            const botCount = guild.members.cache.filter(member => member.user.bot).size;
            const humanCount = guild.memberCount - botCount;
            const channelCount = guild.channels.cache.size;
            const roleCount = guild.roles.cache.size;
            let serverData = await serverDB.findOne({ serverID: guild.id });
            if (!serverData) {
                const creatingEmbed = new EmbedBuilder()
                    .setColor("Yellow")
                    .setDescription(`> No info found, creating model ${load}`);
                    
                await sentMessage.edit({ embeds: [creatingEmbed] });

                serverData = new serverDB({
                    serverID: interaction.guild.id,
                    discordBanModule: false,
                    autoBanFromDB: false,
                    moderateDevices: {},
                    moderateSkins: false,
                    moderateAlts: false,
                    moderateMovement: false,
                    moderateChat: false,
                    moderateBots: false,
                    moderateEmotes: false,
                    logs: [],
                    rolePermissions: []
                });
                await serverData.save();

                const createdEmbed = new EmbedBuilder()
                    .setColor("Yellow")
                    .setDescription(`> Guild model created, continuing ${load}`);

                await sentMessage.edit({ embeds: [createdEmbed] });
            }

            const guildInfoEmbed = new EmbedBuilder()
                .setColor("Green")
                .setDescription(`Info for **${guild.name}**:\n\n**Guild ID:** \`${guild.id}\`\n**Guild Owner:** \`${guildOwner.user.tag}\`\n**Member Count:** \`${humanCount}\`\n**Bot Count:** \`${botCount}\`\n**Channel Count:** \`${channelCount}\`\n**Role Count:** \`${roleCount}\`\n\n**Modules:**\n${getModulesEmoji(serverData)}`)
                .setThumbnail(guild.iconURL());

            await sentMessage.edit({ embeds: [guildInfoEmbed] });

            if (interaction.user.id === guild.ownerId) {
                if (serverData.ownedRealms === 0 || null) {
                    return;
                } else {
                    const realmsEmbed = new EmbedBuilder()
                        .setColor("Orange")
                        .setTitle(`${minecraft} | Realm Information`)
                        .setDescription(`${reply} Hello \`${interaction.user.tag}\`, here's some helpful info on your realm(s):\n\n${serverData.ownedRealms.map((realm) => `**__${realm.name}__**\n${reply} **ID:** \`${realm.id}\`\n${reply} **Expires in:** \`${realm.daysLeft} days\`\n${reply} **Default Permission:** \`${realm.defaultPermission}\`\n${reply} **Realm State:** \`${realm.state}\`\n${reply} **Current Slot:** \`${realm.activeSlot}\`\n`).join("\n")}`)
                        .setThumbnail(process.env.ICON_URL)
                        .setFooter({ text: `NOTE: This embed is only shown for the server owner when they use /guild-info`, iconURL: process.env.ICON_URL });

                    await interaction.followUp({ embeds: [realmsEmbed], ephemeral: true });
                }
            }
        } catch (error) {
            console.error(error);
        }
    }
};

function getModulesEmoji(serverData) {
    let emojiString = "";

    const {
        autoBanFromDB,
        discordBanModule,
        moderateAlts,
        moderateSkins,
        moderateBots,
        moderateEmotes,
        moderateDevices,
        moderateMovement,
        moderateChat,
        antiSpoof
    } = serverData;

    const moderateDevicesEmoji = Object.entries(moderateDevices).map(([key, value]) => {
        const emoji = value ? `${on}` : `${off}`;
        return `${reply} ${key}: ${emoji}`;
    }).join("\n");

    emojiString += `\`autoBanFromDB\` ${autoBanFromDB ? `${on}` : `${off}`}\n`;
    emojiString += `\`discordBanModule\` ${discordBanModule ? `${on}` : `${off}`}\n`;
    emojiString += `\`moderateAlts\` ${moderateAlts ? `${on}` : `${off}`}\n`;
    emojiString += `\`moderateSkins\` ${moderateSkins ? `${on}` : `${off}`}\n`;
    emojiString += `\`moderateBots\` ${moderateBots ? `${on}` : `${off}`}\n`;
    emojiString += `\`moderateEmotes\` ${moderateEmotes ? `${on}` : `${off}`}\n`;
    emojiString += `\`moderateDevices\`\n${moderateDevicesEmoji}\n`;
    emojiString += `\`moderateMovement\` ${moderateMovement ? `${on}` : `${off}`}\n`;
    emojiString += `\`moderateChat\` ${moderateChat ? `${on}` : `${off}`}\n`;
    emojiString += `\`antiSpoof\` ${antiSpoof ? `${on}` : `${off}`}\n`;

    return emojiString;
}
