/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:20:02
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:20:02
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `usergametype`;
e.args = `[user] [quiet]`;
e.usage = `{usergametype[;user[;quiet]]}`;
e.desc = `Returns how the user is playing the game (playing, streaming). If `name` is
specified, gets that user instead. If `quiet` is
specified, if a user can't be found it will simply return the `name``;
e.exampleIn = `You're {usergametype} right now!`;
e.exampleOut = `You're playing right now!`;


e.execute = async function (params) {
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