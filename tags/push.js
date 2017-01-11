var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.ARRAY;
};

e.requireCtx = require;

e.isTag = true;
e.name = `push`;
e.args = `&lt;array&gt; &lt;values&gt;...`;
e.usage = `{push;array;values...}`;
e.desc = `Pushes values into an array. If used with {get} or {aget}, this will update the original variable. Otherwise, it will simply output the new array.`;
e.exampleIn = `{push;["this", "is", "an"];array}`;
e.exampleOut = `["this","is","an","array"]`;

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
            let toPush = params.args.slice(2);
            for (const val of toPush)
                deserialized.v.push(val);
            if (deserialized.n) {
                await bu.setArray(deserialized, params);
            } else replaceString = bu.serializeTagArray(deserialized.v);
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