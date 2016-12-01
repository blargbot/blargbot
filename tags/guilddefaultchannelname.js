var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.SIMPLE;
};

e.requireCtx = require;

e.isTag = true;
e.name = `guilddefaultchannelname`;
e.args = ``;
e.usage = `{guilddefaultchannelname}`;
e.desc = `Returns the guild's default channel's name`;
e.exampleIn = `Default channel is {guilddefaultchannelname}`;
e.exampleOut = `Default channel is defaultchannel`;


e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let msg = params.msg;
    var replaceString = msg.channel.guild.defaultChannel.name;
    var replaceContent = false;


    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};