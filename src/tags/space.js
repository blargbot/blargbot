/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:57:48
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:57:48
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `space`;
e.args = `[length]`;
e.usage = `{space[;length]}`;
e.desc = `Will be replaced by a specified number of spaces.`;
e.exampleIn = `{space;4}Hello, world!`;
e.exampleOut = `    Hello, world!`;

e.execute = async function (params) {
    let length = 1;
    var parsedFallback = parseInt(params.fallback);
    if (params.args[1]) {
        length = parseInt(await bu.processTagInner(params, 1));
        if (isNaN(length)) {
            if (isNaN(parsedFallback)) {
                return {
                    replaceString: await bu.tagProcessError(params, '`Not a number`'),
                    replaceContent: replaceContent
                };
            } else {
                length = parsedFallback;
            }
        }
    }
    var replaceString = '';

    for (let i = 0; i < length; i++) {
        replaceString += ' ';
    }

    var replaceContent = false;


    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};