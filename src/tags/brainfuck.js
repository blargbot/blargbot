/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:27:21
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:27:21
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `brainfuck`;
e.args = `&lt;code&gt; [input]`;
e.usage = `{brainfuck;code[;input]}`;
e.desc = `Interprets brainfuck input.`;
e.exampleIn = `{brainfuck;++++++++++[>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>.}`;
e.exampleOut = `Hello World!`;

e.execute = async function (params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;
    if (args[1]) {
        try {
            replaceString = await bu.filterMentions((dep.brainfuck.execute(args[1], args[2])).output);
        } catch (err) {
            replaceString = await bu.tagProcessError(params, '`' + err.message + '`');
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