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
e.name = `semi`;
e.args = ``;
e.usage = `{semi}`;
e.desc = `Will be replaced by <code>;</code> on execution.`;
e.exampleIn = `This is a semicolon! {semi}`;
e.exampleOut = `This is a semicolon! ;`;


e.execute = async function() {
    var replaceString = bu.specialCharBegin + 'SEMI' + bu.specialCharEnd;
    var replaceContent = false;


    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};