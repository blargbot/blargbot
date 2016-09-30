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
e.name = 'capitalize';
e.args = '&lt;text&gt; [lower]';
e.usage = '{capitalize;text;lower}';
e.desc = 'Capitalizes the first letter of <code>text</code>. If <code>lower</code> is specified the rest of the text will be lowercase';
e.exampleIn = '{capitalize;hello world!}';
e.exampleOut = 'Hello world!';

e.execute = (params) => {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = bu.processTagInner(params, i);
    }
    var replaceString = '';
    var replaceContent = false;
    if (params.args[1]) {
        if (params.args[2]) {
            replaceString = params.args[1][0].toUpperCase() + params.args[1].substr(1).toLowerCase();
        } else {
            replaceString = params.args[1][0].toUpperCase() + params.args[1].substr(1);
        }
    } else {
        replaceString = bu.tagProcessError(params.fallback, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};
