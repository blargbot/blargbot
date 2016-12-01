var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `shuffle`;
e.args = ``;
e.usage = `{shuffle}`;
e.desc = `Shuffles the args the user provided.`;
e.exampleIn = `{shuffle} {args;0} {args;1} {args;2}`;
e.exampleOut = `Input: <code>one two three</code><br>Output: <code>three one two</code>`;


e.execute = async function(params) {
    let words = params.words;
    var replaceString = '';
    var replaceContent = false;

    words = bu.shuffle(words);
    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};