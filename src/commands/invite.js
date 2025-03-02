const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Events,
    ComponentType,
} = require('discord.js');
const mongoose = require('mongoose')
module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Sends an invite link to the bot.'),
  
    async execute(interaction) {
        try {
            if (mongoose.connection.readyState != 1) return await interaction.reply({
                content: `Database not connected! Run the command again in 5 seconds!`,
                ephemeral: true
            })
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                    .setEmoji(`<:discord_botdev:1179851026002612344>`)
                    .setURL('https://discord.com/api/oauth2/authorize?client_id=1169402081006845972&permissions=8&scope=bot+applications.commands')
                    .setLabel('Bot Invite')
                    .setStyle(ButtonStyle.Link),
                    new ButtonBuilder()
                    .setEmoji(`<a:DiscordLogo:1203037850027696158>`)
                    .setURL('https://discord.gg/Zh6SW8bZqg')
                    .setLabel('Support Server')
                    .setStyle(ButtonStyle.Link),
                );
          const inviteEmbed = {
            color: 946466,
            title: 'Realms+ Invite',
            description: "> Thanks for choosing Realms+! Click the `Bot Invite` button to invite me!",
            timestamp: new Date().toISOString(),
            footer: {
              text: `${process.env.FOOTER}`,
              icon_url: `${process.env.ICON_URL}`,
            }
          }
              

          await interaction.reply({
              embeds: [inviteEmbed],

              components: [row]
          });
        }catch (error) {
            const errorChannel = interaction.client.channels.cache.get(`${process.env.ERROR_CHANNEL}`)
            if (interaction.channel) await errorChannel.send(`There has been an error! Here is the information sorrounding it.\n\nServer Found In: **${interaction.guild.name}**・**${interaction.guild.id}**\nUser Who Found It: **${interaction.user.tag}**・**${interaction.user.id}**\nFound Time: <t:${Math.trunc(Date.now() / 1000)}:R>\nThe Reason: **Invite Command has an error**\nError: **${error.stack}**\n\`\`\` \`\`\``)
            console.log(error)
          }
                       }
      }


// © 2023 Realms+ 
