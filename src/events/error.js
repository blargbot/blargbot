/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:21:07
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:21:07
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const error = true;

bot.on('error', function (err, id) {
    if (error && err.message.indexOf('Message.guild') == -1)
        logger.error(`[${id}] ${err.stack}`);
});