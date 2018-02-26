/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:54:15
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:54:15
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = 'replace';
e.args = '[toreplace] &lt;phrase&gt; &lt;replacewith&gt;';
e.usage = '{replace[;textToReplace];phrase;replaceWith}';
e.desc = 'Replaces the `phrase` with `replacewith`. ' +
'If `toreplace` is specified, the tag is replaced with the new `toreplace`. '+
'If not, it replaces the message.';
e.exampleIn = 'I like {replace;to eat;eat;nom} cheese. {replace;cheese;ham}';
e.exampleOut = 'I like to nom ham';


e.execute = async function (params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        fallback = params.fallback;
    var returnObj = {
        replaceContent: false
    };
    if (args.length > 3) {

        returnObj.replaceString = args[1].replace(args[2], args[3]);
    } else if (args.length == 3) {
        returnObj.replaceString = args[2];
        returnObj.replaceContent = true;
        returnObj.replace = args[1];
    } else {
        returnObj.replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }
    return returnObj;
};