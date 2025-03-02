const { Events, ActivityType, REST, Routes } = require("discord.js");
const { DefaultWebSocketManagerOptions: { identifyProperties } } = require("@discordjs/ws");
const mongoose = require("mongoose");
const hackerDB = require("../models/hackerDB");
const discordDB = require("../models/discordDB");
const statsDB = require("../models/statsDB");
const { RefreshHandler } = require("../handlers/refreshHandler");
const { autoConnectHandler } = require("../handlers/autoConnectHandler");
const clientId = process.env.CLIENTID;
const token = process.env.TOKEN;
const fs = require("node:fs");
require("dotenv").config();
identifyProperties.browser = "Discord Android";
const { RED, WHITE, GREEN, BLUE, YELLOW } = require("../utility/colors");
const { Updater } = require("../handlers/Updater");

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {

    const logSystemInfo = () => {
    const used = process.memoryUsage();
    const memory = {
      rss: (used.rss / 1024 / 1024).toFixed(2),
      heapTotal: (used.heapTotal / 1024 / 1024).toFixed(2),
      heapUsed: (used.heapUsed / 1024 / 1024).toFixed(2),
      external: (used.external / 1024 / 1024).toFixed(2)
    };
    console.log(YELLOW + `[SYSTEM]` + WHITE + `  >>>  CPU: ${(process.cpuUsage().system / 1000000).toFixed(2)}%`);
    console.log(YELLOW + `[SYSTEM]` + WHITE + `  >>>  RAM: ${memory.heapUsed}/${memory.heapTotal}MB`);
    };

    await mongoose.connect(process.env.MONGO_URI || "", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log(GREEN + `[MONGO]` + WHITE + `  >>>  Connected to the MongoDB database!`);

      logSystemInfo();
    })
    .catch((err) => {
      console.error(RED + `[ERROR]` + WHITE + `  >>>  Could not connect to the MongoDB database. Error:`, err);
    });

    const data = await statsDB.findOne({ query: "global" });

    const activities = [
      { name: `${client.guilds.cache.size} servers!`, type: ActivityType.Watching },
      { name: "#ARASR", type: ActivityType.Watching },
      { name: "hackers in your realm", type: ActivityType.Watching },
      { name: "Minecraft :D", type: ActivityType.Playing },
      { name: "Best MCBE Database", type: ActivityType.Listening },
      { name: `${data.globalKicks} Kicked Players`, type: ActivityType.Listening },
      { name: `${data.playersProcessed} Processed Players`, type: ActivityType.Listening }
    ];
    const updateDelay = 40;
    let currentIndex = 0;

    setInterval(() => {
      const { name, type } = activities[currentIndex];
      client.user.setPresence({
        activities: [{ name, type }],
        status: "idle"
      });
      currentIndex = (currentIndex + 1) % activities.length;
    }, updateDelay * 1000);

    await hackerDB.countDocuments({})
    .then((count) => {
      discordDB.countDocuments({})
      .then((count_discord) => {
        console.log(WHITE + `\n\nRealms+ Successfully Started.\n\nRealms+ Stats:\n→ Tag: ${client.user.tag}\n→ ID: ${client.user.id}\n→ Server Count: ${client.guilds.cache.size}\n→ Hacker Database Count: ${count}\n→ Discord Database Count: ${count_discord}\n→ GLobal Kicks: ${data.globalKicks}\n→ GLobal Text Relayed (Normal): ${data.normalTextRelayed}\n→ Global Text Relayed (Tellraw): ${data.jsonTextRelayed}\n→ Linked Accounts: ${data.linkedAccounts}\n→ Configed Realms: ${data.configedRealms}\n→ Players Processed: ${data.playersProcessed}`);
      })
      .catch((error) => {
        console.error(RED + `[ERROR]` + WHITE + `  >>>  Error while counting documents in discordDB:`, error);
      });
    })
    .catch((error) => {
      console.error(RED + `[ERROR]` + WHITE + `  >>>  Error while counting documents in hackerDB:`, error);
    });

    // Refresh Application Commands
    const commands = [];
    const commandFiles = fs.readdirSync("./src/commands").filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
      const command = require(`../commands/${file}`);
      if (command.data && typeof command.data.toJSON === "function") {
        commands.push(command.data.toJSON());
      } else {
        console.error(RED + `[ERROR]` + WHITE + `  >>>  Invalid data structure in command file:` + YELLOW + `${file}` + WHITE);
      }
    }

    const rest = new REST({ version: "10" }).setToken(token);
    (async () => {
      try {
        console.log(YELLOW + `[CLIENT]` + WHITE + `  >>>  Started refreshing ${commands.length} application (/) commands.`);
        const data = await rest.put(Routes.applicationCommands(clientId), {
          body: commands,
        });
        console.log(GREEN + `[CLIENT]` + WHITE + `  >>>  Successfully reloaded ${data.length} application (/) commands.`);
      } catch (error) {
        console.error(RED + `[ERROR]` + WHITE + `  >>>  Error occurred during the refreshing/registration of application commands:`, error);
      }
    })();
    
    RefreshHandler();

    /*
    setTimeout(() => {
      console.log(`[${YELLOW}CLIENT${WHITE}]  >>>  Updating Player Models in ${GREEN}3 seconds${WHITE}...`);
      setTimeout(() => {
        Updater();
      }, 5000);
    }, 3000);
    */
   /*
    setTimeout(() => {
      autoConnectHandler();
    }, 4000); // wait 4 seconds for now
    */
  },
};
