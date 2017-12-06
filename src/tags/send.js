/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:57:04
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:57:04
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.CCOMMAND;
};

e.requireCtx = require;

e.isTag = true;
e.name = `send`;
e.args = `&lt;channel&gt; &lt;message&gt;`;
e.usage = `{send;#channel;message}`;
e.desc = `Sends the message to a specific channel, and returns the message ID. A channel is either an ID or channel mention.`;
e.exampleIn = `{send;#channel;Hello!}`;
e.exampleOut = `1111111111111111111\nIn #channel: Hello!`;

e.execute = async function (params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    var replaceString = '';
    var replaceContent = false;
    if (!params.ccommand) {
        replaceString = await bu.tagProcessError(params, '`Can only set channel in CCommands`');
    } else {
        if (!params.isStaff) {
            replaceString = await bu.tagProcessError(params, '`Author must be staff`');
        } else
            if (/([0-9]{17,23})/.test(params.args[1])) {
                let channelid = params.args[1].match(/([0-9]{17,23})/)[1];
                let channel = bot.getChannel(channelid);
                if (channel) {
                    if (channel.guild.id == params.msg.guild.id) {
                        if (params.args[2]) {
                            let msg = await bu.send(channel.id, {
                                content: params.args[2],
                                disableEveryone: false
                            });
                            replaceString = msg.id;
                        } else {
                            replaceString = await bu.tagProcessError(params, '`Must provide a message`');
                        }
                    } else {
                        replaceString = await bu.tagProcessError(params, '`Channel must be in guild`');
                    }
                } else {
                    replaceString = await bu.tagProcessError(params, '`Channel not found`');
                }
            } else {
                replaceString = await bu.tagProcessError(params, '`Invalid channel`');
            }
    }
    params.fallback = params.args[1];

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};