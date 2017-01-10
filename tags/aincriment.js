var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `aincrement`;
e.args = `&lt;variable name&gt; [amount]`;
e.usage = `{aincrement;variable name[;amount]}`;
e.desc = `Increases the value of the specified variable by the specified amount. Defaults to 1. Variables are unique per author`;
e.exampleIn = `{aset;counter;0} {repeat;{aincrement;counter},;10}`;
e.exampleOut = `1,2,3,4,5,6,7,8,9,10`;

//Same idea here as in increment, except it applies to author vars

e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    var replaceString = '';
    var replaceContent = false;
    let storedAuthor = await r.table('user').get(params.author);
    if (!storedAuthor) {
        return {
            replaceString: await bu.tagProcessError(params, params.fallback, '`Author not found`'),
            replaceContent
        }
    }
    let args = params.args, fallback = params.fallback;
    let authorVars = storedAuthor.vars || {};
    let incrementBy = parseInt(args[2]);
    if (isNaN(incrementBy)){
        incrementBy = 1;
    }
    if (args.length == 2 || args.length == 3) {
        let result = authorVars[args[1]];
        if (Array.isArray(result)) {
            replaceString = await bu.tagProcessError(params, fallback, '`Cannot increment an array`');
        } else if (isNaN(parseInt(result))){
            replaceString = await bu.tagProcessError(params, fallback, '`Cannot increment a string`')
        } else {
            replaceString = parseInt(result) + incrementBy;
            authorVars[args[1]] = parseInt(result) + incrementBy;
        }
    } else if (args.length < 2) {
        replaceString = await bu.tagProcessError(params, fallback, '`Not enough arguments`');
    } else {
        replaceString = await bu.tagProcessError(params, fallback, '`Too many arguments`');
    }
    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};