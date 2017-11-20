/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:54:06
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-11-19 17:52:38
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = 'repeat';
e.args = '&lt;text&gt; &lt;amount&gt;';
e.usage = '{repeat;text;amount}';
e.desc = 'Repeats <code>text</code> <code>amount</code> times.';
e.exampleIn = '{repeat;e;10}';
e.exampleOut = 'eeeeeeeeee';

e.execute = async function (params) {
    //   for (let i = 1; i < params.args.length; i++) {
    //       params.args[i] =await bu.processTagInner(params, i);
    //   }
    let fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;
    var parsedFallback = parseInt(fallback);
    if (params.args[1] && params.args[2]) {
        let args2 = parseInt(await bu.processTagInner(params, 2));
        if (isNaN(args2)) {
            if (isNaN(parsedFallback)) {
                return {
                    terminate: params.terminate,
                    replaceString: await bu.tagProcessError(params, '`Not a number`'),
                    replaceContent: replaceContent
                };
            } else {
                args2 = parsedFallback;
            }
        }
        if (args2 < 0) {
            return {
                terminate: params.terminate,
                replaceString: await bu.tagProcessError(params, '`Can\'t be negative`'),
                replaceContent: replaceContent
            };
        }
        replaceString = '';
        for (let i = 0; i < args2; i++) {
            params.msg.repeats = params.msg.repeats ? params.msg.repeats + 1 : 1;
            if (params.msg.repeats > 1500) {
                replaceString += await bu.tagProcessError(params, '`Too Many Loops`');
                break;
            }
            replaceString += await bu.processTagInner(params, 1);
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