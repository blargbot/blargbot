var e = module.exports = {};
e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `regexreplace`;
e.args = `[toreplace] &lt;regex&gt; &lt;replacewith&gt;`;
e.usage = `{regexreplace[;textToReplace];regex;replaceWith}`;
e.desc = `Replaces the <code>regex</code> phrase with <code>replacewith</code>. If
                                <code>toreplace</code>
                                is
                                specified, the tag is replaced with the new <code>toreplace</code>. If not, it replaces
                                the
                                message.
                            `;
e.exampleIn = `I like {regexreplace;to consume;/o/gi;a} cheese. {regexreplace;/e/gi;n}`;
e.exampleOut = `I likn ta cansumn chnnsn.`;


e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        fallback = params.fallback;
    var returnObj = {
        replaceContent: false
    };

    var regexList;
    if (args.length > 3) {
        if (/^\/?.*\/.*/.test(args[2])) {
            //var
            regexList = args[2].match(/^\/?(.*)\/(.*)/);
            returnObj.replaceString = args[1].replace(new RegExp(regexList[1], regexList[2]), args[3]);
        } else {
            returnObj.replaceString = await bu.tagProcessError(params, '`Invalid regex string`');
        }
    } else if (args.length == 3) {
        if (/^\/?.*\/.*/.test(args[1])) {
            try {
                regexList = args[1].match(/^\/?(.*)\/(.*)/);
                returnObj.replace = new RegExp(regexList[1], regexList[2]);
                returnObj.replaceString = args[2];
                returnObj.replaceContent = true;
            } catch (err) {
                returnObj.replaceString = await bu.tagProcessError(params, err.message);
            }
        } else {
            returnObj.replaceString = await bu.tagProcessError(params, '`Invalid regex string`');
        }
    } else {
        returnObj.replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }

    return returnObj;
};