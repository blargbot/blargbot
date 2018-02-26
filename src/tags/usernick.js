/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:20:48
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:20:48
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = 'usernick';
e.args = '[user] [quiet]';
e.usage = '{usernick[;user[;quiet]]}';
e.desc = 'Returns the user\'s nickname. If it doesn\'t exist, returns their username instead. '+
'If `name` is specified, gets that user instead. '+
'If `quiet` is specified, if a user can\'t be found it will simply return the `name`';
e.exampleIn = 'Your nick is {usernick}';
e.exampleOut = 'Your nick is cat';

e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        msg = params.msg;
    var replaceString = '';
    var replaceContent = false;

    var obtainedUser = await bu.getTagUser(msg, args);

    if (obtainedUser) {
        replaceString = msg.channel.guild.members.get(obtainedUser.id) && msg.channel.guild.members.get(obtainedUser.id).nick ?
            msg.channel.guild.members.get(obtainedUser.id).nick :
            obtainedUser.username;
    } else if (!args[2])
        return '';
    else
        replaceString = args[1];

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};