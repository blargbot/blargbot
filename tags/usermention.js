var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.CCOMMAND;
};

e.requireCtx = require;

e.isTag = true;
e.name = `usermention`;
e.args = `[user] [quiet]`;
e.usage = `{usermention[;user[;quiet]]}`;
e.desc = `Mentions a user. If <code>name</code> is specified, gets that user instead. If
<code>quiet</code> is specified, if a user can't be found it will simply return the <code>name</code>`;
e.exampleIn = `Hello, {usermention}!`;
e.exampleOut = `Hello, @user!`;

e.execute = async function (params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        msg = params.msg;
    var replaceString = '';
    var replaceContent = false;

    if (!params.ccommand) {
        replaceString = await bu.tagProcessError(params, '`Can only use in CCommands`');
    } else {
        var obtainedUser = await bu.getTagUser(msg, args);
        if (obtainedUser)
            replaceString = obtainedUser.mention;
        else if (!args[2])
            return '';
        else
            replaceString = args[1];
    }

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};