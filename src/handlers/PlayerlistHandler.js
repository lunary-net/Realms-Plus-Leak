const { EmbedBuilder } = require("discord.js");
const { person, calander, redcross, greencheck, minecraft, reply, id } = require("../utility/emojis");
const axios = require("axios");

class Playerlist {
    constructor(guildId, guildName, selectedRealm, serverData, client) {
        this.GuildID = guildId;
        this.GuildName = guildName;
        this.SelectedRealm = selectedRealm;
        this.ServerData = serverData;
        /** @type {import("discord.js").Client<true>} */
        this.Client = client;
        this.send();
    }

    async requestData() {
        const response1 = await axios.post(
            "https://user.auth.xboxlive.com/user/authenticate",
            {
              Properties: {
                AuthMethod: "RPS",
                RpsTicket:
                  this.ServerData.linkData.accessToken,
                SiteName: "user.auth.xboxlive.com",
              },
              RelyingParty:
                "http://auth.xboxlive.com",
              TokenType: "JWT",
            }
          );
          // realm auth
          const response2 = await axios.post(
            "https://xsts.auth.xboxlive.com/xsts/authorize",
            {
              Properties: {
                SandboxId: "RETAIL",
                UserTokens: [response1.data.Token],
              },
              RelyingParty:
                "https://pocket.realms.minecraft.net/",
              TokenType: "JWT",
            }
          );
          // xbl auth for profile search
          const response3 = await axios.post('https://xsts.auth.xboxlive.com/xsts/authorize', {
                Properties: {
                    SandboxId: "RETAIL",
                    UserTokens: [response1.data.Token],
                },
                RelyingParty: "http://xboxlive.com",
                TokenType: "JWT",
          });
          const realm_token = response2.data.Token
          const realm_userhash = response2.data.DisplayClaims.xui[0].uhs
          // realms playerlist call 
          const response4 = await axios.get("https://pocket.realms.minecraft.net/activities/live/players", {
            headers: {
                "Accept": "*/*",
                "Authorization": `XBL3.0 x=${realm_userhash};${realm_token}`,
                "Cache-Control": "no-cache",
                "Charset": "utf-8",
                "Client-Version": process.env.CLIENT_VERSION,
                "User-Agent": "MCPE/UWP",
                "Accept-Language": "en-GB",
                "Accept-Encoding": "gzip, deflate, br",
                "Host": "pocket.realms.minecraft.net",
                "Content-Length": "0",
                "Connection": "Keep-Alive"
            },
          });
          const convertedID = parseInt(this.SelectedRealm.realmID); // gotta convert cuz i stored ID as string for sum reason
          const realm = response4.data.servers.find(realm => realm.id === convertedID);

          if (realm) {
            const players = realm.players;
            if (!players || players.length === 0) return `${redcross} \`No Players Online :(\``;
            let xuid_collection = [];
            for (const player of players) {
                const xuid = player.uuid;
                xuid_collection.push(xuid);
            }

            const user_ids = players.map(player => player.uuid);
                // xbox data call
            const xbox_hash = response3.data.DisplayClaims.xui[0].uhs
            const xbox_token = response3.data.Token
            const response5 = await axios.post(
                `https://profile.xboxlive.com/users/batch/profile/settings`,
                { userIds: xuid_collection, settings: ["Gamertag", "Gamerscore"] },
                {
                    headers: {
                        'Accept': '*/*', 
                        'Authorization': `XBL3.0 x=${xbox_hash};${xbox_token}`, 
                        'Content-Type': 'application/json; charset=utf-8', 
                        'x-xbl-contract-version': 3, 
                        'Accept-Encoding': 'gzip, deflate, br', 
                        'Host': 'profile.xboxlive.com', 
                        'Connection': 'Keep-Alive', 
                        'Cache-Control': 'no-cache',
                    }
                }
            )
            const listData = response5.data.profileUsers.map(profileUsers => profileUsers.settings);

            
            return await getList(listData);
        }
    }

    async send(serverData) {
        try {
            setInterval(async () => {
                const guild = this.Client.guilds.cache.get(this.ServerData.serverID);
                const channel = guild.channels.cache.get(this.ServerData.automations.playerlist.channelID);
                
                if (channel) {
                    const embed = new EmbedBuilder()
                        .setColor(`Aqua`)
                        .setTitle(`${minecraft} | Live Playerlist`)
                        .setDescription(`${reply} Players on \`${this.SelectedRealm.realmName}\`\n\n${await this.requestData()}`)

                    await channel.messages.fetch({ limit: 1 }).then(async (message) => {
                        if (message.author) {
                            if (message.author.id !== "1181103687360335933") {
                                await channel.send({ embeds: [embed] });
                            }
                        }

                        const previousMessage = message.first();
                        if (previousMessage) {
                            await previousMessage.edit({ embeds: [embed] });
                        } else {
                            await channel.send({ embeds: [embed] });
                        }
                    });
                }
            }, 15000);
        } catch (error) {
            console.log(error);
        }
    }
}

function getList(listData) {

    let line = listData.map((data) => {
        const gamertagObj = data.find(obj => obj.id === 'Gamertag');
        const gamerscoreObj = data.find(obj => obj.id === 'Gamerscore');

        if (gamertagObj && gamerscoreObj) {
            const gamertag = gamertagObj.value;
            const gamerscore = gamerscoreObj.value;
            return `${person} ${gamertag}\n  - ${id} *Gamerscore:* \`${gamerscore}\``;
        } else {
            return "N/A";
        }
    }).join("\n");

    return line;
}

module.exports = { Playerlist };