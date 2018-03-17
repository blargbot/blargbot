/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:37:21
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:37:21
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.CCOMMAND;
};
e.requireCtx = require;
e.isTag = true;

e.name = 'execcc';
e.args = '&lt;code&gt; [user input]';
e.usage = '{execcc;tag[;input]}';
e.desc = 'Executes another ccommand. Useful for modules.';
e.exampleIn = 'Let me do a ccommand for you. {execcc;f}';
e.exampleOut = 'Let me do a ccommand for you. User#1111 has paid their respects. Total respects given: 5';


e.execute = async function (params) {
    if (params.msg.iterations && params.msg.iterations > 200) {
        bu.send(params.msg, 'Terminated recursive tag after 200 execs.');
        throw ('Too Much Exec');
    } else if (!params.msg.iterations) params.msg.iterations = 1;
    else params.msg.iterations++;

    // processes any nested tags in the `args` array. if your tag uses advanced logic, you may wish to reimplement this
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    var replaceString = '';
    var replaceContent = false;
    if (params.args[1]) {
        let storedGuild = await bu.getGuild(params.msg.guild.id);
        let tag = storedGuild.ccommands[params.args[1].toLowerCase()];
        if (!tag) {
            replaceString = await bu.tagProcessError(params, '`Tag not found`');
        } else {
            if (typeof tag == 'string')
                tag = { content: tag };
            if (tag.content.toLowerCase().indexOf('{nsfw}') > -1) {
                let nsfwChan = await bu.isNsfwChannel(params.msg.channel.id);
                if (!nsfwChan) {
                    replaceString = await bu.tagProcessError(params, '`NSFW tag`');
                    return {
                        replaceString: replaceString,
                        replaceContent: false
                    };
                }
            }
            let tagArgs;
            if (params.args[2]) {
                tagArgs = params.args[2];
            } else {
                tagArgs = '';
            }
            tagArgs = bu.splitInput(tagArgs);
            params.words = tagArgs;
            params.content = tag.content;
            replaceString = await bu.processTagInner(params);
        }
    } else {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};