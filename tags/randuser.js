var e = module.exports = {};
var bu;



var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

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
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};