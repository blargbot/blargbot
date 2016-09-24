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
e.name = `replace`;
e.args = `[toreplace] &lt;phrase&gt; &lt;replacewith&gt;`;
e.usage = `{replace[;textToReplace];phrase;replaceWith}`;
e.desc = `Replaces the <code>phrase</code> with <code>replacewith</code>. If
                                <code>toreplace</code> is
                                specified,
                                the tag is replaced with the new <code>toreplace</code>. If not, it replaces the
                                message.
                            `;
e.exampleIn = `I like {replace;to eat;eat;nom} cheese. {replace;cheese;ham}`;
e.exampleOut = `I like to nom ham`;


e.execute = (msg, args, fallback) => {
    var returnObj = { replaceContent: false }
    if (args.length > 3) {

        returnObj.replaceString = args[1].replace(args[2], args[3]);
    } else if (args.length == 3) {
        returnObj.replaceString = args[2];
        returnObj.replaceContent = true;
        returnObj.replace = args[1];
    } else {
        returnObj.replaceString = bu.tagProcessError(fallback, '`Not enough arguments`');
    }
    return returnObj;
};