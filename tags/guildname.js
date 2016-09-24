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
e.name = `guildname`;
e.args = ``;
e.usage = `{guildname}`;
e.desc = `Returns the name of the current guild`;
e.exampleIn = `This guild's name is {guildname}`;
e.exampleOut = `This guild's name is TestGuild`;


e.execute = (msg, args, fallback) => {
    var replaceString = msg.channel.guild.name;
    var replaceContent = false;


    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};