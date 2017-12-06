/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:30:45
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:30:45
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = '//';
e.args = 'Anything';
e.usage = '{//;This is a comment.}';
e.desc = 'A tag that just gets removed. Useful for documenting your code.';
e.exampleIn = 'This is a sentence. {//;This is a comment.}';
e.exampleOut = 'This is a sentence.';

e.execute = async function(params) {
    var replaceString = '';
    var replaceContent = false;

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};