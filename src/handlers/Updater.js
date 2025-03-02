const playerDB = require("../models/playerDB");
const { MAGENTA, RED, WHITE, GREEN, YELLOW } = require("../utility/colors");

async function Updater() {
    const players = await playerDB.find();
    let SubClients = [];
    for (const player of players) {
        if (player.Gamertag.length > 30) {
            SubClients.push(
                {
                    Gamertag: "GAMERTAG LONGER THAN 50 CHAR, REDACTED",
                    UUID: player.UUID,
                    CurrentDevice: player.CurrentDevice,
                    RecentDevices: player.RecentDevices,
                    FoundOnRealms: player.Realms,
                    LastSeen: player.LastSeen
                }
            );
            console.log(`[${RED}WARNING${WHITE}]  >>>  Sub Client Found! Pushed to array.`)
        } else {
            player.WarnCount = 0;
            player.KickCount = 0;
            player.FlaggedAccount = false;
            player.save();
            console.log(`[${MAGENTA}PLAYER MANAGER${WHITE}]  >>>  Updated ${player.Gamertag}'s Model Successfully!`);
        }
    }
    console.log(`[${MAGENTA}PLAYER MANAGER${WHITE}]  >>>  ${GREEN}Updated All Models Successfully!${WHITE}\nPlayer Model Count: ${YELLOW}${players.length}${WHITE}\nSub Clients Found: ${YELLOW}${SubClients.length}${WHITE}`);
    console.log(`\n\n[${YELLOW}CLIENT${WHITE}]  >>>  ${GREEN}Temporary Cooldown for 3 seconds. . .${WHITE}`)
    setTimeout(() => {
        console.log(`[${MAGENTA}PLAYER MANAGER${WHITE}]  >>>  ${YELLOW}Sub Client List:${WHITE}\n`, SubClients);
    }, 4000);
}

module.exports = {
    Updater
}