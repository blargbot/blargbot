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
e.desc = `Will be replaced by <code>{</code> on execution.`;
e.exampleIn = `This is a bracket! {lb}`;
e.exampleOut = `This is a bracket! {`;


e.execute = () => {
    
    var replaceString = bu.specialCharBegin + 'LB' + bu.specialCharEnd;
    var replaceContent = false;


    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};