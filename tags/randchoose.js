/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:51:11
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:51:11
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
e.name = `randchoose`;
e.args = `&lt;choices...&gt;`;
e.usage = `{randchoose;choices...}`;
e.desc = `Chooses a random choice`;
e.exampleIn = `I feel like eating {randchoose;cake;pie;pudding} today.`;
e.exampleOut = `I feel like eating pudding today.`;


e.execute = async function (params) {
    let args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;
    if (args.length > 1) {
        if (args.length == 2) {
            params.args[1] = await bu.processTagInner(params, 1);
        }
        let deserialized = await bu.getArray(params, args[1]);
        logger.verbose(deserialized);
        if (deserialized && Array.isArray(deserialized.v)) {
            logger.verbose(deserialized);
            let seed = bu.getRandomInt(0, deserialized.v.length - 1);
            replaceString = deserialized.v[seed];
            logger.verbose(replaceString);
        } else {
            let seed = bu.getRandomInt(1, args.length - 1);
            replaceString = await bu.processTagInner(params, seed);
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