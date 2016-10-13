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
e.name = `length`;
e.args = `&lt;text&gt;`;
e.usage = `{length;text}`;
e.desc = `Gives the amount of characters in <code>text</code>.`;
e.exampleIn = `What you said is {length;{args}} chars long.`;
e.exampleOut = `What you said is 5 chars long.`;


e.execute = async((params) => {
    let replaceContent = false;
    let replaceString;
    if (params.args.length >= 2) {
        params.args[1] = await(bu.processTagInner(params, 1));
        let args1 = params.args[1];
        replaceString = args1.length;
    } else {
        replaceString = await(bu.tagProcessError(params, params.fallback, '`Not enough arguments`'));
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
});