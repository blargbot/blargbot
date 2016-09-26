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
e.name = `aget`;
e.args = `&lt;name&gt;`;
e.usage = `{aget;name}`;
e.desc = `Returns a stored variable. Variables are unique per-author.`;
e.exampleIn = `{aget;testvar}`;
e.exampleOut = `This is a test var`;


e.execute = (msg, args, fallback, words, author) => {
    var replaceString = '';
    var replaceContent = false;

    if (!bu.vars[author]) {
        bu.vars[author] = {};
    }
    if (args.length > 1) {
        replaceString = bu.vars[author][args[1]] || 0;
    } else {
        replaceString = bu.tagProcessError(fallback, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};