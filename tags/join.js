var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.ARRAY;
};

e.requireCtx = require;

e.isTag = true;
e.name = `join`;
e.args = `&lt;array&gt; &lt;text&gt;`;
e.usage = `{join;array;text}`;
e.desc = `Joins the elements of an array together with the provided text.`;
e.exampleIn = `{join;["this", "is", "an", "array"];!}`;
e.exampleOut = `this!is!an!array`;

e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let replaceContent = false;
    let replaceString;
    if (params.args.length >= 3) {
        params.args[1] = await bu.processTagInner(params, 1);
        let args1 = params.args[1];
        let deserialized = await bu.getArray(params, args1);
        
        if (deserialized && Array.isArray(deserialized.v)) {
            replaceString = deserialized.v.join(params.args[2]);
        } else {
            replaceString = await bu.tagProcessError(params, '`Not an array`');
        }
    } else {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};