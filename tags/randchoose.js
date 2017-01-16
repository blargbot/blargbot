var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.array = true;
e.name = `randchoose`;
e.args = `&lt;choices...&gt;`;
e.usage = `{randchoose;choices...}`;
e.desc = `Chooses a random choice`;
e.exampleIn = `I feel like eating {randchoose;cake;pie;pudding} today.`;
e.exampleOut = `I feel like eating pudding today.`;


e.execute = async function(params) {
    let args = params.args,
        fallback = params.fallback;
    var replaceString = '';
    var replaceContent = false;
    if (args.length > 1) {
        let deserialized = await bu.getArray(params, args[1]);
        if (deserialized && Array.isArray(deserialized.v)) {
            let seed = bu.getRandomInt(1, deserialized.v.length);
            replaceString = deserialized.v[seed];
        } else {
            let seed = bu.getRandomInt(1, args.length - 1);
            replaceString = await bu.processTagInner(params, seed);
        }
    } else {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};