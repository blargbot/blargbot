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
e.name = '';
e.args = '';
e.usage = '';
e.desc = '';
e.exampleIn = '';
e.exampleOut = '';


e.execute = (msg, args, fallback) => {
    var replaceString = '';
    var replaceContent = false;


    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};