/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:30:37
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:30:37
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.SIMPLE;
};

e.requireCtx = require;

e.isTag = true;
e.name = `commandname`;
e.args = ``;
e.usage = `{commandname}`;
e.desc = `Gets the name of the current tag or custom command. Will throw an error in other instances.`;
e.exampleIn = `This command is {commandname}`;
e.exampleOut = `This command is test`;

e.execute = async function (params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;
    logger.verbose(params.tagName);
    if (params.tagName)
        replaceString = params.tagName;
    else replaceString = await bu.tagProcessError(params, '`Not a command`');

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};