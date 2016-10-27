var e = module.exports = {};





e.init = () => {
    
    

    e.category = bu.TagType.SIMPLE;
};

e.requireCtx = require;

e.isTag = true;
e.name = `nsfw`;
e.args = ``;
e.usage = `{nsfw}`;
e.desc = `Marks the message is being NSFW, and only to be outputted in NSFW channels. A requirement for any tag with NSFW content.`;
e.exampleIn = `This command is not safe! {nsfw}`;
e.exampleOut = `This command is not safe!`;


e.execute = async function() {
    
    var replaceString = '';
    var replaceContent = false;


    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};