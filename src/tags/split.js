/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:58:58
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:58:58
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.ARRAY;
};

e.requireCtx = require;

e.isTag = true;
e.name = `split`;
e.args = `&lt;text&gt; &lt;splitter&gt;`;
e.usage = `{split;text;splitter}`;
e.desc = `Splits text using the provided splitter, and the returns an array.`;
e.exampleIn = `{split;Hello! This is a sentence.;{space}}`;
e.exampleOut = `["Hello!","This","is","a","sentence."]`;

e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let words = params.words;
    var replaceString = '';
    var replaceContent = false;
    let args = params.args;
    if (params.args.length >= 3) {
        let array = params.args[1].split(params.args[2]);
        replaceString = bu.serializeTagArray(array);
    } else {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }
    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};