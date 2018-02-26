/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:20:55
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:20:55
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = 'userstatus';
e.args = '[user] [quiet]';
e.usage = '{userstatus[;user[;quiet]]}';
e.desc = 'Returns the status of the specified user (`online`, `idle`, `dnd`, or `offline`). '+
'If `name` is specified, gets that user instead. '+
'If `quiet` is specified, if a user can\'t be found it will simply return the `name`';
e.exampleIn = 'Your are currently {userstatus}';
e.exampleOut = 'Your are currently online';

e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        msg = params.msg;

    var replaceString = '';
    var replaceContent = false;

    var obtainedUser = await bu.getTagUser(msg, args);

    if (obtainedUser && msg.channel.guild.members.get(obtainedUser.id)) {
        replaceString = msg.channel.guild.members.get(obtainedUser.id).status;
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