@@ -1, 15 + 0, 0 @@
/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:21:03
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-12-06 10:45:43
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const debug = false;

bot.on('debug', function (message, id) {
    if (debug)
        console.debug(message);
});
No newline at end of file
