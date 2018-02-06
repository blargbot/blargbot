/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:54:06
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-12-15 15:03:11
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
e.desc = 'For every element in <code>array</code> <code>variable</code> will be set and then <code>code</code> will be run';
e.exampleIn = '{set;~array;[apples,oranges,c#]}<br />{foreach;~element;~array;I like {get;~element}{newline}}';
e.exampleOut = 'I like apples<br />I like oranges<br />I like c#';

e.execute = async function (params) {
    let fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;
    var parsedFallback = parseInt(fallback);
    if (params.args.length == 4) {
        let args2 = await bu.processTagInner(params, 2);
        let args1 = await bu.processTagInner(params, 1);

        let deserialized = bu.deserializeTagArray(args2);

        if (deserialized && Array.isArray(deserialized.v))
            let arr = deserialized.v;
        else {
            let value = await TagManager.list['get'].getVar(params, args2);
            if (value != undefined && Array.isArray(value))
                let arr = value;
            else
                replaceString = await bu.tagProcessError(params, '`Argument 2 is not an array`');
        }

        if (arr != undefined)   {
            replaceString = '';
            let set = TagManager.list['set'];
            for (let i = 0; i < args2.length; i++) {
                params.msg.repeats = params.msg.repeats ? params.msg.repeats + 1 : 1;
                if (params.msg.repeats > 1500) {
                    replaceString += await bu.tagProcessError(params, '`Too Many Loops`');
                    break;
                }
                await set.setVar(params, args1, arr[i]);
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
