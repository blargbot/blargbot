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
e.name = `space`;
e.args = `[length]`;
e.usage = `{space[;length]}`;
e.desc = `Will be replaced by a specified number of spaces.`;
e.exampleIn = `{space;4}Hello, world!`;
e.exampleOut = `    Hello, world!`;


e.execute = (params) => {
    let length = 1;
    var parsedFallback = parseInt(params.fallback);
    if (params.args[1]) {
        length = parseInt(params.args[1]);
        if (isNaN(length)) {
            if (isNaN(parsedFallback)) {
                return {
                    replaceString: bu.tagProcessError(params.fallback, '`Not a number`'),
                    replaceContent: replaceContent
                };
            } else {
                length = parsedFallback;
            }
        }
    }
    var replaceString = '';

    for (let i = 0; i < length; i++) {
        replaceString += ' ';
    }

    var replaceContent = false;


    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};