var e = module.exports = {};
var bu = require('./../util.js');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'invite';
e.info = 'Gets you invite information.';
e.alias = ['join'];
e.category = bu.CommandType.GENERAL;

e.execute = (msg, words, text) => {
    console.log('wut');
    bu.sendMessageToDiscord(msg.channel.id, "Invite me to your discord!\nhttps://discordapp.com/oauth2/authorize?client_id=170237838334492682&scope=bot\n"
        + "Join my discord!\nhttps://discord.gg/015GVxZxI8rtlJgXF");
};