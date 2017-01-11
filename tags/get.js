var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `get`;
e.args = `&lt;name&gt; [index]`;
e.usage = `{get;name[;index]}`;
e.desc = `Returns a stored variable, or an index in a stored array. Variables are unique per-tag.`;
e.exampleIn = `{get;testvar}`;
e.exampleOut = `This is a test var`;

e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        fallback = params.fallback,
        tagName = params.tagName;
    var replaceString = '';
    var replaceContent = false;
    let result = await e.getVar(params, args[1]);
    if (args.length == 2) {
        if (Array.isArray(result)) {
            replaceString = bu.serializeTagArray(result, args[1]);
        } else
            replaceString = result;
    } else if (args.length > 2) {
        if (Array.isArray(result)) {
            let index = parseInt(args[2]);
            if (isNaN(index)) {
                replaceString = await bu.tagProcessError(params, '`Invalid index`');
            } else {
                if (!result[index]) {
                    replaceString = await bu.tagProcessError(params, '`Undefined index`');
                } else
                    replaceString = result[index];
            }
        } else
            replaceString = result;
    } else {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};

e.getVar = async function(params, varName) {
    let vars = {};
    let subVarName = varName.substring(1);
    let prefix = varName.substring(0, 1);
    let type;
    switch (prefix) {
        case '_': // local to guild
            if (params.ccommand) { //custom command
                vars = await bu.getVariable(params.msg.guild.id, subVarName, bu.TagVariableType.GUILD);
            } else { //guild variable in tag
                vars = await bu.getVariable(params.msg.guild.id, subVarName, bu.TagVariableType.TAGGUILD);
            }
            break;
        case '@': // local to author
            if (params.author)
                vars = await bu.getVariable(params.author, subVarName, bu.TagVariableType.AUTHOR);
            else return await bu.tagProcessError(params, '`No author found`');
            break;
        case '*': // global
            vars = await bu.getVariable(undefined, subVarName, bu.TagVariableType.GLOBAL);
            break;
        default: // local to tag
            if (params.ccommand) { // custom command
                vars = await bu.getVariable(params.tagName, varName, bu.TagVariableType.GUILDLOCAL, params.msg.guild.id);
            } else { // normal tag
                vars = await bu.getVariable(params.tagName, varName, bu.TagVariableType.LOCAL);
            }
            break;
    }
    return vars;
};