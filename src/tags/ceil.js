/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:29:48
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:29:48
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `ceil`;
e.args = `&lt;number&gt;`;
e.usage = `{ceil;number}`;
e.desc = `Rounds a number up.`;
e.exampleIn = `{ceil;1.23}`;
e.exampleOut = `2`;

e.execute = async function (params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;
    if (args[1]) {
        var asNumber = parseFloat(args[1]);
        if (!isNaN(asNumber)) {
            replaceString = Math.ceil(asNumber);
        } else {
            replaceString = await bu.tagProcessError(params, '`Not a number`');
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