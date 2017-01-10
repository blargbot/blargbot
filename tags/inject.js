// START: Do not touch
var e = module.exports = {};
e.init = () => {
    e.category = bu.TagType.COMPLEX;
};
e.requireCtx = require;
e.isTag = true;
// END: Do not touch

// name of the tag (used to execute it)
e.name = 'inject';
// Note: the following information will be parsed with HTML. Keep this in mind (ex. &lt;&gt; instead of <>)
// the arguments it takes. <> for required, [] for optional
e.args = '&lt;code&gt;';
// an example of usage (for docs). ex: {template;arg 1[;optional arg]}
e.usage = '{inject;code}';
// A brief description of the tag
e.desc = 'Injects code into the tag. For example, doing {inject;{args}} will let any user execute any code. Use with caution.';
// An example of tag input
e.exampleIn = 'Random Number: {inject;{lb}randint{semi}1{semi}4{lb}}';
// An example of the previous tag's output
e.exampleOut = 'Random Number: 3';

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
        let newStuff = bu.processSpecial(params.args[1], true);
        logger.debug('Thonkang', params.args, newStuff);
        params.content = newStuff;
        replaceString = await bu.processTag(params);
    } else {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};