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
e.name = `fallback`;
e.args = `&lt;message&gt;`;
e.usage = `{fallback;message}`;
e.desc = `Should any tag fail to parse, it will be replaced with the fallback message instead of
                                an
                                error
                            `;
e.exampleIn = `{fallback;This tag failed} {randint}`;
e.exampleOut = `This tag failed`;


e.execute = (msg, args, fallback) => {
    var replaceString = '';
    var replaceContent = false;
    if (args[1])
        fallback = args[1];

    return {
        replaceString: replaceString,
        replaceContent: replaceContent,
        fallback: fallback
    };
};