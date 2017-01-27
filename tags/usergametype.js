var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `usergametype`;
e.args = `[user] [quiet]`;
e.usage = `{usergametype[;user[;quiet]]}`;
e.desc = `Returns how the user is playing the game (playing, streaming). If <code>name</code> is
specified, gets that user instead. If <code>quiet</code> is
specified, if a user can't be found it will simply return the <code>name</code>`;
e.exampleIn = `You're {usergametype} right now!`;
e.exampleOut = `You're playing right now!`;


e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        msg = params.msg;
    var replaceString = '';
    var replaceContent = false;

    var obtainedUser = await bu.getTagUser(msg, args);

    if (obtainedUser)
        replaceString = obtainedUser.game ? (obtainedUser.game.type > 0 ? 'streaming' : 'playing') : '';

    else if (!args[2])
        return '';
    else
        replaceString = args[1];

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};