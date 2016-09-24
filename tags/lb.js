var e = module.exports = {};
var bu;

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.TagType.SIMPLE;
};

e.requireCtx = require;

e.isTag = true;
e.name = `lb`;
e.args = ``;
e.usage = `{lb}`;
e.desc = `Will be replaced by <code>{</code> on execution. <code>%LB%</code> works too.`;
e.exampleIn = `This is a bracket! {lb}`;
e.exampleOut = `This is a bracket! {`;


e.execute = (msg, args, fallback) => {
    var replaceString = '%LB%';
    var replaceContent = false;


    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};