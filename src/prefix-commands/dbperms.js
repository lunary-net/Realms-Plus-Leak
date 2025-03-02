require('dotenv').config()
const { EmbedBuilder } = require('discord.js');
const userDB = require('../models/userDB');

exports.run = async(message, args) => {
    if (args.toString().replaceAll(' ', '') === '') return message.reply(`\`!dbperms\` is a command that when executed on a user, gives them Realms+ Database Permission.\n\nSyntax: !dbperms <user-id>`)
    const user = await message.client.users.fetch(`${args.toString().replaceAll(' ', '')}`).catch(async(error) => {
        return await message.reply('Couldn\'t find that user!')
    })
    try {
      // Fetch data for the target and the author
      let userData = await userDB.findOne({ userID: user.id });
      let authorData = await userDB.findOne({ userID: message.author.id });

      // If the target user doesn't exist in the database, create a new entry
      if (!userData) {
        await userDB.create({
          userID: user.id,
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
        userData = await userDB.findOne({ userID: user.id });
      }

      // Check if the target user already has Database Permissions
      if (userData.isAdmin) {
        return message.reply('This user already has Database Permissions!');
      }

      // Check if the author has Database Permissions
      if (!authorData.isAdmin) {
        return;
      }

      // Log the action in a specific channel
      const logChannel = message.client.channels.cache.get('1179898525413281792');
      const logEmbed = new EmbedBuilder()
        .setColor(946466)
        .setTitle('Someone was just given Realms+ Database Permissions.')
        .setDescription('A user was just given Realms+ Database Permissions! Here is the information regarding it.')
        .addFields(
          { name: 'Author ID', value: message.author.id, inline: true },
          { name: 'Server ID', value: message.guild.id, inline: true },
          { name: 'Target User ID', value: user.id, inline: true },
          { name: 'Target User Tag', value: user.tag, inline: true }
        )
        .setTimestamp()
        .setFooter(process.env.FOOTER, process.env.ICON_URL);

      logChannel.send({ embeds: [logEmbed] });

      // Update the target user's data to grant Database Permissions
      await userDB.findOneAndUpdate({ userID: user.id }, { $set: { databasePerms: true } });

      return message.reply(`<a:checkmark:1183776368249536645> Successfully gave <@${user.id}> Realms+ Database Permissions!`);
    } catch (error) {
      console.error('An error occurred in giveDatabasePerms command:', error);
      return message.reply('An error occurred while processing your request. Please try again later.');
    }
  };
