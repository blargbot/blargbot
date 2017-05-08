/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:49:20
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:49:20
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};
e.requireCtx = require;
e.isTag = true;
e.name = 'lang';
e.args = '&lt;language&gt;';
e.usage = '{lang;language}';
e.desc = 'Specifies the language used to display the raw contents of this tag.';
e.exampleIn = 'This will be displayed with js! {lang;js}';
e.exampleOut = 'This will be displayed with js!';
e.execute = async function (params) {
    var replaceString = '';
    var replaceContent = false;
    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};