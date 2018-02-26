/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:31:02
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:31:02
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `delete`;
e.args = `[channelid] [messageid]`;
e.usage = `{delete[;channelid][;messageid]}`;
e.desc = `Deletes the specified message, defaulting to the message that invoked the command. Only ccommands can delete other messages.`;
e.exampleIn = `The message that triggered this will be deleted. {delete}`;
e.exampleOut = `(the message got deleted idk how to do examples for this)`;

e.execute = async function (params) {
    var replaceString = ``;
    var replaceContent = false;

    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let msg = params.msg;
    try {
        if (params.args.length > 1 && params.ccommand) {
            if (params.isStaff) {
                if (params.args.length == 2) {
                    msg = await bot.getMessage(params.msg.channel.id, params.args[1]);
                } else if (params.args.length > 2) {
                    if (/([0-9]{17,23})/.test(params.args[1])) {
                        let channelid = params.args[1].match(/([0-9]{17,23})/)[1];
                        let channel = bot.getChannel(channelid);
                        if (channel) {
                            if (channel.guild.id == params.msg.guild.id) {
                                msg = await bot.getMessage(params.args[1], params.args[2]);
                            } else
                                replaceString = await bu.tagProcessError(params, '`Channel must be in guild`');
                        } else
                            replaceString = await bu.tagProcessError(params, '`Channel not found`');
                    }
                }
            } else
                replaceString = await bu.tagProcessError(params, '`Author must be staff`');
        }
        if (replaceString == '') {
            if (!bu.notCommandMessages[msg.guild.id])
                bu.notCommandMessages[msg.guild.id] = {};
            bu.notCommandMessages[msg.guild.id][msg.id] = true;

            try {
                if (msg.delete) msg.delete();
            } catch (err) { }
        }
    } catch (err) {
        replaceString = await bu.tagProcessError(params, '`Message not found`');
    }


    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};