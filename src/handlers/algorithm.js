const serverDB = require("../models/serverDB.js");
const playerDB = require("../models/playerDB.js");
const axios = require("axios");

/* 
USAGE:
        new Algorithm(playerData);
            .scanType("playerDB");

        - playerData is REQUIRED, serverData is OPTIONAL
*/

class Algorithm {
    constructor(serverData, playerData) {
        /*

        playerData should be an object like so:
        playerData = {
            gamertag: <gamertag_here>,
            gamerscore: <gamerscore_here>,
            xuid: <xuid_here>,
            accountSettings: <account_settings_here>, // takes in account settings
            titleHistory: [ // most recent 3 or 4 titles
                <title_history_here>
            ],
            achievementHistory: [ // most recent 3 or 4 achievements
                <achievement_history_here>
            ],
            clubData: { // object of clubData here, should contain join data, presence, etc.
                <club_data_here>
            },
            playerModel: <model_here> // should be their playerDB model if found
            packetData: { // OPTIONAL, but takes in player_list and add_player packets.
                playerList: <player_list_packet_here>,
                addPlayer: <add_player_packet_here>
            }
        }
        */
        this.ServerData = serverData;
        this.PlayerData = playerData;
    }

    scanType(type) {
        if (type === "playerDB") {
            this.Scan();
        }
    }

    async Scan() {
        const players = await playerDB.find();

        for (const player of players) {
            console.log(player);
        }
    }
}

module.exports = { Algorithm };