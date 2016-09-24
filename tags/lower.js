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
e.name = `lower`;
e.args = `&lt;string&gt;`;
e.usage = `{lower}`;
e.desc = `Returns <code>string</code> as lowercase`;
e.exampleIn = `{lower;THIS WILL BECOME LOWERCASE}`;
e.exampleOut = `this will become lowercase`;


e.execute = (msg, args, fallback) => {
    var replaceString = '';
    var replaceContent = false;
    if (args.length > 1)
        replaceString = args[1].toLowerCase();
    else
        replaceString = bu.tagProcessError(fallback, '`Not enough arguments`');


    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};