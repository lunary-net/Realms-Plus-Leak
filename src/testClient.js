const bedrock = require("bedrock-protocol");
const { EmbedBuilder } = require("discord.js");

class TestClient {
  constructor(
    realmId,
    realmName,
    selectedRealm,
    client,
    guildId,
    guildName,
    serverData,
    value
  ) {
    this.RealmID = realmId;
    this.RealmName = realmName;
    this.SelectedRealm = selectedRealm; // this is so we can access settings object for this realm
    this.DiscordBot = client;
    this.GuildID = guildId;
    this.GuildName = guildName;
    this.ServerData = serverData;
    this.RealmClient = null;
    this.ClientStatus = null;
    // for movement moderation
    this.ClientData = {
      previousPosition: null,
      previousTimestamp: null,
    };
    this.startup(value);
  }

  async startup(value) {
    switch (value) {
      case true:
        this.RealmClient = await this.connect();
        this.moderate();
    }
  }

  async connect() {
    return new Promise((resolve, reject) => {
      try {
        const bot = bedrock.createClient({
          username: "ARASR8261",
          connectTimeout: 10000,
          skipPing: true,
          offline: false,
          realms: {
            realmId: this.RealmID,
          },
        });
        resolve(bot);
      } catch (error) {
        console.log(error);
      }
    });
  }

  async moderate() {
    this.RealmClient.on("play_status", async (packet) => {
      console.log(packet);
      if (packet.status === "player_spawn") {
        console.log(`Connected to ${this.RealmName}!`);
        const guild = this.DiscordBot.guilds.cache.get(this.GuildID);
        const RelayChannel = guild.channels.cache.get(
          this.ServerData.logs.chatRelay.channelID
        );
        if (RelayChannel) {
          const embed = new EmbedBuilder()
            .setColor("#08F704")
            .setAuthor({ name: "Connection", iconURL: process.env.ICON_URL })
            .setDescription(`test connection successful !`);

          await RelayChannel.send({ embeds: [embed] });
        }
      }
    });

    this.RealmClient.on("connect", async (packet) => {
      console.log(`Connection Packet:`, packet);
    });

    this.RealmClient.on("join", async (packet) => {
      console.log(`Join Packet:`, packet);
    });

    this.RealmClient.on("add_player", async (packet) => {
      console.log(`Add Player Packet:`, packet);
    });

    this.RealmClient.on("player_list", async (packet) => {
      console.log(`Player List Packet:`, packet);
    });

    // Normal Chat

    const Messages = [];

    setInterval(() => {
      const messageCounts = {};

      // Count messages per player using XUID
      Messages.forEach((message) => {
        if (!messageCounts[message.xuid]) {
          messageCounts[message.xuid] = 0;
        }
        messageCounts[message.xuid]++;
      });

      // Check for spam
      const spamThreshold = 5; // Example threshold for spam detection
      for (const [xuid, count] of Object.entries(messageCounts)) {
        if (count > spamThreshold) {
          this.RealmClient.write("command_request", {
            command: `/kick ${xuid} §cNO SPAM`,
            origin: {
              type: 0,
              uuid: "",
              request_id: "",
            },
            internal: false,
            version: 66,
          });
          console.log(`Kicked ${xuid} for being a spam bot.`);
        }
      }

      // Reset the array
      Messages.length = 0;
    }, 1800);

    const SleepSpam = [];

    setInterval(() => {
      SleepSpam.length = 0;
    }, 1800);

    this.RealmClient.on("text", async (packet) => {
      if (packet.type === 'translation') {
        if (packet.message.includes("chat.type.sleeping")) {
          SleepSpam.push({
            username: packet.source_name,
            xuid: packet.xuid,
            message: packet.message,
          });
          if (SleepSpam.length > 4) {
            this.RealmClient.write("command_request", {
              command: `/kick "${packet.parameters[0]}" §cSLEEP SPAM`,
              origin: {
                type: 0,
                uuid: "",
                request_id: "",
              },
              internal: false,
              version: 66,
            });
            SleepSpam.length = 0;
          }
        }
      }
      Messages.push({
        username: packet.source_name,
        xuid: packet.xuid,
        message: packet.message,
      });
    });

    this.RealmClient.on("animate", async (packet) => {
      console.log(`Animate Packet:`, packet);
    })

    this.RealmClient.on("respawn", async (packet) => {
      console.log(`Respawn Packet:`, packet);
    });

    this.RealmClient.on("container_open", async (packet) => {
      console.log(`Container Open Packet:`, packet);
    });

    this.RealmClient.on("container_close", async (packet) => {
      console.log(`Container Close Packet:`, packet);
    });

    this.RealmClient.on("inventory_content", async (packet) => {
      console.log(`Inventory Content Packet:`, packet);
    })

    this.RealmClient.on("container_set_data", async (packet) => {
      console.log(`Container Set Data Packet:`, packet);
    })

    this.RealmClient.on("event", async (packet) => {
      console.log(`Event Packet:`, packet);
    });

    this.RealmClient.on("spawn_experience_orb", async (packet) => {
      console.log(`Spawn Experience Orb Packet:`, packet);
    });

    this.RealmClient.on("map_item_data", async (packet) => {
      console.log(`Map Item Data Packet:`, packet);
    });

    this.RealmClient.on("command_output", async (packet) => {
      console.log(`Command Output Packet:`, packet);
    })

    this.RealmClient.on("update_trade", async (packet) => {
      console.log(`Update Trade Packet:`, packet);
    })

    this.RealmClient.on("update_equip", async (packet) => {
      console.log(`Update Equip Packet:`, packet);
    });

    this.RealmClient.on("emote", async (packet) => {
      console.log(`Emote Packet:`, packet);
    });

    this.RealmClient.on("player_skin", async (packet) => {
      console.log(`Player Skin Packet:`, packet);
    })

    this.RealmClient.on("player_action", async (packet) => {
      console.log(`Player Action Packet:`, packet);
    });

    this.RealmClient.on("player_list", async (packet) => {
      console.log(`Player List Packet:`, packet);
    })

    this.RealmClient.on("transfer", async (packet) => {
      console.log(`Transfer Packet:`, packet);
    });


    this.RealmClient.on("play_sound", async (packet) => {
      console.log(`Play Sound Packet:`, packet);
    })

    this.RealmClient.on("structure_block_update", async (packet) => {
      console.log(`Structure Block Update Packet:`, packet);
    })

    this.RealmClient.on("server_settings_response", async (packet) => {
      console.log(`Server Settings Response Packet:`, packet);
    })

    this.RealmClient.on("show_profile", async (packet) => {
      console.log(`Show Profile Packet:`, packet);
    })

    this.RealmClient.on("structure_template_data_request", async (packet) => {
      console.log(`Structure Template Data Request Packet:`, packet);
    })

    this.RealmClient.on("structure_template_data_response", )

    this.RealmClient.on("interact", async (packet) => {
      console.log(`Interact Packet:`, packet);
    });

    this.RealmClient.on("disconnect", (packet) => {
      console.log(`Disconnected from ${this.RealmName}...`, packet);
    });

    this.RealmClient.on("kick", (packet) => {
      console.log(`Kicked from ${this.RealmName}...`, packet);
    });

    this.RealmClient.on("close", (packet) => {
      console.log(`Closed connection from ${this.RealmName}...`, packet);
    });

    this.RealmClient.on("error", (packet) => {
      console.log(`Error from ${this.RealmName}...`, packet);
    });

    this.RealmClient.on("end", (packet) => {
      console.log(`Ended connection from ${this.RealmName}...`, packet);
    });
  }
}

module.exports = {
  TestClient,
};


