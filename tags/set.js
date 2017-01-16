var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.array = true;

e.name = `set`;
e.args = `&lt;name&gt; &lt;value&gt; [value]...`;
e.usage = `{set;name;value[;value]...}`;
e.desc = `Stores a variable. These variables are saved between sessions, and are unique per-tag. If used in a custom command, they are unique per-guild. If multiple values are specified, an array is created.`;
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
    let value;

    if (args.length == 3) {
        let deserialized = bu.deserializeTagArray(args[2]);
        if (deserialized && deserialized.v) {
            value = deserialized.v;
        } else value = args[2];
    } else if (args.length > 3) {
        value = args.slice(2);
    } else if (args.length == 2) {
        value = null;
    } else {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }
    if (value !== undefined) {
        await e.setVar(params, args[1], value);
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};

e.setVar = async function(params, varName, value) {
    let vars = {};
    let subVarName = varName.substring(1);
    let prefix = varName.substring(0, 1);
    let type;
    switch (prefix) {
        case '_': // local to guild
            if (params.ccommand) { //custom command
                await bu.setVariable(params.msg.guild.id, subVarName, value, bu.TagVariableType.GUILD);
            } else { //guild variable in tag
                await bu.setVariable(params.msg.guild.id, subVarName, value, bu.TagVariableType.TAGGUILD);
            }
            break;
        case '@': // local to author
            if (params.author)
                await bu.setVariable(params.author, subVarName, value, bu.TagVariableType.AUTHOR);
            else return await bu.tagProcessError(params, '`No author found`');
            break;
        case '*': // global
            await bu.setVariable(undefined, subVarName, value, bu.TagVariableType.GLOBAL);
            break;
        default: // local to tag
            if (params.ccommand) { // custom command
                await bu.setVariable(params.tagName, varName, value, bu.TagVariableType.GUILDLOCAL, params.msg.guild.id);
            } else { // normal tag
                await bu.setVariable(params.tagName, varName, value, bu.TagVariableType.LOCAL);
            }
            break;
    }
};