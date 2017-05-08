/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:27:46
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:27:46
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = 'capitalize';
e.args = '&lt;text&gt; [lower]';
e.usage = '{capitalize;text;lower}';
e.desc = 'Capitalizes the first letter of <code>text</code>. If <code>lower</code> is specified the rest of the text will be lowercase';
e.exampleIn = '{capitalize;hello world!}';
e.exampleOut = 'Hello world!';

e.execute = async function (params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    var replaceString = '';
    var replaceContent = false;
    if (params.args[1]) {
        if (params.args[2]) {
            replaceString = params.args[1][0].toUpperCase() + params.args[1].substr(1).toLowerCase();
        } else {
            replaceString = params.args[1][0].toUpperCase() + params.args[1].substr(1);
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