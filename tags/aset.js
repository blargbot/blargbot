var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `aset`;
e.deprecated = true;
e.array = true;
e.args = `&lt;name&gt; &lt;value&gt;`;
e.usage = `{aset;name;value}`;
e.desc = `Stores a variable. These variables are saved between sessions, and are unique per-author.`;
e.exampleIn = `{aset;testvar;This is a test var}`;
e.exampleOut = ``;


e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        fallback = params.fallback,
        author = params.author;
    var replaceString = '';
    var replaceContent = false;
    let storedAuthor = await r.table('user').get(author).run();
    if (!storedAuthor) {
        return {
            replaceString: await bu.tagProcessError(params, '`Author not found`'),
            replaceContent
        }
    }
    if (!storedAuthor.hasOwnProperty('var')) storedAuthor.vars = {};
    let authorVars = storedAuthor.vars;

    if (args.length == 3) {
        let deserialized = bu.deserializeTagArray(args[2]);
        if (deserialized && deserialized.v) {
            authorVars[args[1]] = deserialized.v;
        } else authorVars[args[1]] = args[2];
    } else if (args.length > 3) {
        authorVars[args[1]] = args.slice(2);
    } else if (args.length == 2) {
        authorVars[args[1]] = null;
    } else {
        x
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }
    await saveUser(author, authorVars);

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};

async function saveUser(author, vars) {
    await r.table('user').get(author).update({
        vars: vars
    }).run();
}