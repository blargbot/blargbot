var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = 'substring';
e.args = '&lt;text&gt; &lt;start&gt; [end]';
e.usage = '{substring;text;start[;end]}';
e.desc = 'Returns a chunk of text between the start and end indexes. If end is not specified, it assumes the length of the text.';
e.exampleIn = 'Hello {substring;world;2;3}!';
e.exampleOut = 'Hello r!';

e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    var replaceString = '';
    var replaceContent = false;
    let parsedFallback = parseInt(params.fallback);
    if (params.args.length >= 3) {
        if (!params.args[3]) {
            params.args[3] = params.args[1].length;
        }
        var start = parseInt(params.args[2]);
        if (isNaN(start)) {
            if (isNaN(parsedFallback)) {
                return {
                    replaceString: await bu.tagProcessError(params, '`Not a number`'),
                    replaceContent: replaceContent
                };
            } else {
                start = parsedFallback;
            }
        }
        var end = parseInt(params.args[3]);
        if (isNaN(end)) {
            if (isNaN(parsedFallback)) {
                return {
                    replaceString: await bu.tagProcessError(params, '`Not a number`'),
                    replaceContent: replaceContent
                };
            } else {
                end = parsedFallback;
            }
        }
        replaceString = params.args[1].substring(start, end);
    } else {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};