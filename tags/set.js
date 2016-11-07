var e = module.exports = {};





e.init = () => {



    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `set`;
e.args = `&lt;name&gt; &lt;value&gt;`;
e.usage = `{set;name;value}`;
e.desc = `Stores a variable. These variables are saved between sessions, and are unique per-tag.`;
e.exampleIn = `{set;testvar;This is a test var}`;
e.exampleOut = ``;


e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        fallback = params.fallback,
        tagName = params.tagName;
    var replaceString = '';
    var replaceContent = false;
    let storedTag = await r.table('tag').get(tagName).run();
    if (!storedTag.hasOwnProperty('vars')) storedTag.vars = {};
    let tagVars = storedTag.vars;

    if (args.length > 2) {
        tagVars[args[1]] = args[2];
        saveTag(tagName, tagVars);
    } else if (args.length == 2) {
        tagVars[args[1]] = null;
        saveTag(tagName, tagVars);
    } else {
        replaceString = await bu.tagProcessError(params, fallback, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};

async function saveTag(tagName, vars) {
    await r.table('tag').get(tagName).update({
        vars: vars
    }).run();
}