var e = module.exports = {};





e.init = () => {



    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `aset`;
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
    if (!storedAuthor.hasOwnProperty('var')) storedAuthor.vars = {};
    let authorVars = storedAuthor.vars;

    if (args.length > 2) {
        authorVars[args[1]] = args[2];
        await saveUser(author, authorVars);
    } else if (args.length == 2) {
        authorVars[args[1]] = null;
        await saveUser(author, authorVars);
    } else {
        replaceString = await bu.tagProcessError(params, fallback, '`Not enough arguments`');
    }

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