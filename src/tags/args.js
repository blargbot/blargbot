/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:26:17
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-21 00:49:16
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};
e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `args`;
e.args = `[index] [range]`;
e.usage = `{args[;index;[range]]}`;
e.desc = `Gets user input. Specifying an index will only get the word at that location, specifying
a range will get all the words between index and range. Specify range as <code>n</code> to get all
the words from index to the end`;
e.exampleIn = `Your second word was {args;1}`;
e.exampleOut = `Input: <code>Hello world!</code> <br>Output: <code>Your second word was world!</code>`;


e.execute = async function (params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let words = params.words,
        args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;

    if (args.length > 2) {
        var min = parseInt(args[1]);
        var max = args[2] == 'n' ? words.length : parseInt(args[2]);
        if (min < max) {
            for (var i = min; i < max; i++) {
                if (words[i])
                    replaceString += ` ${words[i]}`;
            }
        } else {
            replaceString = await bu.tagProcessError(params, '`MIN is greater than MAX`');
        }
    } else if (args.length == 2) {
        if (words[parseInt(args[1])]) {
            replaceString = words[parseInt(args[1])];
        } else {
            replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
        }
    } else {
        replaceString = words.join(' ');
    }
    replaceString = replaceString + '';
    replaceString = bu.fixContent(replaceString);
    replaceString = replaceString.replace(new RegExp(bu.specialCharBegin, 'g'), '').replace(new RegExp(bu.specialCharDiv, 'g'), '').replace(new RegExp(bu.specialCharEnd, 'g'), '');

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};