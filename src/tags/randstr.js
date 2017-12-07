/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:51:23
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:51:23
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = 'randstr';
e.args = '&lt;chars&gt; &lt;length&gt;';
e.usage = '{randstr;chars;length}';
e.desc = 'Creates a random string with characters from <code>chars</code> that is <code>length</code> characters long.';
e.exampleIn = '{randstr;1234567890;10}';
e.exampleOut = '3789327305';

e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;
    var parsedFallback = parseInt(fallback);
    if (params.args[1] && params.args[2]) {
        let args1 = args[1];
        let args2 = parseInt(args[2]);
        if (isNaN(args2)) {
            if (isNaN(parsedFallback)) {
                return {
                    replaceString: await bu.tagProcessError(params, '`Not a number`'),
                    replaceContent: replaceContent
                };
            } else {
                args1 = parsedFallback;
            }
        } else {
            for (let i = 0; i < args2; i++) {
                replaceString += args1[Math.floor(Math.random() * args[1].length)];
            }
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