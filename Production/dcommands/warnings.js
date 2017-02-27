var e = module.exports = {};

e.init = () => {
    e.category = bu.CommandType.GENERAL;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'warnings [user]';
e.info = 'Gets how many warnings you or a specified user has.';
e.longinfo = `<p>Gets how many warnings you or a specified user has.</p>`;


e.execute = async function(msg, words) {
    let user = msg.author;
    if (words.length > 1) {
        user = await bu.getUser(msg, words.slice(1).join(' '));
    }
    if (!user) return;
    let storedGuild = await bu.getGuild(msg.guild.id);
    let message = '';
    let warnings = 0;
    if (storedGuild.warnings && storedGuild.warnings.users && storedGuild.warnings.users[user.id]) {
        warnings = storedGuild.warnings.users[user.id];
    }
    if (warnings != 0)
        message = `:warning: **${bu.getFullName(user)}** has accumulated ${warnings == 1 ? '1 warning' : warnings + ' warnings'}.`;
    else message = `:tada: **${bu.getFullName(user)}** doesn't have any warnings!`;
    if (storedGuild.settings.kickat && storedGuild.settings.kickat > 0) {
        message += `\n - ${storedGuild.settings.kickat - warnings} more warnings before being kicked.`;
    }
    if (storedGuild.settings.banat && storedGuild.settings.banat > 0) {
        message += `\n - ${storedGuild.settings.banat - warnings} more warnings before being banned.`;
    }
    bu.send(msg, message);
};