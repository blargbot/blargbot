var e = module.exports = {};
var bu;

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.CommandType.GENERAL;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
    e.usage = 'invite';
    e.info = 'Gets you invite information.';
    e.longinfo = `<p>Gives you the bot's invite information.</p>`;
    e.alias = ['join'];

e.execute = (msg) => {
    bu.sendMessageToDiscord(msg.channel.id, 'Invite me to your guild!\n'
        + 'https://discordapp.com/oauth2/authorize?client_id=170237838334492682&scope=bot&permissions=268495894\n'
        + 'Don\'t need the moderation functions? Use this link instead:\n'
        + 'https://discordapp.com/oauth2/authorize?client_id=170237838334492682&scope=bot\n'
        + 'Join my guild!\nhttps://discord.gg/015GVxZxI8rtlJgXF');
};