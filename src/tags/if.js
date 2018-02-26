/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:47:48
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-01-17 19:36:04
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `if`;
e.args = `&lt;arg1&gt; &lt;evaluator&gt; &lt;arg2&gt; &lt;then&gt; &lt;else&gt;`;
e.usage = `{if;evaluator;arg1;arg2;then;else}`;
e.desc = `Evaluates `arg1` and `arg2` using the `evaluator`. If it
returns true, the tag returns `then`. Otherwise, it returns `else`. Valid
evaluators are `==``!=` `&lt;` `&lt;=` `&gt;` `
&gt;=` `startswith` `endswith` `includes``;

e.exampleIn = `{if;5;&lt;=;10;5 is less than or equal to 10;5 is greater than 10}`;
e.exampleOut = `5 is less than or equal to 10`;

const operators = {
    '==': (a, b) => a === b,
    '!=': (a, b) => a !== b,
    '>=': (a, b) => a >= b,
    '>': (a, b) => a > b,
    '<=': (a, b) => a <= b,
    '<': (a, b) => a < b,
    'startswith': (a, b) => a.toString().startsWith(b),
    'endswith': (a, b) => a.toString().endsWith(b),
    'includes': (a, b) => a.toString().includes(b)
};

e.execute = async function (params) {
    // for (let i = 1; i < params.args.length; i++) {
    //      params.args[i] =await bu.processTagInner(params, i);
    // }
    let args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;


    if (args.length == 3 || args.length == 4) {
        //{if;bool;then} or {if;bool;then;else}
        args[1] = await bu.processTagInner(params, 1);
        if (args[1].toLowerCase() == "true" || args[1] == true) {
            params.content = args[2];
            replaceString = await bu.processTagInner(params);
        } else if (args[1].toLowerCase() == "false" || args[1] == false) {
            params.content = args[3];
            replaceString = await bu.processTagInner(params);
        } else {
            replaceString = await bu.tagProcessError(params, '`Invalid boolean`');
        }
    } else if (args.length == 5 || args.length == 6) {
        //{if;val;condition;val;then} or {if;val;condition;val;then;else}
        args[1] = await bu.processTagInner(params, 1);
        if (/^-?\d+(\.\d*)?$/.test(args[1])) args[1] = parseFloat(args[1]);
        args[2] = await bu.processTagInner(params, 2);
        if (/^-?\d+(\.\d*)?$/.test(args[2])) args[2] = parseFloat(args[2]);
        args[3] = await bu.processTagInner(params, 3);
        if (/^-?\d+(\.\d*)?$/.test(args[3])) args[3] = parseFloat(args[3]);

        let res;
        if (typeof args[1] == 'string' && operators.hasOwnProperty(args[1].toLowerCase())) {
            res = operators[args[1].toLowerCase()](args[2], args[3]);
        } else if (typeof args[2] == 'string' && operators.hasOwnProperty(args[2].toLowerCase())) {
            res = operators[args[2].toLowerCase()](args[1], args[3]);
        } else replaceString = await bu.tagProcessError(params, '`Invalid Operator`');
        if (res === true) {
            params.content = args[4];
            replaceString = await bu.processTagInner(params);
        } else if (res === false) {
            params.content = args[5];
            replaceString = await bu.processTagInner(params);
        }
    } else if (args.length > 6) {
        replaceString = await bu.tagProcessError(params, '`Too many arguments`');
    } else {
        console.verbose(args.length);
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};
