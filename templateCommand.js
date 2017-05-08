/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:34:20
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:34:20
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};
e.init = () => {
    e.category = bu.CommandType.GENERAL;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = '';
e.info = '';
e.longinfo = '<p></p>';

e.execute = async function(msg, words, text) {

};