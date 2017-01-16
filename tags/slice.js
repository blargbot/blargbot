var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.ARRAY;
};

e.requireCtx = require;

e.isTag = true;
e.name = `slice`;
e.args = `&lt;array&gt; &lt;start&gt; [end]`;
e.usage = `{slice;array;start;end}`;
e.desc = `Grabs elements between the zero-indexed start and end points (inclusive).`;
e.exampleIn = `{slice;["this", "is", "an", "array"];1}`;
e.exampleOut = `["is", "an", "array"]`;

e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let replaceContent = false;
    let replaceString;
    if (params.args.length >= 3) {
        params.args[1] = await bu.processTagInner(params, 1);
        let args = params.args;
        let deserialized = await bu.getArray(params, args[1]);
        
        if (deserialized && Array.isArray(deserialized.v)) {
            let start = parseInt(args[2]);
            let end;
            if (args[3]) end = parseInt(args[3]);
            if (isNaN(start) || (end && isNaN(end))) {
                replaceString = await bu.tagProcessError(params, '`Invalid start or end`');
            } else replaceString = bu.serializeTagArray(deserialized.v.slice(start, end));
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