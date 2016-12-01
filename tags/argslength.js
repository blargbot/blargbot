var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.SIMPLE;
};

e.requireCtx = require;

e.isTag = true;
e.name = 'argslength';
e.args = '';
e.usage = '{argslength}';
e.desc = 'Return the number of arguments the user provided.';
e.exampleIn = 'You said {argslength} words.';
e.exampleOut = 'Input: <code>I am saying things.</code><br>Output: <code>You said 4 words.</code>';


e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let words = params.words;
    var replaceString = '';
    var replaceContent = false;
    var length = words.length;
    if (length == 1 && words[0] == '') {
        length = 0;
    }
    replaceString = length;

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};