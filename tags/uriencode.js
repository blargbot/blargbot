var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = 'uriencode';
e.args = '&lt;text&gt;';
e.usage = '{uriencode;text}';
e.desc = 'Encodes a chunk of text in URI format. Useful for constructing links.';
e.exampleIn = '​{uriencode;Hello world!}';
e.exampleOut = 'Hello%20world!';

e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    var replaceString = '';
    var replaceContent = false;
    if (params.args[1]) {
        replaceString = encodeURIComponent(params.args[1]);
    } else {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};