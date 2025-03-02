// known bots schema
const mongoose = require("mongoose");

const botDB = new mongoose.Schema({
    Gamertag: { type: String },
    XUID: { type: String },
    UUID: { type: String },
    Realms: [
        { type: String }
    ],
    PlayerlistPacket: { type: String },
    AddPlayerPacket: { type: String }
});

const model = mongoose.model("botDB", botDB);

module.exports = model;