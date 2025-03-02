const axios = require("axios");
const serverDB = require("../models/serverDB");
const { Titles } = require("prismarine-auth");
const { MAGENTA, YELLOW, CYAN, WHITE } = require("../utility/colors");

async function RefreshHandler() {
    return new Promise(async (resolve, reject) => {
        const servers = await serverDB.find();
        try {
            for (const server of servers) {
                if (server.hasLinked === true) {
                    const commonHeaders = {
                        Accept: "*/*",
                        charset: "utf-8",
                        "content-type": "application/json",
                        "user-agent": "WindowsStoreSDK",
                        "Accept-Language": "en-GB",
                        Connection: "Keep-Alive"
                    }
                
                    const requestData = {
                        scope: "service::user.auth.xboxlive.com::MBI_SSL",
                        client_id: Titles.MinecraftNintendoSwitch,
                        grant_type: "refresh_token",
                        refresh_token: server.linkData.refreshToken
                    }
                
                    const response = await axios.post(`https://login.live.com/oauth20_token.srf`, requestData, { headers: { ...commonHeaders, "content-type": "application/x-www-form-urlencoded", Host: "login.live.com" } });
                
                    const result = await response.data;
                
                    if (result) {
                        const AccessToken = response.data.access_token;
                        const RefreshToken = response.data.refresh_token;
                        const CurrentDate = new Date();
                        const FormatedDate = CurrentDate.toISOString();
                
                        server.linkData.accessToken = AccessToken;
                        server.linkData.refreshToken = RefreshToken;
                        server.linkData.obtainedOn = FormatedDate;
                        await server.save();
                        console.log(`${MAGENTA}${FormatedDate} ${YELLOW}| ${CYAN}Refreshed Access Token For ${YELLOW}${server.serverID}${WHITE}`)
                        resolve();
                    }
                }
            }
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    RefreshHandler
}