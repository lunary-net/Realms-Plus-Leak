const axios = require("axios");

async function getTitleHistory(xuid, serverData) {
    return new Promise(async (resolve, reject) => {
        try {
            if (!xuid) return "SUB CLIENT DETECTED";

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
    
            const response3 = await axios.get(`https://titlehub.xboxlive.com:443/users/xuid(${(xuid)})/titles/titlehistory/decoration/achievement,image,scid`, {
                headers: {
                    "x-xbl-contract-version": 1,
                    "Accept": "application/json",
                    "Authorization": `XBL3.0 x=${xbox_hash};${xbox_token}`,
                    "accept-language": "en-US",
                    "Connection": 'Keep-Alive',
                    "Accept-Encoding": "gzip",
                    "User-Agent": "okhttp/4.9.1"
                }
            });
            const RecentGames = response3.data.titles.slice(0, 3);

            if (RecentGames.length <= 0) {
                return "None.";
            }
            resolve();
            return RecentGames;
        } catch (error) {   
            reject(error);
        }
    });
}

module.exports = {
    getTitleHistory
}