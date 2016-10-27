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
    let args = params.args
        , fallback = params.fallback
        , author = params.author;
    var replaceString = '';
    var replaceContent = false;
    if (!bu.vars.authorTags[author]) {
        bu.vars.authorTags[author] = {};
    }
    if (args.length > 2) {
        bu.vars.authorTags[author][args[1]] = args[2];
        bu.emitter.emit('saveVars');

    }
    else if (args.length == 2) {
        delete bu.vars.authorTags[author][args[1]];
        bu.emitter.emit('saveVars');

    } else {
        replaceString = await bu.tagProcessError(params, fallback, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};