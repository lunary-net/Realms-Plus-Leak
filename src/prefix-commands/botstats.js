require('dotenv').config();
const mongoose = require('mongoose');
const userDB = require('../models/userDB');
const realmProfileDB = require('../models/realmProfileDB');

exports.run = async (message, args) => {
    if (!args.length || args[0].toLowerCase() !== 'true') {
        return message.reply('`!botstats` returns statistics about the bot. SYNTAX: !botstats True');
    }
    
    let totalSeconds = message.client.uptime / 1000;
	let days = Math.floor(totalSeconds / 86400);
	totalSeconds %= 86400;
	let hours = Math.floor(totalSeconds / 3600);
	totalSeconds %= 3600;
	let minutes = Math.floor(totalSeconds / 60);
	let seconds = Math.floor(totalSeconds % 60);

    // Gather bot info
    const guilds = message.client.guilds.cache.size;
    const totalMembers = message.client.guilds.cache.reduce((prev, guild) => prev + guild.memberCount, 0);
    const dbCount = await userDB.countDocuments();
    const ping = message.client.ws.ping;
    const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    const botName = message.client.user.username;
    const botTag = message.client.user.tag;
    const botId = message.client.user.id;
    const shards = message.client.ws.shards.size; // If using sharding
    const pfpURL = message.client.user.displayAvatarURL({ format: 'png', dynamic: true });

    // Create embed for bot stats
    const botStatsEmbed = {
        color: 0x7289DA,
        title: 'Bot Statistics',
        fields: [
            { name: 'Guilds', value: guilds.toLocaleString(), inline: true },
            { name: 'Total Members', value: totalMembers.toLocaleString(), inline: true },
            { name: 'Database Documents', value: dbCount.toLocaleString(), inline: true },
            { name: 'Ping', value: ping + 'ms', inline: true },
            { name: 'Uptime', value: uptime, inline: true },
            { name: 'Bot Name', value: botName, inline: true },
            { name: 'Bot Tag', value: botTag, inline: true },
            { name: 'Bot ID', value: botId, inline: true },
            { name: 'Shards', value: shards, inline: true },
        ],
        thumbnail: {
            url: pfpURL,
        },
        timestamp: new Date(),
        footer: {
            text: process.env.FOOTER,
            icon_url: process.env.ICON_URL,
        },
    };

    // Send bot stats embed
    return message.reply({ embeds: [botStatsEmbed] });
};
