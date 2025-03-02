const { on, off, reply } = require("../utility/emojis.js");

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
        chatFilter,
        antiSpoof
    } = serverData;

    const moderateDevicesEmoji = Object.entries(moderateDevices).map(([key, value]) => {
        const emoji = value ? `${on}` : `${off}`;
        return `${reply} ${key}: ${emoji}`;
    }).join("\n");

    emojiString += `\`AutoBanFromDB:\` ${autoBanFromDB ? `${on}` : `${off}`}\n`;
    emojiString += `\`Discord Ban Module:\` ${discordBanModule ? `${on}` : `${off}`}\n`;
    emojiString += `\`Anti Alts:\` ${moderateAlts ? `${on}` : `${off}`}\n`;
    emojiString += `\`Skin Filter:\` ${moderateSkins ? `${on}` : `${off}`}\n`;
    emojiString += `\`Chat Filter:\` ${chatFilter ? `${on}` : `${off}`}\n`;
    emojiString += `\`Bot Mitigation:\` \`Coming Soon!\`\n`;
    //emojiString += `\`Anti Crash:\` \`Coming Soon!\`\n`;
    emojiString += `\`Device Filter:\`\n${moderateDevicesEmoji}\n`;
    emojiString += `\`Anti Movement Hacks:\` ${moderateMovement ? `${on}` : `${off}`}\n`;
    emojiString += `\`Anti Chat Spam:\` ${moderateChat ? `${on}` : `${off}`}\n`;
    emojiString += `\`Anti Spoof:\` ${antiSpoof ? `${on}` : `${off}`}\n`;

    return emojiString;
}

module.exports = {
    getModulesEmoji
};