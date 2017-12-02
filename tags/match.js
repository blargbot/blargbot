var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.ARRAY;
};

e.requireCtx = require;

e.isTag = true;
e.name = `match`;
e.args = `&lt;text&gt; &lt;regex&gt;`;
e.usage = `{match;text;regex}`;
e.desc = `Returns an array of everything in <code>text</code> that matches <code>regex</code>.`;
e.exampleIn = `{match;I have $1 and 25 cents;/\\d+/g/}`;
e.exampleOut = `["1", "25"]`;

e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let words = params.words;
    var replaceString = '';
    var replaceContent = false;
    let args = params.args;
    if (args.length >= 2) {
        let regex = bu.createRegExp(args[2]);
        let array = args[1].match(regex);
        replaceString = bu.serializeTagArray(array);
    } else {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }
    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};
