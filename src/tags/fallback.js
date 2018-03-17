/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:37:28
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:37:28
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `fallback`;
e.args = `&lt;message&gt;`;
e.usage = `{fallback;message}`;
e.desc = `Should any tag fail to parse, it will be replaced with the fallback message instead of an error`;
e.exampleIn = `{fallback;This tag failed} {randint}`;
e.exampleOut = `This tag failed`;

e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    var replaceString = '';
    var replaceContent = false;
    params.fallback = params.args[1];

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent,
        fallback: params.fallback
    };
};