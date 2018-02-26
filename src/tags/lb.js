/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:49:26
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:49:26
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.SIMPLE;
};

e.requireCtx = require;

e.isTag = true;
e.name = 'lb';
e.args = '';
e.usage = '{lb}';
e.desc = 'Will be replaced by `{` on execution.';
e.exampleIn = 'This is a bracket! {lb}';
e.exampleOut = 'This is a bracket! {';


e.execute = async function(params) {

    var replaceString = bu.specialCharBegin + 'LB' + bu.specialCharEnd;
    var replaceContent = false;


    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};