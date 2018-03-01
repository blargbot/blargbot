/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:54:06
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-02-06 17:09:02
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = 'for';
e.args = '&lt;variable&gt; &lt;initial&gt; &lt;comparison&gt; &lt;limit&gt; [increment] &lt;code&gt;';
e.usage = '{for;variable;initial;comparison;limit[;increment];code}';
e.desc = 'This will increase the value of <code>variable</code> by <code>increment</code> (defaults to +1), starting at <code>initial</code>';
e.exampleIn = '{for;~index;0;<;10;{get;~index},}';
e.exampleOut = '0,1,2,3,4,5,6,7,8,9,';

const operators = {
    '==': (a, b) => a === b,
    '!=': (a, b) => a !== b,
    '>=': (a, b) => a >= b,
    '>': (a, b) => a > b,
    '<=': (a, b) => a <= b,
    '<': (a, b) => a < b
};

e.execute = async function (params) {
    let fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;
    var parsedFallback = parseInt(fallback);

    let set = TagManager.list['set'];

    let errors = [];

    if (params.args.length == 6 || params.args.length == 7) {

        let varName = await bu.processTagInner(params, 1);
        let initial = parseFloat(await bu.processTagInner(params, 2));
        let operator = operators[await bu.processTagInner(params, 3)];
        let limit = parseFloat(await bu.processTagInner(params, 4));
        let increment;
        if (params.args.length == 6)
            increment = 1;
        else
            increment = parseFloat(await bu.processTagInner(params, 5));

        let code = params.args.length - 1;

        if (isNaN(initial))
            errors.push("Initial must be a number");
        if (!operator)
            errors.push("Invalid operator");
        if (isNaN(limit))
            errors.push("Limit must be a number");
        if (isNaN(increment))
            errors.push("Increment must be a number");

        if (errors.length == 0) {
            replaceString = '';
            for (let i = initial; operator(i, limit); i += increment) {
                params.msg.repeats = params.msg.repeats ? params.msg.repeats + 1 : 1;
                if (params.msg.repeats > 1500) {
                    replaceString += await bu.tagProcessError(params, '`Too Many Loops`');
                    break;
                }
                await set.setVar(params, varName, i);
                replaceString += await bu.processTagInner(params, code);
                if (params.terminate) break;
            }
        } else {
            replaceString = await bu.tagProcessError(params, '`' + errors.join(', ') + '`');
        }
    } else if (params.args.length < 6) {
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
