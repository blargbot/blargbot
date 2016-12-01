var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.SIMPLE;
};

e.requireCtx = require;

e.isTag = true;
e.name = `channelid`;
e.args = ``;
e.usage = `{channelid}`;
e.desc = `Returns the ID of the current channel`;
e.exampleIn = `This channel's id is {channelid}`;
e.exampleOut = `This channel's id is 1234567890123456`;


e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    var replaceString = params.msg.channel.id;
    var replaceContent = false;
    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};