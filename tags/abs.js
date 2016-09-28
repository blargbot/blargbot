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
e.name = `abs`;
e.args = `&lt;number&gt;`;
e.usage = `{abs;number}`;
e.desc = `Gets the absolute value of a number`;
e.exampleIn = `{abs;-535}`;
e.exampleOut = `535`;


e.execute = (msg, args, fallback) => {
    var replaceString = '';
    var replaceContent = false;
    if (args[1]) {
        var asNumber = parseFloat(args[1]);
        if (!isNaN(asNumber)) {
            replaceString = Math.abs(asNumber);
        } else {
        replaceString = bu.tagProcessError(fallback, '`Not a number`');
        }
    } else {
        replaceString = bu.tagProcessError(fallback, '`Not enough arguments`');
    }
    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};