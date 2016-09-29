var e = module.exports = {};
var bu;

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `args`;
e.args = `[index] [range]`;
e.usage = `{args[;index;[range]]}`;
e.desc = `Gets user input. Specifying an index will only get the word at that location, specifying
                                a range
                                will
                                get all the words between index and range. Specify range as <code>n</code> to get all
                                the words
                                from
                                index to the end
                            `;
e.exampleIn = `Your second word was {args;1}`;
e.exampleOut = `
                                Input: <code>Hello world!</code> <br>Output: <code>Your second word was world!</code>
                            `;


e.execute = (params) => {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = bu.processTagInner(params, i);
    }
    let words = params.words
        , args = params.args
        , fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;

    if (args.length > 2) {
        var min = parseInt(args[1]);
        var max = args[2] == 'n' ? words.length : parseInt(args[2]);
        //console.log(max);
        if (min < max) {
            for (var i = min; i < max; i++) {
                if (words[i])
                    replaceString += ` ${words[i]}`;
            }
        } else {
            replaceString = bu.tagProcessError(fallback, '`MIN is greater than MAX`');
        }
    } else if (args.length == 2) {
        if (words[parseInt(args[1])]) {
            replaceString = words[parseInt(args[1])];
        } else {
            replaceString = bu.tagProcessError(fallback, '`Not enough arguments`');
        }
    } else {
        //console.log(words.length, util.inspect(words));

        if (!(words[0] == '' && words.length == 1)) {
            replaceString = words.join(' ');
        }
        else
            replaceString = bu.tagProcessError(fallback, '`User gave no args`');
    }
    replaceString = replaceString + '';

    replaceString = replaceString.replace(new RegExp(bu.specialCharBegin, 'g'), '').replace(new RegExp(bu.specialCharDiv, 'g'), '').replace(new RegExp(bu.specialCharEnd, 'g'), '');

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};