/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:51:30
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:51:30
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.SIMPLE;
};

e.requireCtx = require;

e.isTag = true;
e.name = `randuser`;
e.args = ``;
e.usage = `{randuser}`;
e.desc = `Returns the id of a random user on the current guild.`;
e.exampleIn = `{username;{randuser}} is a lovely person! {username;{randuser}} isn't as good.`;
e.exampleOut = `abalabahaha is a lovely person! stupid cat isn't as good.`;


e.execute = async function(params) {

    let msg = params.msg;
    var replaceString = msg.channel.guild.members.map(m => m)[bu.getRandomInt(0, msg.channel.guild.members.map(m => m).length - 1)].user.id;
    var replaceContent = false;


    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};