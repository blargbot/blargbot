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
e.name = `guildownerid`;
e.args = ``;
e.usage = `{guildownerid}`;
e.desc = `Returns the id of the guild's owner`;
e.exampleIn = `The owner's id is {guildownerid}`;
e.exampleOut = `The owner's id is 1234567890123456`;


e.execute = (msg, args, fallback) => {
    var replaceString = msg.channel.guild.ownerID;
    var replaceContent = false;


    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};