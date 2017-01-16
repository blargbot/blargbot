var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.ARRAY;
};

e.requireCtx = require;

e.isTag = true;
e.name = `isarray`;
e.args = `&lt;text&gt;`;
e.usage = `{isarray;text}`;
e.desc = `Determines whether the provided text is a valid array.`;
e.exampleIn = `{isarray;["array?"]} {isarray;array?}`;
e.exampleOut = `true false`;


e.execute = async function(params) {
    let replaceContent = false;
    let replaceString;
    if (params.args.length >= 2) {
        params.args[1] = await bu.processTagInner(params, 1);
        let args1 = params.args[1];
        let deserialized = bu.deserializeTagArray(args1);
        
        if (deserialized && Array.isArray(deserialized.v)) {
            replaceString = 'true';
        } else {
            replaceString = 'false';
        }
    } else {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};