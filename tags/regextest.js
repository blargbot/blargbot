/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:51:46
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-10-08 14:19:42
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};
e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `regextest`;
e.args = `&lt;query&gt; &lt;regex&gt;`;
e.usage = `{regexreplace;query;regex}`;
e.desc = `Tests if the <code>regex</code> phrase matches the <code>query</code>, and returns a boolean.`;

e.exampleIn = `{regextest;apple;/p+/i} {regextest;banana;/p+/i}`;
e.exampleOut = `true false`;


e.execute = async function (params) {
    //for (let i = 1; i < params.args.length; i++) {
    //    params.args[i] = await bu.processTagInner(params, i);
    //}
    let fallback = params.fallback;
    var returnObj = {
        replaceContent: false
    };

    var regexList;
    if (params.args.length > 2) {
        if (/^\/?.*\/.*/.test(params.args[2])) {
            params.args[1] = await bu.processTagInner(params, 1);
            regexList = params.args[2].match(/^\/?(.*)\/(.*)/);
            returnObj.replaceString = new RegExp(regexList[1], regexList[2]).test(params.args[1]);
        } else {
            returnObj.replaceString = await bu.tagProcessError(params, '`Invalid regex string`');
        }
    } else {
        returnObj.replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }

    return returnObj;
};