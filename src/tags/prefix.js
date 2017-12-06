/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:51:00
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:51:00
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.SIMPLE;
};

e.requireCtx = require;

e.isTag = true;
e.name = `prefix`;
e.args = ``;
e.usage = `{prefix}`;
e.desc = `Gets the current guild's prefix.`;
e.exampleIn = `Your prefix is {prefix}`;
e.exampleOut = `Your prefix is b!`;

e.execute = async function (params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;

    let prefix = await bu.guildSettings.get(params.msg.channel.guild.id, 'prefix');
    replaceString = prefix || config.discord.defaultPrefix;
    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};