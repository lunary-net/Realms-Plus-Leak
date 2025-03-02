const axios = require("axios");
const serverDB = require("../models/serverDB");

async function getUserInfo(serverData) {
    return new Promise(async (resolve, reject) => {
        try {
            const response1 = await axios.post(
                "https://user.auth.xboxlive.com/user/authenticate",
                {
                  Properties: {
                    AuthMethod: "RPS",
                    RpsTicket:
                      serverData.linkData.accessToken,
                    SiteName: "user.auth.xboxlive.com",
                  },
                  RelyingParty:
                    "http://auth.xboxlive.com",
                  TokenType: "JWT",
                }
              );
            const response2 = await axios.post('https://xsts.auth.xboxlive.com/xsts/authorize', {
                Properties: {
                    SandboxId: 'RETAIL',
                    UserTokens: [response1.data.Token],
                },
                RelyingParty: "http://xboxlive.com",
                TokenType: 'JWT',
            });
            const xbox_token = response2.data.Token;
            const xbox_hash = response2.data.DisplayClaims.xui[0].uhs;
            
            const XUID = serverData.linkData.userXUID;

            const response3 = await axios.get(`https://profile.xboxlive.com/users/xuid(${(XUID)})/profile/settings?settings=Gamertag`, {
                headers: {
                    "x-xbl-contract-version": "2",
                    "Authorization": `XBL3.0 x=${xbox_hash};${xbox_token}`,
                    "Accept-Language": "en-US",
                    "maxRedirects": 1,
                }
            });

            const xbox_data = response3.data.profileUsers;
            let Gamertag;
            if (xbox_data) {
                Gamertag = xbox_data[0].settings.find(obj => obj.id === 'Gamertag').value
            }

            resolve();
            return Gamertag;
        } catch (error) {
            reject(error);
            return false;
        }
    });
}

module.exports = {
    getUserInfo
}