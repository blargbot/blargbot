/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:26:17
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-01-26 11:04:45
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};
e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `argsarray`;
e.args = ``;
e.usage = `{argsarray}`;
e.desc = `Gets user input as an array.`;
e.exampleIn = `Your input was {argsarray}`;
e.exampleOut = `Input: <code>Hello world!</code> <br>Output: <code>Your input was ["Hello","world!"]</code>`;


e.execute = async function (params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let words = params.words,
        args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;

    replaceString = JSON.stringify(words);
    replaceString = bu.fixContent(replaceString);
    replaceString = replaceString.replace(new RegExp(bu.specialCharBegin, 'g'), '').replace(new RegExp(bu.specialCharDiv, 'g'), '').replace(new RegExp(bu.specialCharEnd, 'g'), '');

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};