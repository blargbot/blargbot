/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:47:28
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:47:28
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.SIMPLE;
};

e.requireCtx = require;

e.isTag = true;
e.name = `guildownerid`;
e.args = ``;
e.usage = `{guildownerid}`;
e.desc = `Returns the id of the guild's owner`;
e.exampleIn = `The owner's id is {guildownerid}`;
e.exampleOut = `The owner's id is 1234567890123456`;


e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let msg = params.msg;
    var replaceString = msg.channel.guild.ownerID;
    var replaceContent = false;


    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};