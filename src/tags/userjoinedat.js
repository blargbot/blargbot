/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:20:29
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:20:29
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = 'userjoinedat';
e.args = '[format] [user] [quiet]';
e.usage = '{userjoinedat[;format[;user[;quiet]]]}';
e.desc = 'Returns the date the user joined the current guild, in UTC+0. '+
'If a `format` code is specified, the date is formatted accordingly. '+
'Leave blank for default formatting. '+
'See the <a href=\'http://momentjs.com/docs/#/displaying/format/\'>moment documentation</a> for more information. '+
'If `name` is specified, gets that user instead. '+
'If `quiet` is specified, if a user can\'t be found it will simply return the `name`';
e.exampleIn = 'Your account joined this guild on {userjoinedat;YYYY/MM/DD HH:mm:ss}';
e.exampleOut = 'Your account joined this guild on 2016/01/01 01:00:00';


e.execute = async function (params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        msg = params.msg;
    var replaceString = '';
    var replaceContent = false;

    var obtainedUser = await bu.getTagUser(msg, args, 2);

    if (obtainedUser) {
        let member = msg.channel.guild.members.get(obtainedUser.id);
        if (member) {
            var createdDate = member.joinedAt;
            var formatCode = '';
            if (args[1])
                formatCode = args[1];

            replaceString = dep.moment(createdDate).format(formatCode);
        } else {
            replaceString = await bu.tagProcessError(params, '`User not part of guild`');
        }
    } else if (!args[3])
        return '';
    else
        replaceString = args[2];

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};