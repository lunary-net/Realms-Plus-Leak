// this file is to delete slash commands globally, makes for cleaner and easier command refresh / registration 

const { SlashCommandBuilder } = require('@discordjs/builders'); const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const token = process.env.TOKEN;
const clientId = process.env.CLIENTID;

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    const commands = await rest.get(Routes.applicationCommands(clientId));
    console.log(`Successfully retrieved ${commands.length} application (/) commands.`);
    
    const deletePromises = commands.map(command => {
      console.log(`Deleting command ${command.id}: ${command.name}`);
      return rest.delete(Routes.applicationCommand(clientId, command.id));
    });

    await Promise.all(deletePromises);
    
    console.log('Successfully deleted all application (/) commands.');
  } catch (error) {
    console.error('Error during deletion of application (/) commands:', error);
  }
})();
