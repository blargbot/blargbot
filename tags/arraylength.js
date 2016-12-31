var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `arraylength`;
e.args = `&lt;array&gt;`;
e.usage = `{arraylength;array}`;
e.desc = `Gets the length of the array.`;
e.exampleIn = `{arraylength;["this", "is", "an", "array"]}`;
e.exampleOut = `4`;

e.execute = async function(params) {
    let replaceContent = false;
    let replaceString;
    if (params.args.length >= 2) {
        params.args[1] = await bu.processTagInner(params, 1);
        let args1 = params.args[1];
        let deserialized = bu.deserializeTagArray(args1);
        
        if (deserialized && Array.isArray(deserialized.v)) {
            replaceString = deserialized.v.length;
        } else {
            replaceString = await bu.tagProcessError(params, params.fallback, '`Not an array`');
        }
    } else {
        replaceString = await bu.tagProcessError(params, params.fallback, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};