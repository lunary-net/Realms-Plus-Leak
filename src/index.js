const {
  Client,
  GatewayIntentBits,
  Collection,
  EmbedBuilder 
} = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config();
const token = process.env.TOKEN; // bot token
const discordDB = require("./models/discordDB");
const serverDB = require("./models/serverDB");
const { warn, alert } = require("./utility/emojis");
const { YELLOW, WHITE } = require("./utility/colors");
const client = new Client({
  // client id
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildModeration
  ],
});
const mongoose = require("mongoose");
const userDB = require("./models/userDB");
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

const commandCooldown = new Set();

client.commands = new Collection();

// Load events
for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// Load commands with error handling
for (const file of commandFiles) {
  try {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    // Check if the command has a data property
    if (command.data) {
      const commandName = command.data.name || (command.data.toJSON && command.data.toJSON().name);

      if (commandName) {
        client.commands.set(commandName, command);
      } else {
        console.error(`Command name is missing in file: ${file}`);
      }
    } else {
      console.error(`Command data is missing in file: ${file}`);
    }
  } catch (error) {
    console.error(`Error loading command file: ${file}\n${error.stack}`);
  }
}

client.setMaxListeners(30);

client.on('error', (error) => {
  if (error && error.message && error.message.includes("compressorInHeader")) {
    // this error comes from Discord -> Minecraft relay and is an issue with bedrock-protocol, we're ignoring it
    return;
  }
  console.error('Discord Client Error:', error);
});

process.on('unhandledRejection', (error) => {
  console.log(error);
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

        let userData = await userDB.findOne({
            userID: interaction.user.id
        });
        if (!userData) {
            userData = new userDB({
                userID: interaction.user.id,
                botBan: false,
                xuid: "0",
                email: "0",
                addCount: 0,
                reportCount: 0,
                isAdmin: false,
                databasePerms: false,
            });
            await userData.save();
        }

        if (userData.botBan) {
            return interaction.reply({
                content: `${alert} Uh oh! You are \`banned\` from using Realms+!`,
                ephemeral: true,
            });
        }

        if (commandCooldown.has(interaction.user.id)) {
            return interaction.reply({
                content: `${alert} *Hold on ${interaction.user.tag}! You can only run a command every 5 seconds!*`,
                ephemeral: true,
            });
        } else {
            if (!userData.isAdmin) {
                commandCooldown.add(interaction.user.id);
                setTimeout(() => {
                    commandCooldown.delete(interaction.user.id);
                }, 5000);
            }
        }

        const command = interaction.client.commands.get(interaction.commandName);
        const logChannel = interaction.client.channels.cache.get(process.env.LOG_CHANNEL);

        if (!command) return;

        try {
            await command.execute(interaction);

            const embed = new EmbedBuilder()
              .setColor("Navy")
              .setTitle(`New Interaction!`)
              .setDescription(`**Command:** \`${interaction.commandName}\`\n**User:** <@${interaction.user.id}>\n**Server Name:** \`${interaction.guild.name}\`\n**Server ID:** \`${interaction.guild.id}\``)
              .setThumbnail(interaction.user.displayAvatarURL())

            if (logChannel) {
                await logChannel.send({ embeds: [embed] });
            }
            return;
        } catch (error) {
          console.log(error);
        }
});

// Discord Auto Ban (move into GuildMemberAdd.js later)
client.on("guildMemberAdd", async (member) => {
  let serverData = await serverDB.findOne({ serverID: member.guild.id });
  const memberData = await discordDB.findOne({ userID: member.id });
  if (serverData.discordBanModule === true) {
    if (memberData) {
      const dmEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle(`${warn} | Ban Notice`)
        .setDescription(`You have been banned from **${member.guild.name}** for being found in our database.\n**Database Reason:** \`${memberData.reason}\`\n\nYou may make an appeal to be removed from our database [here](https://discord.gg/Zh6SW8bZqg), or you can dm [NoVa Gh0ul](https://discord.com/users/907712767644020787)\n\nhave a nice day :D`)
        .setThumbnail(process.env.ICON_URL)

      await member.send({ embeds: [dmEmbed] });

      console.log(YELLOW + `[AUTO-BAN]` + WHITE + ` Discord Ban Module has just been triggered in ${member.guild.name}! Banned User: ${member.tag} | ${member.id}`);
      member.guild.members.ban(member)

      if (serverData.logs.autoMod.channelID !== "0") {
        const channelId = serverData.logs.autoMod.channelID;
        const channel = client.channels.cache.get(channelId);
        const logEmbed = new EmbedBuilder()
          .setColor("Orange")
          .setTitle(`${warn} R+ Auto Ban`)
          .setDescription(`Discord Ban Module has been triggered!\n\n**Banned User:** <@${member.id}>\n**Database ID:** \`${memberData.dbid}\`\n**Reason:** Found in the database for: \`${memberData.reason}\``)
          .setThumbnail(member.displayAvatarURL({ dynamic: true }))

        await channel.send({ embeds: [logEmbed] });
      }
    }
  } else return;
});

client.login(token);

console.log(
  "\x1b[32m\x1b[1m\x1b[2m",
  "               REALMS+ IS ALIVE!!!!",
  "\x1b[0m"
);

// Auto Refresh Access Tokens
setInterval(() => {
  RefreshHandler();
}, 79200000); // every 22 hours

module.exports = {
  client
}