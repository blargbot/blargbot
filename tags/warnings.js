var e = module.exports = {};


e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = 'warnings';
e.args = '[user]';
e.usage = '{warnings[;user]}';
e.desc = 'Gets the number of warnings a user has.';
e.exampleIn = 'You have {warnings} warning(s)!';
e.exampleOut = 'You have 0 warning(s)!';

e.execute = async function (params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    var replaceString = '';
    var replaceContent = false;
    let parsedFallback = parseInt(params.fallback);
    let user = params.msg.author;
    if (params.args[1]) {
        user = await bu.getUser(params.msg, params.args[1]);
    }
    if (!user) {
        replaceString = await bu.tagProcessError(params, '`No user found`');
    } else {
        let storedGuild = await bu.getGuild(params.msg.guild.id);
        let warnings = 0;
        if (storedGuild.warnings && storedGuild.warnings.users && storedGuild.warnings.users[user.id]) {
            warnings = storedGuild.warnings.users[user.id];
        }
        replaceString = warnings;
    }

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};