var e = module.exports = {};
var bu;

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `usernick`;
e.args = `[user] [quiet]`;
e.usage = `{usernick[;user[;quiet]]}`;
e.desc = `Returns the user's nickname. If it doesn't exist, returns their username instead. If
                                <code>name</code>
                                is specified, gets that user instead. If <code>quiet</code> is
                                specified, if a user can't be found it will simply return the <code>name</code>
                            `;
e.exampleIn = `Your nick is {usernick}`;
e.exampleOut = `Your nick is cat`;


e.execute = (msg, args, fallback) => {
    var replaceString = '';
    var replaceContent = false;

    var obtainedUser = bu.getUser(msg, args);

    if (obtainedUser) {
        replaceString = msg.channel.guild.members.get(obtainedUser.id) && msg.channel.guild.members.get(obtainedUser.id).nick
            ? msg.channel.guild.members.get(obtainedUser.id).nick
            : obtainedUser.username;
    } else if (!args[2])
        return '';
    else
        replaceString = args[1];

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};