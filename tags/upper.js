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
e.name = `upper`;
e.args = `&lt;text&gt;`;
e.usage = `{upper;text}`;
e.desc = `Returns <code>string</code> as uppercase`;
e.exampleIn = `{upper;this will become uppercase}`;
e.exampleOut = `THIS WILL BECOME UPPERCASE`;


e.execute = async((params) => {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] =await(bu.processTagInner(params, i));
    }
    let args = params.args
        , fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;
    if (args.length > 1)
        replaceString = args[1].toUpperCase();
    else
        replaceString = await(bu.tagProcessError(params, fallback, '`Not enough arguments`'));


    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
});