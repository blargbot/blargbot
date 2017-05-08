/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:42:23
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:42:23
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `guildcreatedat`;
e.args = `[format]`;
e.usage = `{guildcreatedat}`;
e.desc = `Returns the date the current guild was created, in UTC+0. If a <code>format</code> code is specified, the date is
formatted accordingly. Leave blank for default formatting. See the <a href="http://momentjs.com/docs/#/displaying/format/">moment
documentation</a> for more information.`;
e.exampleIn = `This guild was created on {guildcreatedat;YYYY/MM/DD HH:mm:ss}`;
e.exampleOut = `This guild was created on 2016/01/01 01:00:00`;

e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        msg = params.msg;
    var replaceString = '';
    var replaceContent = false;
    var createdDate = msg.channel.guild.createdAt;
    var formatCode = '';
    if (args[1])
        formatCode = args[1];

    replaceString = dep.moment(createdDate).format(formatCode);

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};