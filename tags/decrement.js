/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:30:51
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:30:51
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `decrement`;
e.args = `&lt;variable name&gt; [amount]`;
e.usage = `{decrement;variable name[;amount]}`;
e.desc = `Decreases the value of the specified variable by the specified amount. Defaults to 1`;
e.exampleIn = `{set;counter;0} {repeat;{decrement;counter},;10}`;
e.exampleOut = `-1,-2,-3,-4,-5,-6,-7,-8,-9,-10`;

//@Stupid cat The idea of this is to accept a variable name and an optional amount to increment by (dafaults to 1)
//If the variable name supplied relates to an integer variable, then increment the value and re-assign it
//Then, return the new value of the counter
//To decrement, you just pass a negative number as the amount

e.execute = async function (params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        fallback = params.fallback,
        tagName = params.tagName;
    var replaceString = '';
    var replaceContent = false;

    let decrementBy = parseInt(args[2]);
    if (isNaN(decrementBy)) {
        decrementBy = 1;
    }
    if (args.length <= 2) {
        let result = await TagManager.list['get'].getVar(params, args[1]);
        if (result == undefined) {
            replaceString = await bu.tagProcessError(params, '`Variable not defined`');
        } else {
            result = parseInt(result) - decrementBy;
            if (isNaN(result)) {
                replaceString = await bu.tagProcessError(params, '`Not a number`');
            } else replaceString = result;
            await TagManager.list['set'].setVar(params, args[1], result);
        }
    } else if (args.length < 2) {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};