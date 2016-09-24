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
e.name = `channelpos`;
e.args = ``;
e.usage = `{channelpos}`;
e.desc = `Returns the position of the current channel`;
e.exampleIn = `This channel is in position {channelpos}`;
e.exampleOut = `This channel is in position 1`;


e.execute = (msg, args, fallback) => {
    var replaceString = msg.channel.position;
    var replaceContent = false;


    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};