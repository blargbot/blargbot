var e = module.exports = {};

e.init = () => {
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
    bu.send(msg, 'Invite me to your guild!\n' +
        '<http://invite.blargbot.xyz/>\n' +
        'Don\'t need the moderation functions? Use this link instead:\n' +
        '<http://minvite.blargbot.xyz/>\n' +
        'Join my support guild!\nhttps://discord.gg/015GVxZxI8rtlJgXF');
};