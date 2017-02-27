const Tag = require('../structure/Tag');

class TemplateTag extends Tag {
    constructor() {
        super({
            // args - an array of arguments for the tag. 
            // Will result in args: <requiredInput> [optionalInput] <repeatedInput>...
            //               usage: {name;requiredInput[;optionalInput];repeatedInput...} 
            args: [{
                name: 'requiredInput'
            }, {
                name: 'optionalInput',
                optional: true
            }, {
                name: 'repeatedInput',
                repeat: true
            }],
            // name - the name of the tag. defaults to the lowercase classname
            name: 'template',
            // desc - the description of the tag.
            desc: 'A template tag',
            // exampleIn - an example for usage
            exampleIn: 'This is an template tag: {template}',
            // exampleOut - the result of exampleIn
            exampleOut: 'This is a template tag:',
            // array - whether it's array compatible or not
            array: false,
            // category - the type of the tag. Defaults to COMPLEX
            category: bu.TagType.COMPLEX
        });

    }

    async execute(params) {
        let result = super.execute();
        /* result is an object containing the following: {
            terminate: whether or not to terminate execution,
            replaceString: what to replace the tag with,
            replaceContent: whether to replace the actual content of the message rather than just the tag
        } */

        return result; // you must return the result object 
    }
}