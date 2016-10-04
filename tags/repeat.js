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
e.name = 'repeat';
e.args = '&lt;text&gt; &lt;amount&gt;';
e.usage = '{repeat;text;amount}';
e.desc = 'Repeats <code>text</code> <code>amount</code> times.';
e.exampleIn = '{repeat;e;10}';
e.exampleOut = 'eeeeeeeeee';

e.execute = (params) => {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = bu.processTagInner(params, i);
    }
    let args = params.args
        , fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;
    var parsedFallback = parseInt(fallback);
    if (params.args[1] && params.args[2]) {
        let args1 = args[1];
        let args2 = parseInt(args[2]);
        if (isNaN(args2)) {
            if (isNaN(parsedFallback)) {
                return {
                    replaceString: bu.tagProcessError(fallback, '`Not a number`'),
                    replaceContent: replaceContent
                };
            } else {
                args2 = parsedFallback;
            }
        }
        replaceString = args1.repeat(args2);
    } else {
        replaceString = bu.tagProcessError(params.fallback, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};
