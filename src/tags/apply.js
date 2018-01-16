/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:25:58
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-01-16 11:32:26
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
e.args = `&lt;subtag&gt; &lt;args...&gt;`;
e.usage = `{apply;subtag;args...}`;
e.desc = `Executes the provided subtag, using the <code>args</code> as parameters. If <code>args</code> is an array, it will get deconstructed to it's individual elements.`;
e.exampleIn = `{apply;randint;[1,4]}`;
e.exampleOut = `3`;

e.execute = async function (params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let replaceContent = false;
    let replaceString;
    if (params.args.length >= 2) {
        let nArgs = [];
        for (let i = 2; i < params.args.length; i++) {
            let deserialized = await bu.getArray(params, params.args[i]);
            if (deserialized && Array.isArray(deserialized.v)) {
                nArgs.push(deserialized.v);
            } else nArgs.push([params.args[i]]);
        }

        let aArgs = [].concat(...nArgs);
        let title = params.args[1];
        if (TagManager.list.hasOwnProperty(title)) {
            params.args.splice(1, params.args.length);
            for (const element of aArgs) params.args.push(element.toString());
            return await TagManager.list[title].execute(params);
        } else {
            replaceString = await bu.tagProcessError(params, '`No tag found`');
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