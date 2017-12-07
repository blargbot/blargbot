/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:54:30
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:54:30
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.array = true;

e.name = `reverse`;
e.args = `&lt;text&gt;`;
e.usage = `{reverse;text}`;
e.desc = `Reverses the order of text or an array. If {get} or {aget} are used with an array, will modify the original array.`;
e.exampleIn = `{reverse;text}`;
e.exampleOut = `txet`;

e.execute = async function (params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let words = params.words;
    var replaceString = '';
    var replaceContent = false;
    let args = params.args;
    if (params.args[1]) {
        let deserialized = bu.deserializeTagArray(args[1]);

        if (deserialized && Array.isArray(deserialized.v)) {
            deserialized.v.reverse();
            if (deserialized.n) {
                await bu.setArray(deserialized, params);
            } else replaceString = bu.serializeTagArray(deserialized.v)
        } else {
            replaceString = args[1].split('').reverse().join('');
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