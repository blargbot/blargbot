/*
 * @Author: stupid cat
 * @Date: 2017-05-21 13:17:14
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-21 13:25:37
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.array = true;
e.isTag = true;
e.name = `min`;
e.args = `&lt;number&gt;...`;
e.usage = `{min;number...}`;
e.desc = `Returns the smallest number out of those provided`;
e.exampleIn = `{min;50;2;65}`;
e.exampleOut = `2`;

e.execute = async function (params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;

    let numArray = [];
    if (params.args[1]) {
        let deserialized = bu.deserializeTagArray(args[1]);

        if (deserialized && Array.isArray(deserialized.v)) {
            numArray = deserialized;
        } else {
            numArray = params.args.slice(1);
        }
        replaceString = Math.min(...numArray);
    } else {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }
    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};