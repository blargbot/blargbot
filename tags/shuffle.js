var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.array = true;
e.name = `shuffle`;
e.args = `[array]`;
e.usage = `{shuffle[;array]}`;
e.desc = `Shuffles the args the user provided, or the provided array.`;
e.exampleIn = `{shuffle} {args;0} {args;1} {args;2}`;
e.exampleOut = `Input: <code>one two three</code><br>Output: <code>three one two</code>`;


e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let words = params.words;
    var replaceString = '';
    var replaceContent = false;
    let args = params.args;
    if (params.args[1]) {
        let deserialized = bu.deserializeTagArray(args[1]);

        if (deserialized && Array.isArray(deserialized.v)) {
            bu.shuffle(deserialized.v);
            if (deserialized.n) {
                await bu.setArray(deserialized, params);
            } else replaceString = bu.serializeTagArray(deserialized.v)
        } else {
        replaceString = await bu.tagProcessError(params, '`Not an array`');
        }
    } else
        bu.shuffle(words);
    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};