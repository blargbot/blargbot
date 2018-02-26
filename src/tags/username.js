/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:20:42
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:20:42
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `username`;
e.args = `[user] [quiet]`;
e.usage = `{username[;user[;quiet]]}`;
e.desc = `Returns the user's name. If `name` is specified, gets that user instead. If
`quiet` is specified, if a user can't be found it will simply return the `name``;
e.exampleIn = `Your username is {username;stupid;this can be anything}`;
e.exampleOut = `Your username is stupid cat`;

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
        replaceString = obtainedUser.username;
    else {
        if (!args[2])
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