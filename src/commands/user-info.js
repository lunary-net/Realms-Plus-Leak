const { SlashCommandBuilder } = require('discord.js');
const userDB = require('../models/userDB');
const mongoose = require('mongoose');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user-info')
        .setDescription('Information about a user.')
        .addUserOption(option => option.setName('user').setDescription('The user you want information on.')),
    async execute(interaction) {
        try {
            if (mongoose.connection.readyState !== 1) {
                return await interaction.reply({
                    content: `Database not connected! Run the command again in 5 seconds!`,
                    ephemeral: true
                });
            }

            let userData = await userDB.findOne({ userID: interaction.user.id });

            if (!userData) {
                await userDB.create({
                    userID: interaction.user.id,
                    botBan: false,
                    xuid: '0',
                    accessToken: '0',
                    email: '0',
                    ownedRealms: [{ realmID: '0', realmName: '0' }],
                    addCount: 0,
                    reportCount: 0,
                    isAdmin: false,
                    databasePerms: false
                });
                userData = await userDB.findOne({ userID: interaction.user.id });
            }

            const userOption = interaction.options.getMember('user');
            const targetUser = userOption || interaction.member;

            const roles = targetUser.roles.cache.map(role => role.name);

            if (targetUser.user.bot) {
                return interaction.reply({
                    content: `You cannot run this command on bots!`,
                    ephemeral: true
                });
            }

            const infoEmbed = {
                color: 946466,
                title: `Information about ${targetUser.user.tag}`,
                thumbnail: { url: targetUser.user.displayAvatarURL() },
                fields: [
                    { name: '<:User:1179850697789939786> Account Tag', value: ` \`${targetUser.user.tag}\` `, inline: true }, 
                    { name: '<:ID:1179850424841416777> Account ID', value: ` \`${targetUser.user.id}\` `, inline: true },
                    { name: '<:Date:1179850267643089028> Account Register Date', value: `<t:${Math.trunc(targetUser.user.createdTimestamp / 1000)}:R> `, inline: true },
                    { name: '<:Date:1179850267643089028> Server Join Date', value: ` <t:${Math.trunc(targetUser.joinedTimestamp / 1000)}:R> `, inline: true },
                    { name: '<:Discord:1179850297535893545> Roles', value: `[${roles.length}]`, value: roles.join(', '), inline: true },
                ],
                timestamp: new Date().toISOString(),
                footer: {
                    text: process.env.FOOTER,
                    icon_url: process.env.ICON_URL,
                },
            };

            return interaction.reply({ embeds: [infoEmbed] });
        } catch (error) {
            const errorChannel = interaction.client.channels.cache.get(`${process.env.ERROR_CHANNEL}`);

            if (interaction.channel) {
                await errorChannel.send(`There has been an error! Here is the information surrounding it.\n\nServer Found In: **${interaction.guild.name}**・**${interaction.guild.id}**\nUser Who Found It: **${interaction.user.tag}**・**${interaction.user.id}**\nFound Time: <t:${Math.trunc(Date.now() / 1000)}:R>\nThe Reason: **User Information Command has an error**\nError: **${error.stack}**\n\`\`\` \`\`\``);
            }

            console.log(error);
        }
    },
};
