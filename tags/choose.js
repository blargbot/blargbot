var e = module.exports = {};

e.init = () => {
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


e.execute = async function(params) {
    // for (let i = 1; i < params.args.length; i++) {
    //     params.args[i] =await bu.processTagInner(params, i);
    // }
    if (params.args[1]) {
        params.args[1] = await bu.processTagInner(params, 1);
    }
    let args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;

    if (args.length > 2) {
        replaceString = args[parseInt(args[1]) + 2];
        if (!replaceString) {
            replaceString = args[2];
        }
        params.content = replaceString;
        replaceString = await bu.processTag(params);
    } else
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};