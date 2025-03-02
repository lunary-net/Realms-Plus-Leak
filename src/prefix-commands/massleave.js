require('dotenv').config()
const userDB = require('../models/userDB')
exports.run = async(message, args) => {
    let user = await message.client.users.fetch(`${args.toString(' ', '')}`);
    message.client.guilds.cache.forEach(guild => {
        if (args.toString().replaceAll(' ', '') === '') return message.reply(`\`!massleave\` is a command that when executed, leaves all guilds that the blacklisted user is the owner of.\n\nSyntax: !massleave <user-id>`)
        if (guild.ownerId === `${user.id}`) guild.leave()
    })
    const id = message.client.channels.cache.get(`1184922168539226244`)
    const logEmbed = {
        color: 946466,
        title: 'Mass Leave Activated',
        description: 'A Realms+ admin just made me mass leave guilds owned by a specific user! Here is the information regarding it.',
        fields: [
            {
                name: 'Author ID',
                value: `${message.author.id}`,
                inline: true,
      },
            {
                name: 'Server ID',
                value: `${message.guild.id}`,
                inline: true,
      },
            {
                name: 'Target Guild Owner Tag',
                value: `${user.tag}`,
                inline: true,
      },
            {
                name: 'Target Guild Owner ID',
                value: `${user.id}`,
                inline: true,
      },
    ],
        timestamp: new Date().toISOString(),
        footer: {
            text: `${process.env.FOOTER}`,
            icon_url: `${process.env.ICON_URL}`,
        },
    };
    id.send({
        embeds: [logEmbed]
    });
    return message.reply(`Left all guilds that <@${user.id}> owns!`)
}