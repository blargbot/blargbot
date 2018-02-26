/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:51:46
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-10-17 12:12:28
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};
e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = 'regexreplace';
e.args = '[toreplace] &lt;regex&gt; &lt;replacewith&gt;';
e.usage = '{regexreplace[;textToReplace];regex;replaceWith}';
e.desc = 'Replaces the `regex` phrase with `replacewith`. ' +
'If `toreplace` is specified, the tag is replaced with the new `toreplace`. ' + 
'If not, it replaces the message.';

e.exampleIn = 'I like {regexreplace;to consume;/o/gi;a} cheese. {regexreplace;/e/gi;n}';
e.exampleOut = 'I likn ta cansumn chnnsn.';


e.execute = async function (params) {
    //for (let i = 1; i < params.args.length; i++) {
    //    params.args[i] = await bu.processTagInner(params, i);
    //}
    let fallback = params.fallback;
    var returnObj = {
        replaceContent: false
    };

    var regexList;
    if (params.args.length > 3) {
        try {
            let regex = bu.createRegExp(params.args[2]);
            params.args[1] = await bu.processTagInner(params, 1);
            params.args[3] = await bu.processTagInner(params, 3);
            returnObj.replaceString = regex.test(params.args[1]);
            returnObj.replaceString = params.args[1].replace(regex, params.args[3]);
        } catch (err) {
            returnObj.replaceString = await bu.tagProcessError(params, `\`${err}\``)
        }
    } else if (params.args.length == 3) {
        try {
            let regex = bu.createRegExp(params.args[1]);
            params.args[2] = await bu.processTagInner(params, 2);
            returnObj.replace = regex;
            returnObj.replaceString = params.args[2];
            returnObj.replaceContent = true;
        } catch (err) {
            returnObj.replaceString = await bu.tagProcessError(params, `\`${err}\``)
        }
    } else {
        returnObj.replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }

    return returnObj;
};