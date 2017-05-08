/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:25:58
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:25:58
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.ARRAY;
};

e.requireCtx = require;

e.isTag = true;
e.name = `apply`;
e.args = `&lt;tag&gt; &lt;args&gt;`;
e.usage = `{apply;tag;args}`;
e.desc = `Executes the provided tag, using the array args as parameters.`;
e.exampleIn = `{apply;randint;[1,4]}`;
e.exampleOut = `3`;

e.execute = async function (params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let replaceContent = false;
    let replaceString;
    if (params.args.length >= 2) {
        let deserialized = await bu.getArray(params, params.args[2]);

        if (deserialized && Array.isArray(deserialized.v)) {
            let title = params.args[1];
            if (TagManager.list.hasOwnProperty(title)) {
                params.args.splice(1, params.args.length);
                for (const element of deserialized.v) params.args.push(element.toString());
                logger.debug(params.args);
                return await TagManager.list[title].execute(params);
            } else {
                replaceString = await bu.tagProcessError(params, '`No tag found`');
            }
        } else {
            replaceString = await bu.tagProcessError(params, '`Not an array`');
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