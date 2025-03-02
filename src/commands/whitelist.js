const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require("discord.js");
const { load, reply, redcross, greencheck, removed, settings, reason } = require("../utility/emojis");
const serverDB = require("../models/serverDB");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("whitelist")
        .setDescription("Whitelist commands for Realms+")
        .addSubcommand(subcommand =>
            subcommand
                .setName("set")
                .setDescription("Add / Remove a user from the whitelist.")
                .addStringOption(option =>
                    option
                        .setName("toggle")
                        .setDescription("Select Add or Remove.")
                        .addChoices(
                            { name: "Add", value: "add" },
                            { name: "Remove", value: "remove" }
                        )
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName("gamertag")
                        .setDescription("The gamertag of the user.")
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName("list")
                .setDescription("List all whitelisted users.")),

    async execute(interaction) {
        if (interaction.options.getSubcommand() === "set") {
            try {
                const toggle = interaction.options.getString("toggle");
                const gamertag = interaction.options.getString("gamertag");

                const initialEmbed = new EmbedBuilder()
                    .setColor("Yellow")
                    .setDescription(`**Whitelist**\n    ${reply} Fetching Guild Info ${load}`);

                await interaction.reply({ embeds: [initialEmbed] });

                let serverData = await serverDB.findOne({ serverID: interaction.guild.id });
                if (!serverData) {
                    return await interaction.editReply({ content: `${alert} This guild has no data, please run \`/link\`.` });
                }

                const memberRoles = interaction.member.roles.cache;
                const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
                const roleWithPerms = serverData.rolePermissions.some(role => memberRoles.has(role.roleID) && role.permissions.whitelistPerms == true);
                if (!isAdmin && !roleWithPerms) {
                    return interaction.editReply({ content: `${alert} You don't have permission to use \`/whitelist set\`.`, ephemeral: true });
                }

                if (toggle === "add") {
                    if (serverData.whitelistedUsers.includes(gamertag)) {
                        const existingEmbed = new EmbedBuilder()
                            .setColor("Red")
                            .setTitle(`${redcross} | Invalid Selection`)
                            .setDescription(`    ${reply} \`${gamertag}\` is already a whitelisted user.`);
                        await interaction.editReply({ embeds: [existingEmbed] });
                    } else {
                        serverData.whitelistedUsers.push(gamertag);
                        await serverData.save();
                        const savedEmbed = new EmbedBuilder()
                            .setColor("Green")
                            .setTitle(`User Whitelisted ${greencheck}`)
                            .setDescription(`${reply} \`${gamertag}\` has been whitelisted.\n${reply} **Whitelisted User Count:** \`${serverData.whitelistedUsers.length}\``)
                            .setFooter({
                                text: `NOTE: This user will bypass most automod checks now. Please make sure you only whitelist trusted users.`,
                                icon_url: process.env.ICON_URL
                            })
                        await interaction.editReply({ embeds: [savedEmbed] });
                    }
                } else if (toggle === "remove") {
                    const index = serverData.whitelistedUsers.indexOf(gamertag);
                    if (index === -1) {
                        const nullEmbed = new EmbedBuilder()
                            .setColor("Red")
                            .setTitle(`${redcross} | Invalid Selection`)
                            .setDescription(`    ${reply} \`${gamertag}\` is not a whitelisted user.`);
                        await interaction.editReply({ embeds: [nullEmbed] });
                    } else {
                        serverData.whitelistedUsers.splice(index, 1);
                        await serverData.save();
                        const removedEmbed = new EmbedBuilder()
                            .setColor("Green")
                            .setTitle(`User Unwhitelisted ${removed}`)
                            .setDescription(`    ${reply} \`${gamertag}\` has been removed from the whitelist.\n    ${reply} **Whitelisted User Count:** \`${serverData.whitelistedUsers.length}\``);
                        await interaction.editReply({ embeds: [removedEmbed] });
                    }
                }
            } catch (e) {
                console.log("Error in Whitelist Set Command:", e);
            }
        } else if (interaction.options.getSubcommand() === "list") {
            const serverData = await serverDB.findOne({ serverID: interaction.guild.id });
            if (!serverData) {
                return await interaction.reply({ content: `${alert} No server data found, please run </link:1219001806256869396>` });
            }

            const memberRoles = interaction.member.roles.cache;
            const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
            const roleWithPerms = serverData.rolePermissions.some(role => memberRoles.has(role.roleID) && role.permissions.whitelistPerms == true);
            if (!isAdmin && !roleWithPerms) {
                return interaction.reply({ content: `${alert} You don't have permission to use \`/whitelist list\`.`, ephemeral: true });
            }

            const embed1 = new EmbedBuilder()
                .setColor("Yellow")
                .setTitle(`${reason} | Whitelist List`)
                .setDescription(`${reply} Fetching Guild Info ${load}`)
                .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

            await interaction.reply({ embeds: [embed1] });

            if (serverData.whitelistedUsers.length === 0) {
                const failEmbed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle(`${redcross} | Error`)
                    .setDescription(`${reply} This server has no whitelisted users.`)
                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                await interaction.editReply({ embeds: [failEmbed] });
                return;
            }

            if (serverData.whitelistedUsers.length > 30) { // i really dont wanna do pages right now so i'll do it when someone reaches 30
                const endEmbed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle(`${redcross} | Size Error`)
                    .setDescription(`The whitelist for **${interaction.guild.name}** is too big to populate in this embed, please report this to support.`)
                    .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

                await interaction.editReply({ embeds: [endEmbed] });
                return;
            }

            const userList = getUserList(serverData.whitelistedUsers, 1, 30);

            const embed2 = new EmbedBuilder()
                .setColor("White")
                .setTitle(`${reason} | Whitelist for ${interaction.guild.name}`)
                .setDescription(`\n${userList}`)
                .setFooter({ text: process.env.FOOTER, iconURL: process.env.ICON_URL });

            await interaction.editReply({ embeds: [embed2] });
            return;
        }
    }
}
        
        function getUserList(whitelistedUsers, page, usersPerPage) {
            const startIdx = (page - 1) * usersPerPage;
            const endIdx = Math.min(startIdx + usersPerPage, whitelistedUsers.length);
            let userList = "";
        
            for (let i = startIdx; i < endIdx; i++) {
                userList += `${i + 1}. \`${whitelistedUsers[i]}\`\n`;
            }
            return userList;
        }
        