const mongoose = require('mongoose');
/*

playerSchema will be used under certain events to store player information

im thinkin about updating /lookup player as well to include two string options to either
lookup the player from Xbox Live or from our database


*/
const playerSchema = new mongoose.Schema({
    WarnCount: { type: Number, default: 0 },
    KickCount: { type: Number, default: 0 },
    FlaggedAccount: { type: Boolean, default: false },
    Gamertag: { type: String, required: false, default: "0" }, // gamertag, might change later to handle spoofing (maybe CurrentGamertag and if Gamertag !== CurrentGamertag flag the account)
    Gamerpic: { type: String, required: false, default: "0" },
    Gamemode: { type: String, required: false, default: null }, // current gamemode
    Permission: { type: String, required: false, default: null }, // permission level of the player cause why not
    UUID: { type: String, unique: true, required: true }, // xuid used to identify each player
    XUID: { type: String, required: false, default: "0" },
    CurrentDevice: { type: String, required: false, default: null }, // current device from add_player event
    DeviceIDS: { type: Array, default: [] },
    RecentDevices: { type: Array, default: [] }, // if Device !== CurrentDevice then we fill this, if it reaches 3 or 4+ we flag the account
    RealmsPlusID: { type: String, required: false }, // unique id (fingerprint) for each player
    Realms: { type: Array, default: [] }, // list of realms they've joined with Realms+ on it (could be helpful for catching mass bot accounts)
    DiscordTag: { type: String, required: false }, // if they own a realm + link their account we'll get this and ID
    DiscordID: { type: String, required: false }, // could also use dashboard to get these values
    LastSeen: { type: Date, default: Date.now() }, // last time the player was seen on a realm with realms+
});

const model = mongoose.model('playerDB', playerSchema);

module.exports = model;