/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:54:06
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-02-06 17:20:15
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.ARRAY;
};

e.requireCtx = require;

e.isTag = true;
e.name = 'foreach';
e.args = '&lt;variable&gt; &lt;array&gt; &lt;code&gt;';
e.usage = '{foreach;variable;array;code}';
e.desc = 'For every element in `array` `variable` will be set and then `code` will be run';
e.exampleIn = '{set;~array;apples;oranges;c#}<br />{foreach;~element;~array;I like {get;~element}{newline}}';
e.exampleOut = 'I like apples<br />I like oranges<br />I like c#';

e.execute = async function (params) {
    let fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;
    var parsedFallback = parseInt(fallback);
    if (params.args.length == 4) {
        let args2 = await bu.processTagInner(params, 2);
        let args1 = await bu.processTagInner(params, 1);
        let deserialized = await bu.getArray(params, args2);
        let arr;
        if (deserialized && Array.isArray(deserialized.v))
            arr = deserialized.v;
        else {
            replaceString = await bu.tagProcessError(params, '`Argument 2 is not an array`');
        }

        if (arr != undefined) {
            replaceString = '';
            let set = TagManager.list['set'];
            console.verbose(arr);
            for (const item of arr) {
                params.msg.repeats = params.msg.repeats ? params.msg.repeats + 1 : 1;
                if (params.msg.repeats > 1500) {
                    replaceString += await bu.tagProcessError(params, '`Too Many Loops`');
                    break;
                }
                await set.setVar(params, args1, item);
                replaceString += await bu.processTagInner(params, 3);
                if (params.terminate) break;
            }
        }
    } else if (params.args.length < 4) {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    } else {
        replaceString = await bu.tagProcessError(params, '`Too many arguments`');
    }

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};
