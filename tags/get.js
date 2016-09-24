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
e.name = `get`;
e.args = `&lt;name&gt;`;
e.usage = `{get;name}`;
e.desc = `Returns a stored variable. Variables are unique per-tag.`;
e.exampleIn = `{get;testvar}`;
e.exampleOut = `This is a test var`;


e.execute = (msg, args, fallback, words, author, tagName) => {
    var replaceString = '';
    var replaceContent = false;

    if (!bu.vars[tagName]) {
        bu.vars[tagName] = {};
    }
    if (args.length > 1) {
        replaceString = bu.vars[tagName][args[1]] || 0;
    } else {
        replaceString = bu.tagProcessError(fallback, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};