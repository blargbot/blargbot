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
e.name = `set`;
e.args = `&lt;name&gt; &lt;value&gt;`;
e.usage = `{set;name;value}`;
e.desc = `Stores a variable. These variables are saved between sessions, and are unique per-tag.`;
e.exampleIn = `{set;testvar;This is a test var}`;
e.exampleOut = ``;


e.execute = (msg, args, fallback, words, author, tagName) => {
    var replaceString = '';
    var replaceContent = false;

    if (!bu.vars[tagName]) {
        bu.vars[tagName] = {};
    }
    if (args.length > 2) {
        bu.vars[tagName][args[1]] = args[2];
        bu.emitter.emit('saveVars');
    }
    else if (args.length == 2) {
        delete bu.vars[tagName][args[1]];
        bu.emitter.emit('saveVars');
    } else {
        replaceString = bu.tagProcessError(fallback, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};