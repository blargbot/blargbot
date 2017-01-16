var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `lower`;
e.args = `&lt;string&gt;`;
e.usage = `{lower}`;
e.desc = `Returns <code>string</code> as lowercase`;
e.exampleIn = `{lower;THIS WILL BECOME LOWERCASE}`;
e.exampleOut = `this will become lowercase`;


e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;
    if (args.length > 1)
        replaceString = args[1].toLowerCase();
    else
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');


    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};