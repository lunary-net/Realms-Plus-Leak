const playerDB = require("../models/playerDB");
const { RED, WHITE, GREEN, MAGENTA } = require("../utility/colors");


class PlayerManager {
    constructor(UUID, Username, XUID, CurrentDevice, DeviceID) {
        this.UUID = UUID;
        this.Username = Username;
        this.XUID = XUID;
        this.CurrentDevice = CurrentDevice;
        this.DeviceID = DeviceID;
        this.PlayerSave();
    }

    async PlayerSave() {
        let playerData = await playerDB.findOne({ UUID: UUID });
        if (!playerData) {
            playerData = new playerDB({
                _id: new mongoose.Types.ObjectId(),
                Gamertag: this.Username,
                UUID: this.UUID,
                XUID: this.XUID,
                CurrentDevice: this.CurrentDevice,
                DeviceIDS: [...playerData.DeviceIDS, this.DeviceID],
                RecentDevices: [...playerData.RecentDevices, this.CurrentDevice],
                LastSeen: Date.now(),
            })
            await playerData.save();
            console.log(`${MAGENTA}[PLAYER MANAGER]${WHITE}  >>>  New Player Modal Saved: Username ${this.Username} | UUID: ${this.UUID}`)
        }
    }
}

async function PlayerLookup(UUID) {
    return new Promise(async (resolve, reject) => {
        try {
            let playerData = await playerDB.findOne({ UUID: UUID });
            if (!playerData) return resolve("[Error T1] | NOT FOUND");
            resolve(playerData);
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    PlayerManager,
    PlayerLookup
}