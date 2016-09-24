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
e.name = `guilddefaultchannelid`;
e.args = ``;
e.usage = `{guilddefaultchannelid}`;
e.desc = `Returns the guild's default channel's id`;
e.exampleIn = `Default channel is {guilddefaultchannelid}`;
e.exampleOut = `Default channel is 1234567890123455`;


e.execute = (msg, args, fallback) => {
    var replaceString = msg.channel.guild.defaultChannel.id;
    var replaceContent = false;


    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};