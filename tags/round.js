var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `round`;
e.args = `&lt;number&gt;`;
e.usage = `{round;number}`;
e.desc = `Rounds a number up or down.`;
e.exampleIn = `{round;1.23}`;
e.exampleOut = `1`;


e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;
    if (args[1]) {
        var asNumber = parseFloat(args[1]);
        if (!isNaN(asNumber)) {
            replaceString = Math.round(asNumber);
        } else {
            replaceString = await bu.tagProcessError(params, '`Not a number`');
        }
    } else {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }
    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};