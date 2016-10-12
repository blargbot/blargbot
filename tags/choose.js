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
e.name = `choose`;
e.args = `&lt;choice&gt; &lt;choices...&gt;`;
e.usage = `{choose;choice;choices...}`;
e.desc = `Chooses from the given options, where <code>choice</code> is the index of the option
                                selected
                            `;
e.exampleIn = `I feel like eating {choose;1;cake;pie;pudding} today.`;
e.exampleOut = `I feel like eating pie today.`;


e.execute = async((params) => {
    // for (let i = 1; i < params.args.length; i++) {
    //     params.args[i] =await(bu.processTagInner(params, i);
    // }
    if (params.args[1]) {
        params.args[1] = await(bu.processTagInner(params, 1));
    }
    let args = params.args
        , fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;

    if (args.length > 2) {
        replaceString = args[parseInt(args[1]) + 2];
        if (!replaceString) {
            replaceString = args[2];
        }
        replaceString = await(bu.processTag(params.msg
            , params.words
            , replaceString
            , params.fallback
            , params.author
            , params.tagName));
    } else
        replaceString = bu.tagProcessError(fallback, '`Not enough arguments`');

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
});