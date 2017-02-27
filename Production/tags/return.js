var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.SIMPLE;
};

e.requireCtx = require;

e.isTag = true;
e.name = `return`;
e.args = ``;
e.usage = `{return}`;
e.desc = `Stops execution of the tag and returns what has been parsed.`;
e.exampleIn = `This will display. {return} This will not.`;
e.exampleOut = `This will display.`;


e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    var replaceString = '';
    var replaceContent = false;


    return {
        replaceString: replaceString,
        replaceContent: replaceContent,
        terminate: true
    };
};