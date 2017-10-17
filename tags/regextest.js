/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:51:46
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-10-17 11:46:13
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
    if (params.msg.author.id === '238841636581277698') return { // temporary until I sort the issue out
        replaceContent: false,
        replaceString: ':('
    };
    let fallback = params.fallback;
    var returnObj = {
        replaceContent: false
    };

    var regexList;
    if (params.args.length > 2) {
        try {
            let regex = bu.createRegExp(params.args[2]);
            params.args[1] = await bu.processTagInner(params, 1);
            returnObj.replaceString = regex.test(params.args[1]);
        } catch (err) {
            returnObj.replaceString = await bu.tagProcessError(params, `\`${err.message}\``)
        }
    } else {
        returnObj.replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }

    return returnObj;
};