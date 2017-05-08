/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:06:33
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:06:33
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.CCOMMAND;
};

e.requireCtx = require;

e.isTag = true;
e.name = `timer`;
e.args = `&lt;code&gt; &lt;time&gt;`;
e.usage = `{timer;code;time}`;
e.desc = `Executes the provided code after a certain amount of time. Three timers are allowed per custom command, with no recursive timers.`;
e.exampleIn = `{timer;Hello!;20s}`;
e.exampleOut = `(after 20 seconds:) Hello!`;

e.execute = async function(params) {
    var replaceString = '';
    var replaceContent = false;
    if (params.msg.didTimer == true) {
        replaceString = await bu.tagProcessError(params, '`No recursive timers`');
    } else if (params.msg.timers && params.msg.timers >= 3) {
        replaceString = await bu.tagProcessError(params, '`Only allowed 3 timers`');
    } else if (!params.ccommand) {
        replaceString = await bu.tagProcessError(params, '`Can only use in CCommands`');
    } else {
        if (params.args.length > 2) {
            params.args[2] = await bu.processTagInner(params, 2);
            let duration = bu.parseDuration(params.args[2]);
            if (duration.asMilliseconds() > 0) {
                let msg = params.msg;
                params.msg = msg.id;
                await r.table('events').insert({
                    type: 'tag',
                    params,
                    channel: msg.channel.id,
                    endtime: r.epochTime(dep.moment().add(duration).unix())
                });
                params.msg = msg;
                params.msg.timers = params.msg.timers ? params.msg.timers + 1 : 1;
            } else {
                replaceString = await bu.tagProcessError(params, '`Invalid duration`');
            }
        } else {
            replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
        }
    }

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};