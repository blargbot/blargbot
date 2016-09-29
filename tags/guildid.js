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
e.name = `guildid`;
e.args = ``;
e.usage = `{guildid}`;
e.desc = `Returns the id of the current guild`;
e.exampleIn = `This guild's id is {guildid}`;
e.exampleOut = `This guild's id is 1234567890123456`;


e.execute = (params) => {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = bu.processTagInner(params, i);
    }
    let msg = params.msg;
    var replaceString = msg.channel.guild.id;
    var replaceContent = false;


    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};