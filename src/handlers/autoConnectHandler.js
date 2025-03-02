const serverDB = require("../models/serverDB");
const { WHITE, CYAN, MAGENTA, YELLOW, BLUE, GREEN } = require("../utility/colors");
const { RealmsPlusClient } = require("../bedrockClient");
const { client } = require("../index");

async function autoConnectHandler() {

    console.log(`Attempting a connection to a server. . .`);
    const serverData = await serverDB.findOne({ serverID: "1181030912411058176" });

    const realmID = "19035613";
    const realmName = "Dev Realm";
    const selectedRealm = serverData.configedRealms.find(realm => realm.realmID === realmID);
    const guildId = serverData.serverID;
    const guildName = serverData.serverName;
    new RealmsPlusClient(realmID, realmName, selectedRealm, client, guildId, guildName, serverData, true);
}

module.exports = {
    autoConnectHandler
}