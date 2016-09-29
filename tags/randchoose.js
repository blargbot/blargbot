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
e.name = `randchoose`;
e.args = `&lt;choices...&gt;`;
e.usage = `{randchoose;choices...}`;
e.desc = `Chooses a random choice`;
e.exampleIn = `I feel like eating {randchoose;cake;pie;pudding} today.`;
e.exampleOut = `I feel like eating pudding today.`;


e.execute = (params) => {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = bu.processTagInner(params, i);
    }
    let args = params.args
        , fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;
    if (args.length > 1) {
        //    console.log(util.inspect(args))
        replaceString = args[bu.getRandomInt(1, args.length - 1)];
    } else {
        replaceString = bu.tagProcessError(fallback, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};