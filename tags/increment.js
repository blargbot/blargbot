var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `increment`;
e.args = `&lt;variable name&gt; [amount]`;
e.usage = `{increment;variable name[;amount]}`;
e.desc = `Increases the value of the specified variable by the specified amount. Defaults to 1`;
e.exampleIn = `{set;counter;0} {repeat;{increment;counter},;10}`;
e.exampleOut = `1,2,3,4,5,6,7,8,9,10`;

//@Stupid cat The idea of this is to accept a variable name and an optional amount to increment by (dafaults to 1)
//If the variable name supplied relates to an integer variable, then increment the value and re-assign it
//Then, return the new value of the counter
//To decrement, you just pass a negative number as the amount

e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        fallback = params.fallback,
        tagName = params.tagName;
    var replaceString = '';
    var replaceContent = false;
    let tagVars;
    if (!tagName) {
        tagVars = bu.guildCache[params.msg.guild.id].vars || {};
    } else {
        let storedTag = await r.table('tag').get(tagName).run();
        if (!storedTag.hasOwnProperty('vars')) tagVars = {};
        else tagVars = storedTag.vars;
    }
    let incrementBy = parseInt(args[2]);
    if (isNaN(incrementBy)){
        incrementBy = 1;
    }
    if (args.length == 2 || args.length == 3) {
        let result = tagVars[args[1]];
        if (Array.isArray(result)) {
            replaceString = await bu.tagProcessError(params, fallback, '`Cannot increment an array`');
        } else if (isNaN(parseInt(result))){
            replaceString = await bu.tagProcessError(params, fallback, '`Cannot increment a string`')
        } else {
            replaceString = parseInt(result) + incrementBy;
            tagVars[args[1]] = parseInt(result) + incrementBy;
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