const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, StringSelectMenuOptionBuilder, PermissionsBitField, ButtonBuilder, ButtonStyle } = require('discord.js');
const { reply, load, reason, greencheck, redcross, alert } = require('../utility/emojis');
const { RED, WHITE } = require('../utility/colors');
const userDB = require('../models/userDB');
const serverDB = require('../models/serverDB');
const mongoose = require('mongoose');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("logs")
    .setDescription("Log Commands for Realms+")
    .addSubcommand(subcommand =>
      subcommand
        .setName("set")
        .setDescription("Set a type of log to be enabled/disabled in a specific channel.")
        .addStringOption(option =>
        option
        .setName("toggle")
        .setDescription("Enable / Disable the log(s) you select.")
        .setRequired(true)
        .addChoices(
          { name: "Enable", value: "enable" },
          { name: "Disable", value: "disable" }
        ))
        .addChannelOption(option =>
        option
        .setName("channel")
        .setDescription("The channel to manage logs for.")
        .setRequired(true)
      )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("list")
        .setDescription("List all logs and their settings.")
      )
    .addSubcommand(subcommand =>
      subcommand
        .setName("clear")
        .setDescription("Clear all logs for this server.")
      ),

      async execute(interaction) {
        try {
          if (interaction.options.getSubcommand() === "set") {
            if (mongoose.connection.readyState !== 1) {
              return await interaction.reply({ content: `${alert} The database is not connected, please wait 5 seconds!`, ephemeral: true });
            }
            const serverData = await serverDB.findOne({ serverID: interaction.guild.id });
            if (!serverData) {
              serverData = new serverDB(
                {
                    _id: new mongoose.Types.ObjectId(),
                    serverID: interaction.guild.id,
                    isBlacklisted: false,
                    addCount: 0,
                    configOptions: {
                        botAccount: true,
                        chatType: "normal"
                    },
                    linkData: {},
                    hasLinked: false,
                    ownedRealms: [],
                    configedRealms: [],
                    discordBanModule: false,
                    autoBanFromDB: false,
                    moderateDevices: {
                        Xbox: false,
                        Playstation: false,
                        Nintendo: false,
                        IOS: false,
                        Windows: false,
                        Android: false,
                        Unknown: false
                    },
                    moderateSkins: false,
                    moderateAlts: false,
                    moderateMovement: false,
                    moderateChat: false,
                    moderateBots: false,
                    moderateEmotes: false,
                    logs: {
                        bans: {
                            channelID: "0",
                        },
                        unbans: {
                            channelID: "0",
                        },
                        kicks: {
                            channelID: "0",
                        },
                        invites: {
                            channelID: "0",
                        },
                        joinsAndLeaves: {
                            channelID: "0",
                        },
                        deaths: {
                          channelID: "0",
                        },
                        chatRelay: {
                            channelID: "0",
                        },
                        autoMod: {
                            channelID: "0",
                        },
                        cmdExecution: {
                            channelID: "0",
                        }
                    },
                    rolePermissions: [],
                    whitelistedUsers: [],
                }
            );
            await serverData.save();
            }

            const memberRoles = interaction.member.roles.cache;
            const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
            const roleWithPerms = serverData.rolePermissions.some(role => memberRoles.has(role.roleID) && role.permissions.serverLogPerms == true);
                    if (!isAdmin && !roleWithPerms) {
                        return interaction.reply({ content: `${alert} You don't have permission to use \`/logs set\`.`, ephemeral: true });
                    }

            const value = interaction.options.getString("toggle");
            const channel = interaction.options.getChannel("channel");

            const embed1 = new EmbedBuilder()
              .setColor("Yellow")
              .setTitle(`${reason} | Log Setup`)
              .setDescription(`${reply} Fetching Guild Info ${load}`)
              .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

            await interaction.reply({ embeds: [embed1] });

            const logMenu = new StringSelectMenuBuilder()
              .setCustomId("logMenu")
              .setPlaceholder("Select a log type")
              .setMaxValues(8)
              .setMinValues(1)
              .addOptions(
                new StringSelectMenuOptionBuilder()
                  .setLabel("Realm Bans")
                  .setValue("bans")
                  .setEmoji(reason),
                new StringSelectMenuOptionBuilder()
                  .setLabel("Realm Unbans")
                  .setValue("unbans")
                  .setEmoji(reason),
                new StringSelectMenuOptionBuilder()
                  .setLabel("Realm Kicks")
                  .setValue("kicks")
                  .setEmoji(reason),
                new StringSelectMenuOptionBuilder()
                  .setLabel("Realm Invites")
                  .setValue("invites")
                  .setEmoji(reason),
                new StringSelectMenuOptionBuilder()
                  .setLabel("Player Joins + Leaves")
                  .setValue("joinsAndLeaves")
                  .setEmoji(reason),
                new StringSelectMenuOptionBuilder()
                  .setLabel("Player Deaths")
                  .setValue("deaths")
                  .setEmoji(reason),
                new StringSelectMenuOptionBuilder()
                  .setLabel("Chat Relay")
                  .setValue("chatRelay")
                  .setEmoji(reason),
                new StringSelectMenuOptionBuilder()
                  .setLabel("Auto Mod")
                  .setValue("autoMod")
                  .setEmoji(reason),
                  /*
                new StringSelectMenuOptionBuilder()
                  .setLabel("Command Execution")
                  .setValue("cmdExecution")
                  .setEmoji(reason),
                  */
              )

            const row = new ActionRowBuilder()
              .addComponents(logMenu);

            const embed2 = new EmbedBuilder()
              .setColor("Orange")
              .setTitle(`${reason} | Log Setup`)
              .setDescription(`${reply} Select the log type(s) to \`${value}\` in <#${channel.id}>.`)
              .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

            await interaction.editReply({ embeds: [embed2], components: [row] });

            var collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000 });


            collector.on("collect", async (interaction) => {
              if (!interaction.isStringSelectMenu()) return;
              if (interaction.customId === "logMenu") {
                const selectedLogs = interaction.values;
                let outcomes = [];
                switch (value) {
                  case "enable":
                    for (const logType of selectedLogs) {
                      switch (logType) {
                        case "bans":
                          if (serverData.logs.bans.channelID === channel) {
                            outcomes.push(`${redcross} \`${logType}\` is already enabled in <#${channel.id}>.`);
                          } else if (serverData.logs.bans.channelID !== "0" && serverData.logs.bans.channelID !== channel) {
                            outcomes.push(`${redcross} \`${logType}\` is already enabled in <#${serverData.logs.bans.channelID}>.`);
                          } else {
                            serverData.logs.bans.channelID = channel.id;
                            outcomes.push(`${greencheck} \`${logType}\` is now enabled in <#${channel.id}>.`);
                            await serverData.save();
                          }
                          break
                        case "unbans":
                          if (serverData.logs.unbans.channelID === channel) {
                            outcomes.push(`${redcross} \`${logType}\` is already enabled in <#${channel.id}>.`);
                          } else if (serverData.logs.unbans.channelID !== "0" && serverData.logs.unbans.channelID !== channel) {
                            outcomes.push(`${redcross} \`${logType}\` is already enabled in <#${serverData.logs.unbans.channelID}>.`);
                          } else {
                            serverData.logs.unbans.channelID = channel.id;
                            outcomes.push(`${greencheck} \`${logType}\` is now enabled in <#${channel.id}>.`);
                            await serverData.save();
                          }
                          break
                        case "kicks":
                          if (serverData.logs.kicks.channelID === channel) {
                            outcomes.push(`${redcross} \`${logType}\` is already enabled in <#${channel.id}>.`);
                          } else if (serverData.logs.kicks.channelID !== "0" && serverData.logs.kicks.channelID !== channel) {
                            outcomes.push(`${redcross} \`${logType}\` is already enabled in <#${serverData.logs.kicks.channelID}>.`);
                          } else {
                            serverData.logs.kicks.channelID = channel.id;
                            outcomes.push(`${greencheck} \`${logType}\` is now enabled in <#${channel.id}>.`);
                            await serverData.save();
                          }
                          break
                        case "invites":
                          if (serverData.logs.invites.channelID === channel) {
                            outcomes.push(`${redcross} \`${logType}\` is already enabled in <#${channel.id}>.`);
                          } else if (serverData.logs.invites.channelID !== "0" && serverData.logs.invites.channelID !== channel) {
                            outcomes.push(`${redcross} \`${logType}\` is already enabled in <#${serverData.logs.invites.channelID}>.`);
                          } else {
                            serverData.logs.invites.channelID = channel.id;
                            outcomes.push(`${greencheck} \`${logType}\` is now enabled in <#${channel.id}>.`);
                            await serverData.save();
                          }
                          break
                        case "joinsAndLeaves":
                          if (serverData.logs.joinsAndLeaves.channelID === channel) {
                            outcomes.push(`${redcross} \`${logType}\` is already enabled in <#${channel.id}>.`);
                          } else if (serverData.logs.joinsAndLeaves.channelID !== "0" && serverData.logs.joinsAndLeaves.channelID !== channel) {
                            outcomes.push(`${redcross} \`${logType}\` is already enabled in <#${serverData.logs.joinsAndLeaves.channelID}>.`);
                          } else {
                            serverData.logs.joinsAndLeaves.channelID = channel.id;
                            outcomes.push(`${greencheck} \`${logType}\` is now enabled in <#${channel.id}>.`);
                            await serverData.save();
                          }
                          break
                        case "deaths":
                          if (serverData.logs.deaths.channelID === channel) {
                            outcomes.push(`${redcross} \`${logType}\` is already enabled in <#${channel.id}>.`);
                          } else if (serverData.logs.deaths.channelID !== "0" && serverData.logs.deaths.channelID !== channel) {
                            outcomes.push(`${redcross} \`${logType}\` is already enabled in <#${serverData.logs.deaths.channelID}>.`);
                          } else {
                            serverData.logs.deaths.channelID = channel.id;
                            outcomes.push(`${greencheck} \`${logType}\` is now enabled in <#${channel.id}>.`);
                            await serverData.save();
                          }
                          break
                        case "chatRelay":
                          if (serverData.logs.chatRelay.channelID === channel) {
                            outcomes.push(`${redcross} \`${logType}\` is already enabled in <#${channel.id}>.`);
                          } else if (serverData.logs.chatRelay.channelID !== "0" && serverData.logs.chatRelay.channelID !== channel) {
                            outcomes.push(`${redcross} \`${logType}\` is already enabled in <#${serverData.logs.chatRelay.channelID}>.`);
                          } else {
                            serverData.logs.chatRelay.channelID = channel.id;
                            outcomes.push(`${greencheck} \`${logType}\` is now enabled in <#${channel.id}>.`);
                            await serverData.save();
                          }
                          break
                        case "autoMod":
                          if (serverData.logs.autoMod.channelID === channel) {
                            outcomes.push(`${redcross} \`${logType}\` is already enabled in <#${channel.id}>.`);
                          } else if (serverData.logs.autoMod.channelID !== "0" && serverData.logs.autoMod.channelID !== channel) {
                            outcomes.push(`${redcross} \`${logType}\` is already enabled in <#${serverData.logs.autoMod.channelID}>.`);
                          } else {
                            serverData.logs.autoMod.channelID = channel.id;
                            outcomes.push(`${greencheck} \`${logType}\` is now enabled in <#${channel.id}>.`);
                            await serverData.save();
                          }
                          break
                        case "cmdExecution":
                          if (serverData.logs.cmdExecution.channelID === channel) {
                            outcomes.push(`${redcross} \`${logType}\` is already enabled in <#${channel.id}>.`);
                          } else if (serverData.logs.cmdExecution.channelID !== "0" && serverData.logs.cmdExecution.channelID !== channel) {
                            outcomes.push(`${redcross} \`${logType}\` is already enabled in <#${serverData.logs.cmdExecution.channelID}>.`);
                          } else {
                            serverData.logs.cmdExecution.channelID = channel.id;
                            outcomes.push(`${greencheck} \`${logType}\` is now enabled in <#${channel.id}>.`);
                            await serverData.save();
                          }
                          break
                      }
                    }
                    break
                  case "disable":
                    for (const logType of selectedLogs) {
                      switch (logType) {
                        case "bans":
                          if (serverData.logs.bans.channelID === "0") {
                            outcomes.push(`${redcross} \`${logType}\` is not being tracked anywhere.`);
                          } else if (serverData.logs.bans.channelID !== channel.id) {
                            outcomes.push(`${redcross} \`${logType}\` is not being tracked in <#${channel.id}>.`);
                          } else {
                            serverData.logs.bans.channelID = "0";
                            outcomes.push(`${greencheck} \`${logType}\` is no longer tracked in <#${channel.id}>.`);
                            await serverData.save();
                          }
                          break
                        case "unbans":
                          if (serverData.logs.unbans.channelID === "0") {
                            outcomes.push(`${redcross} \`${logType}\` is not being tracked anywhere.`);
                          } else if (serverData.logs.unbans.channelID !== channel.id) {
                            outcomes.push(`${redcross} \`${logType}\` is not being tracked in <#${channel.id}>.`);
                          } else {
                            serverData.logs.unbans.channelID = "0";
                            outcomes.push(`${greencheck} \`${logType}\` is no longer tracked in <#${channel.id}>.`);
                            await serverData.save();
                          }
                          break
                        case "kicks":
                          if (serverData.logs.kicks.channelID === "0") {
                            outcomes.push(`${redcross} \`${logType}\` is not being tracked anywhere.`);
                          } else if (serverData.logs.kicks.channelID !== channel.id) {
                            outcomes.push(`${redcross} \`${logType}\` is not being tracked in <#${channel.id}>.`);
                          } else {
                            serverData.logs.kicks.channelID = "0";
                            outcomes.push(`${greencheck} \`${logType}\` is no longer tracked in <#${channel.id}>.`);
                            await serverData.save();
                          }
                          break
                        case "invites":
                          if (serverData.logs.invites.channelID === "0") {
                            outcomes.push(`${redcross} \`${logType}\` is not being tracked anywhere.`);
                          } else if (serverData.logs.invites.channelID !== channel.id) {
                            outcomes.push(`${redcross} \`${logType}\` is not being tracked in <#${channel.id}>.`);
                          } else {
                            serverData.logs.invites.channelID = "0";
                            outcomes.push(`${greencheck} \`${logType}\` is no longer tracked in <#${channel.id}>.`);
                            await serverData.save();
                          }
                          break
                        case "joinsAndLeaves":
                          if (serverData.logs.joinsAndLeaves.channelID === "0") {
                            outcomes.push(`${redcross} \`${logType}\` is not being tracked anywhere.`);
                          } else if (serverData.logs.joinsAndLeaves.channelID !== channel.id) {
                            outcomes.push(`${redcross} \`${logType}\` is not being tracked in <#${channel.id}>.`);
                          } else {
                            serverData.logs.joinsAndLeaves.channelID = "0";
                            outcomes.push(`${greencheck} \`${logType}\` is no longer tracked in <#${channel.id}>.`);
                            await serverData.save();
                          }
                          break
                        case "deaths":
                          if (serverData.logs.deaths.channelID === "0") {
                            outcomes.push(`${redcross} \`${logType}\` is not being tracked anywhere.`);
                          } else if (serverData.logs.deaths.channelID !== channel.id) {
                            outcomes.push(`${redcross} \`${logType}\` is not being tracked in <#${channel.id}>.`);
                          } else {
                            serverData.logs.deaths.channelID = "0";
                            outcomes.push(`${greencheck} \`${logType}\` is no longer tracked in <#${channel.id}>.`);
                            await serverData.save();
                          }
                          break
                        case "chatRelay":
                          if (serverData.logs.chatRelay.channelID === "0") {
                            outcomes.push(`${redcross} \`${logType}\` is not being tracked anywhere.`);
                          } else if (serverData.logs.chatRelay.channelID !== channel.id) {
                            outcomes.push(`${redcross} \`${logType}\` is not being tracked in <#${channel.id}>.`);
                          } else {
                            serverData.logs.chatRelay.channelID = "0";
                            outcomes.push(`${greencheck} \`${logType}\` is no longer tracked in <#${channel.id}>.`);
                            await serverData.save();
                          }
                          break
                        case "autoMod":
                          if (serverData.logs.autoMod.channelID === "0") {
                            outcomes.push(`${redcross} \`${logType}\` is not being tracked anywhere.`);
                          } else if (serverData.logs.autoMod.channelID !== channel.id) {
                            outcomes.push(`${redcross} \`${logType}\` is not being tracked in <#${channel.id}>.`);
                          } else {
                            serverData.logs.autoMod.channelID = "0";
                            outcomes.push(`${greencheck} \`${logType}\` is no longer tracked in <#${channel.id}>.`);
                            await serverData.save();
                          }
                          break
                        case "cmdExecution":
                          if (serverData.logs.cmdExecution.channelID === "0") {
                            outcomes.push(`${redcross} \`${logType}\` is not being tracked anywhere.`);
                          } else if (serverData.logs.cmdExecution.channelID !== channel.id) {
                            outcomes.push(`${redcross} \`${logType}\` is not being tracked in <#${channel.id}>.`);
                          } else {
                            serverData.logs.cmdExecution.channelID = "0";
                            outcomes.push(`${greencheck} \`${logType}\` is no longer tracked in <#${channel.id}>.`);
                            await serverData.save();
                          }
                          break
                      }
                    }
                    break
                }
                const embed4 = new EmbedBuilder()
                  .setColor("#00FF00")
                  .setTitle(`${reason} | Log Setup`)
                  .setDescription(`${reply} Settings Saved ${greencheck}\n\n**Result:**\n${outcomes.join("\n")}`)

                await interaction.update({ embeds: [embed4], components: [] });
                return collector.stop();
              }
            });

            collector.on("end", () => {
              return collector.stop();
            });
          } else if (interaction.options.getSubcommand() === "list") {
            if (mongoose.connection.readyState !== 1) {
              return await interaction.reply({ content: `${alert} The database is not connected, please wait 5 seconds!`, ephemeral: true });
            }
            let serverData = await serverDB.findOne({ serverID: interaction.guild.id });
            if (!serverData) {
              return await interaction.reply({ content: `${alert} This server has no saved data.`, ephemeral: true });
            }

            const memberRoles = interaction.member.roles.cache;
            const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
            const roleWithPerms = serverData.rolePermissions.some(role => memberRoles.has(role.roleID) && role.permissions.serverLogPerms == true);
            if (!isAdmin && !roleWithPerms) {
              return interaction.reply({ content: `${alert} You don't have permission to use \`/logs list\`.`, ephemeral: true });
            }

            const embed1 = new EmbedBuilder()
              .setColor("Yellow")
              .setTitle(`${reason} | Logs List`)
              .setDescription(`${reply} Fetching Guild Info ${load}`)

            const sentMessage = await interaction.reply({ embeds: [embed1] });

            const embed2 = new EmbedBuilder()
              .setColor("Random")
              .setTitle(`${interaction.guild.name}'s Log Channels`)
              .setDescription(`${getList(serverData)}`)
              .setThumbnail(interaction.guild.iconURL({ dynamic: false }))

            return await sentMessage.edit({ embeds: [embed2] });
          } else if (interaction.options.getSubcommand() === "clear") {
            if (mongoose.connection.readyState !== 1) {
              return await interaction.reply({ content: `${alert} The database is not connected, please wait 5 seconds!`, ephemeral: true });
            }
            let serverData = await serverDB.findOne({ serverID: interaction.guild.id });
            if (!serverData) {
              return await interaction.reply({ content: `${alert} This server has no saved data.`, ephemeral: true });
            }

            const memberRoles = interaction.member.roles.cache;
            const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
            const roleWithPerms = serverData.rolePermissions.some(role => memberRoles.has(role.roleID) && role.permissions.serverLogPerms == true);
                    if (!isAdmin && !roleWithPerms) {
                        return interaction.reply({ content: `${alert} You don't have permission to use \`/logs clear\`.`, ephemeral: true });
                    }

            const embed1 = new EmbedBuilder()
              .setColor("Yellow")
              .setTitle(`${reason} | Logs Clear`)
              .setDescription(`${reply} Fetching Guild Info ${load}`)
              .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

            const sentMessage = await interaction.reply({ embeds: [embed1] });

            serverData = await serverDB.findOneAndUpdate(
              { serverID: interaction.guild.id },
              { $set: {
                logs: {
                  bans: {
                    channelID: "0"
                  },
                  unbans: {
                    channelID: "0"
                  },
                  kicks: {
                    channelID: "0"
                  },
                  invites: {
                    channelID: "0"
                  },
                  joinsAndLeaves: {
                    channelID: "0"
                  },
                  deaths: {
                    channelID: "0"
                  },
                  chatRelay: {
                    channelID: "0"
                  },
                  autoMod: {
                    channelID: "0"
                  },
                  cmdExecution: {
                    channelID: "0"
                  }
                }
              } },
              { new: true }
            );

            await serverData.save();
            const embed2 = new EmbedBuilder()
              .setColor("#00FF00")
              .setTitle(`${reason} | Logs Cleared`)
              .setDescription(`${reply} All logs have been cleared for this server ${greencheck}`)
              .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

            return await sentMessage.edit({ embeds: [embed2] });
          }
        } catch (error) {
          console.log(error);
        }
      }
}

function getList(serverData) {
  let line = serverData.logs.bans.channelID === "0" ? "**Realm Bans:** \`Not Set.\`" : `**Realm Bans:** <#${serverData.logs.bans.channelID}>`;
  line += "\n";
  line += serverData.logs.unbans.channelID === "0" ? "**Realm Unbans:** \`Not Set.\`" : `**Realm Unbans:** <#${serverData.logs.unbans.channelID}>`;
  line += "\n";
  line += serverData.logs.kicks.channelID === "0" ? "**Realm Kicks:** \`Not Set.\`" : `**Realm Kicks:** <#${serverData.logs.kicks.channelID}>`;
  line += "\n";
  line += serverData.logs.invites.channelID === "0" ? "**Realm Invites:** \`Not Set.\`" : `**Realm Invites:** <#${serverData.logs.invites.channelID}>`;
  line += "\n";
  line += serverData.logs.joinsAndLeaves.channelID === "0" ? "**Player Join/Leave:** \`Not Set.\`" : `**Player Join/Leave:** <#${serverData.logs.joinsAndLeaves.channelID}>`;
  line += "\n";
  line += serverData.logs.deaths.channelID === "0" ? "**Player Deaths:** \`Not Set.\`" : `**Player Deaths:** <#${serverData.logs.deaths.channelID}>`;
  line += "\n";
  line += serverData.logs.chatRelay.channelID === "0" ? "**Chat Relay:** \`Not Set.\`" : `**Chat Relay:** <#${serverData.logs.chatRelay.channelID}>`;
  line += "\n";
  line += serverData.logs.autoMod.channelID === "0" ? "**Auto Mod:** \`Not Set.\`" : `**Auto Mod:** <#${serverData.logs.autoMod.channelID}>`;
  line += "\n";
  line += serverData.logs.cmdExecution.channelID === "0" ? "**Command Execution:** \`Not Set.\`" : `**Command Execution:** <#${serverData.logs.cmdExecution.channelID}>`;
  return line;
}