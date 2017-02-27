var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.SIMPLE;
};

e.requireCtx = require;

e.isTag = true;
e.name = `delete`;
e.args = ``;
e.usage = `{delete}`;
e.desc = `Deletes the initiating command.`;
e.exampleIn = `The message that triggered this will be deleted. {delete}`;
e.exampleOut = `(the message got deleted idk how to do examples for this)`;

e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let msg = params.msg;
    if (bu.commandMessages[msg.channel.guild.id]) {
        let index = bu.commandMessages[msg.channel.guild.id].indexOf(msg.id);
        if (index > -1) {
            bu.commandMessages[msg.guild.id].splice(index, 1);
        }
    }
    try {
        if (msg.delete) msg.delete();
    } catch (err) {

    }
    var replaceString = ``;
    var replaceContent = false;


    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};