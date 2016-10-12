var e = module.exports = {};
var bu;

const async = require('asyncawait/async');
const await = require('asyncawait/await');
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

e.execute = async((params) => {
    //   for (let i = 1; i < params.args.length; i++) {
    //       params.args[i] =await(bu.processTagInner(params, i);
    //   }
    let fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;
    var parsedFallback = parseInt(fallback);
    if (params.args[1] && params.args[2]) {
        let args2 = parseInt(await(bu.processTagInner(params, 2)));
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
        if (args2 < 0) {
            return {
                replaceString: bu.tagProcessError(fallback, '`Can\'t be negative`'),
                replaceContent: replaceContent
            };
        }
        replaceString = '';
        for (let i = 0; i < args2; i++) {
            replaceString += await(bu.processTagInner(params, 1));
        }
    } else {
        replaceString = bu.tagProcessError(params.fallback, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
});
