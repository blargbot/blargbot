/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:05:37
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:05:37
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `throw`;
e.args = `&lt;error&gt;`;
e.usage = `{throw;error}`;
e.desc = `Throws an error.`;
e.exampleIn = `{throw;Custom Error}`;
e.exampleOut = `\`Custom Error\``;

e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args;
    var replaceString = '';
    var replaceContent = false;
    if (args[1]) {
        replaceString = await bu.tagProcessError(params, '`' + args[1] + '`');
    } else {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }
    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};