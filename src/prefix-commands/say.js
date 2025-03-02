exports.run = async (message, args) => {
    const userDB = require('../models/userDB');
    let userData = await userDB.findOne({ userID: message.author.id });
    if (!userData) {
        userData = await userDB.create({
            userID: message.author.id,
            botBan: false,
            xuid: '0',
            accessToken: '0',
            email: '0',
            ownedRealms: [{ realmID: '0', realmName: '0' }],
            addCount: 0,
            reportCount: 0,
            isAdmin: false
        });
        await userData.save();
    }
    if (!args.length) return message.reply('`!say` is a command that echoes your message back using the bot.\n\nSyntax: !say <context>');
    if (!userData.isAdmin) return;
    const channelId = '1179901777311715469';
    const id = message.client.channels.cache.get(channelId);
    const fixedMessage = args.join(' ').replace(/@/g, '');
    if (!fixedMessage) return message.reply('Pings aren\'t allowed for this command.');
    const messageContent = `**${message.author.tag}:** ${fixedMessage}`;
    const logEmbed = {
        color: 946466,
        title: 'I just said something at the request of a user.',
        description: 'A Realms+ admin used the say prefix command! Here is the information regarding it.',
        fields: [
            { name: 'Author ID', value: `${message.author.id}`, inline: true },
            { name: 'Server ID', value: `${message.guild.id}`, inline: true },
            { name: 'Contents', value: fixedMessage, inline: true }
        ],
        timestamp: new Date().toISOString(),
        footer: {
            text: process.env.FOOTER,
            icon_url: `${process.env.ICON_URL}`,
        }
    };
    id.send({ embeds: [logEmbed] });
    const allowedAuthors = ['943653593548984341', '1010616280547594240', '907712767644020787','1103502962032132126', '659786920255029270'];
    if (allowedAuthors.includes(message.author.id)) {
        message.channel.send(fixedMessage);
    } else {
        message.channel.send(messageContent);
    }
    message.delete().catch(console.error);
};