// START: Do not touch
var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};
e.requireCtx = require;
e.isTag = true;
// END: Do not touch

// name of the tag (used to execute it)
e.name = 'lang';
// Note: the following information will be parsed with HTML. Keep this in mind (ex. &lt;&gt; instead of <>)
// the arguments it takes. <> for required, [] for optional
e.args = '&lt;language&gt;';
// an example of usage (for docs). ex: {template;arg 1[;optional arg]}
e.usage = '{lang;language}';
// A brief description of the tag
e.desc = 'Specifies the language used to display the raw contents of this tag.';
// An example of tag input
e.exampleIn = 'This will be displayed with js! {lang;js}';
// An example of the previous tag's output
e.exampleOut = 'This will be displayed with js!';

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
e.execute = async function() {
    var replaceString = '';
    var replaceContent = false;
    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};