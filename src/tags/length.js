/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:49:31
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:49:31
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
e.name = 'length';
e.args = '&lt;text&gt;';
e.usage = '{length;text}';
e.desc = 'Gives the amount of characters in `text`, or the number of elements if it is an array.';
e.exampleIn = 'What you said is {length;{args}} chars long.';
e.exampleOut = 'What you said is 5 chars long.';


e.execute = async function (params) {
    let replaceContent = false;
    let replaceString;
    if (params.args.length >= 2) {
        params.args[1] = await bu.processTagInner(params, 1);
        let args1 = params.args[1];
        let deserialized = bu.deserializeTagArray(args1);

        if (deserialized && Array.isArray(deserialized.v)) {
            replaceString = deserialized.v.length;
        } else {
            replaceString = args1.length;
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