var e = module.exports = {};

e.init = () => {
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


e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    var replaceString = params.msg.channel.name;
    var replaceContent = false;


    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};