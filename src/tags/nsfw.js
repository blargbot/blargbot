/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:20
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:50:20
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

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


e.execute = async function(params) {

    var replaceString = '';
    var replaceContent = false;


    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};