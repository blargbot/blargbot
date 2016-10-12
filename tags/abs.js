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
e.name = `abs`;
e.args = `&lt;number&gt;`;
e.usage = `{abs;number}`;
e.desc = `Gets the absolute value of a number`;
e.exampleIn = `{abs;-535}`;
e.exampleOut = `535`;


e.execute = async((params) => {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await(bu.processTagInner(params, i));
    }
    let args = params.args
        , fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;
    for (let i = 0; i < args.length; i++) {

    }
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
});