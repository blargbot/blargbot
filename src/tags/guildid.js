/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:47:09
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:47:09
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.SIMPLE;
};

e.requireCtx = require;

e.isTag = true;
e.name = `guildid`;
e.args = ``;
e.usage = `{guildid}`;
e.desc = `Returns the id of the current guild`;
e.exampleIn = `This guild's id is {guildid}`;
e.exampleOut = `This guild's id is 1234567890123456`;

e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let msg = params.msg;
    var replaceString = msg.channel.guild.id;
    var replaceContent = false;


    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};