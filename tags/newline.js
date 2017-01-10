var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `newline`;
e.args = `[length]`;
e.usage = `{newline[;length]}`;
e.desc = `Will be replaced by a specified number of newline characters (\\n).`;
e.exampleIn = `{newline}Hello, world!`;
e.exampleOut = `\nHello, world!`;


e.execute = async function(params) {
    let length = 1;
    var parsedFallback = parseInt(params.fallback);
    if (params.args[1]) {
        length = parseInt(await bu.processTagInner(params, 1));
        if (isNaN(length)) {
            if (isNaN(parsedFallback)) {
                return {
                    replaceString: await bu.tagProcessError(params, '`Not a number`'),
                    replaceContent: replaceContent
                };
            } else {
                length = parsedFallback;
            }
        }
    }
    var replaceString = '';

    for (let i = 0; i < length; i++) {
        replaceString += '\n';
    }

    var replaceContent = false;


    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};