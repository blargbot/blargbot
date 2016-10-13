var e = module.exports = {};
var bu;
const async = require('asyncawait/async');
const await = require('asyncawait/await');

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = '//';
e.args = 'Anything';
e.usage = '{//;This is a comment.}';
e.desc = 'A tag that just gets removed. Useful for documenting your code.';
e.exampleIn = 'This is a sentence. {//;This is a comment.}';
e.exampleOut = 'This is a sentence.';


e.execute = async(() => {
    var replaceString = '';
    var replaceContent = false;


    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
});