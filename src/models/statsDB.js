const mongoose = require("mongoose");

const statsSchema = new mongoose.Schema({
    query: { type: String, default: "global" },
    globalKicks: { type: Number, default: 0 },
    normalTextRelayed: { type: Number, default: 0 },
    jsonTextRelayed: { type: Number, default: 0 }, // gamtest
    linkedAccounts: { type: Number, default: 0 },
    configedRealms: { type: Number, default: 0 },
    playersProcessed: { type: Number, default: 0 },
});

module.exports = mongoose.model("statsDB", statsSchema)