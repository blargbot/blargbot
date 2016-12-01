// START: Do not touch
var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};
e.requireCtx = require;
e.isTag = true;
// END: Do not touch

// name of the tag (used to execute it)
e.name = 'exec';
// Note: the following information will be parsed with HTML. Keep this in mind (ex. &lt;&gt; instead of <>)
// the arguments it takes. <> for required, [] for optional
e.args = '&lt;code&gt; [user input]';
// an example of usage (for docs). ex: {template;arg 1[;optional arg]}
e.usage = '{exec;tag[;input]}';
// A brief description of the tag
e.desc = 'Executes another tag. Useful for modules.';
// An example of tag input
e.exampleIn = 'Let me do a tag for you. {exec;f}';
// An example of the previous tag's output
e.exampleOut = 'Let me do a tag for you. User#1111 has paid their respects. Total respects given: 5';

/**
 * The execution function of the tag.
 * @params - the parameter object
 * @params.msg - the message object that executed the tag
 * @params.args - an array of the arguments that were provided by the tag
 * @params.fallback - the fallback message to output if a tag fails
 * @params.words - an array of the arguments that the tag executor provided
 * @params.author - the creator of the tag
 * @params.tagName - the name of the tag
 * 
 * Returns an object
 * @return.replaceString String - the string that will be used to replace the tag
 * @return.replaceContent Boolean - if true, will replace the entire content rather than just the tag (within scope)
 * @return.fallback? String - if provided, will change the fallback
 */
e.execute = async function(params) {
    // processes any nested tags in the `args` array. if your tag uses advanced logic, you may wish to reimplement this
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    var replaceString = '';
    var replaceContent = false;
    if (params.args[1]) {
        let tag = await r.table('tag').get(params.args[1]).run();
        if (!tag) {
            replaceString = await bu.tagProcessError(params, params.fallback, '`Tag not found`');
        } else {
            if (tag.content.toLowerCase().indexOf('{nsfw}') > -1) {
                let nsfwChan = await bu.isNsfwChannel(params.msg.channel.id);
                if (!nsfwChan) {
                    replaceString = await bu.tagProcessError(params, params.fallback, '`NSFW tag');
                    return {
                        replaceString: replaceString,
                        replaceContent: false
                    };
                }
            }
            r.table('tag').get(tag.name).update({
                uses: tag.uses + 1
            }).run();
            let tagArgs;
            if (params.args[2]) {
                tagArgs = params.args[2];
            } else {
                tagArgs = '';
            }
            tagArgs = bu.splitInput(tagArgs);
            replaceString = await bu.processTag(params.msg, tagArgs, tag.content, params.fallback, params.author, params.tagName);

        }
    } else {
        replaceString = await bu.tagProcessError(params, params.fallback, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};