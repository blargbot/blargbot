var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `randint`;
e.args = `[min] &lt;max&gt;`;
e.usage = `{randint[;min];max}`;
e.desc = `If only max is specified, gets a random number between max and 0. If both arguments are
                                specified,
                                gets
                                a random number between them.
                            `;
e.exampleIn = `You rolled a {randint;1;6}`;
e.exampleOut = `You rolled a 5`;


e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;
    var parsedFallback = parseInt(fallback);
    if (args.length == 2) {
        let args1 = parseInt(args[1]);
        if (isNaN(args1)) {
            if (isNaN(parsedFallback)) {
                return {
                    replaceString: await bu.tagProcessError(params, '`Not a number`'),
                    replaceContent: replaceContent
                };
            } else {
                args1 = parsedFallback;
            }
        }
        replaceString = bu.getRandomInt(0, args1);
    } else if (args.length > 2) {
        let args1 = parseInt(args[1]);
        if (isNaN(args1)) {
            if (isNaN(parsedFallback)) {
                return {
                    replaceString: await bu.tagProcessError(params, '`Not a number`'),
                    replaceContent: replaceContent
                };
            } else {
                args1 = parsedFallback;
            }
        }
        let args2 = parseInt(args[2]);
        if (isNaN(args2)) {
            if (isNaN(parsedFallback)) {
                return {
                    replaceString: await bu.tagProcessError(params, '`Not a number`'),
                    replaceContent: replaceContent
                };
            } else {
                args2 = parsedFallback;
            }
        }
        replaceString = bu.getRandomInt(args1, args2);
    } else {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};