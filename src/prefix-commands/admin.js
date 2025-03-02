require("dotenv").config();
const userDB = require("../models/userDB");
module.exports = {
  name: 'admin',
  description: 'Grant Realms+ admin role to a user.',
  run(message, args) {
    if (!args.length)
      return message.reply(
        `

Syntax: !admin <user-id>.`
      );
    const userId = args.join(' ').trim();
    message.client.users.fetch(userId)
      .then(async (user) => {
        let userData = await userDB.findOne({ userID: user.id });
        if (!userData) {
          userData = await userDB.create({
            userID: user.id,
            // other fields...
          });
          await userData.save();
        }
        if (userData.isAdmin)
          return message.reply(`This user is already an admin!`);
        if (
          message.author.id !== '1103502962032132126' &&
          message.author.id !== '907712767644020787'
        )
          return message.reply(`<:error:1179864735945068736> You are not authorized to use this command.`);
        await userDB.findOneAndUpdate(
          { userID: user.id },
          { $set: { isAdmin: true } }
        );
        message.reply(
          `<a:checkmark:1183776368249536645> Successfully made <@${user.id}> an admin for Realms+!`
        );
      })
      .catch(() => {
        message.reply(
          `<:error:1179864735945068736> **IdError:** User not found!`
        );
      });
  },
};