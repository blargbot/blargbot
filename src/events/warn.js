/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:23:47
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-12-06 10:45:36
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const warn = true;

bot.on('warn', function (message, id) {
    if (warn)
        console.warn(message);
});