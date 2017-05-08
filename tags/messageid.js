/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:03
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:50:03
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.SIMPLE;
};

e.requireCtx = require;

e.isTag = true;
e.name = `messageid`;
e.args = ``;
e.usage = `{messageid}`;
e.desc = `Returns the ID of the invoking message.`;
e.exampleIn = `The message id was {messageid}`;
e.exampleOut = `The message id was 111111111111111111`;

e.execute = async function (params) {
    var replaceString = params.msg.id;
    var replaceContent = false;

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};