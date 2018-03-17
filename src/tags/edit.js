/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:33:45
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:34:15
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.CCOMMAND;
};

e.requireCtx = require;

e.isTag = true;
e.name = `edit`;
e.args = `[channelid] &lt;messageid&gt; &lt;message&gt;`;
e.usage = `{edit[;channelid];messageid;message}`;
e.desc = `Edits a message outputted by the bot with the given message ID. The channel defaults to the current channel.`;
e.exampleIn = `A message got edited: {edit;111111111111111111;New content}`;
e.exampleOut = `(the message got edited idk how to do examples for this)`;

e.execute = async function (params) {
    var replaceString = ``;
    var replaceContent = false;

    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let msg, content = '';
    try {
        if (params.isStaff) {
            if (params.args.length == 3) {
                msg = await bot.getMessage(params.msg.channel.id, params.args[1]);
                content = params.args[2];
            } else if (params.args.length > 3) {
                if (/([0-9]{17,23})/.test(params.args[1])) {
                    let channelid = params.args[1].match(/([0-9]{17,23})/)[1];
                    let channel = bot.getChannel(channelid);
                    if (channel) {
                        if (channel.guild.id == params.msg.guild.id) {
                            msg = await bot.getMessage(params.args[1], params.args[2]);
                            content = params.args[3];

                        } else
                            replaceString = await bu.tagProcessError(params, '`Channel must be in guild`');
                    } else
                        replaceString = await bu.tagProcessError(params, '`Channel not found`');
                }
            } else
                replaceString = await bu.tagProcessError(params, '`Not enough arguments`');

            if (replaceString == "") {
                if (!msg)
                    replaceString = await bu.tagProcessError(params, '`No message provided`');
                else if (msg.author.id != bot.user.id)
                    replaceString = await bu.tagProcessError(params, '`I must be message author`');
                else if (content == '')
                    replaceString = await bu.tagProcessError(params, '`New message cannot be empty`');
                try {
                    if (replaceString == "" && msg.edit) msg.edit(content);
                } catch (err) { }
            }

        } else
            replaceString = await bu.tagProcessError(params, '`Author must be staff`');
    } catch (err) {
        replaceString = await bu.tagProcessError(params, '`Message not found`');
    }

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};