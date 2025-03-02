const fs = require('fs');
const path = require('path');
const prefix = '!';
const allowedUserIds = new Set([
  '907712767644020787', // NoVa Gh0ul
 '1103502962032132126', // Shadow
  '1010616280547594240', // Optic SpiderAnt
  '752391218713067629', // Sealeopard
  '891294327437930517' // Determinated
]) // only these  users may use prefix commands, do not add anyone else to this without checking with these users first

module.exports = {
  name: 'messageCreate',
  execute(message) {
    if (!message.content.startsWith(prefix) || message.author.bot || !allowedUserIds.has(message.author.id)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const commandPath = path.join(__dirname, '..', 'prefix-commands', `${commandName}.js`);
    if (!fs.existsSync(commandPath)) return;

    const command = require(commandPath);
    try {
      command.run(message, args);
    } catch (error) {
      console.error(error);
      message.reply('There was an error trying to execute that command!');
    }
  }
};
