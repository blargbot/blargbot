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
e.name = `upper`;
e.args = `&lt;text&gt;`;
e.usage = `{upper;text}`;
e.desc = `Returns <code>string</code> as uppercase`;
e.exampleIn = `{upper;this will become uppercase}`;
e.exampleOut = `THIS WILL BECOME UPPERCASE`;


e.execute = (msg, args, fallback) => {
    var replaceString = '';
    var replaceContent = false;
    if (args.length > 1)
        replaceString = args[1].toUpperCase();
    else
        replaceString = bu.tagProcessError(fallback, '`Not enough arguments`');


    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};