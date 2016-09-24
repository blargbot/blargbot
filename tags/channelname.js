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
e.name = `channelname`;
e.args = ``;
e.usage = `{channelname}`;
e.desc = `Returns the name of the current channel`;
e.exampleIn = `This channel's name is #{channelname}`;
e.exampleOut = `This channel's name is #test-channel`;


e.execute = (msg, args, fallback) => {
    var replaceString = msg.channel.name;
    var replaceContent = false;


    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};