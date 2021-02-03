/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:38:19
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-04-26 20:09:03
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const { ImageProcessor, ImageGenerator } = require('../images/index');

const logger = {
    cluster: function (msg) {
        process.send({
            cmd: 'log',
            level: 'cluster',
            msg
        });
    },
    debug: function (msg) {
        process.send({
            cmd: 'log',
            level: 'debug',
            msg
        });
    },
    warn: function (msg) {
        process.send({
            cmd: 'log',
            level: 'warn',
            msg
        });
    },
    error: function (msg) {
        process.send({
            cmd: 'log',
            level: 'error',
            msg
        });
    },
    worker: function (msg) {
        process.send({
            cmd: 'log',
            level: 'worker',
            msg
        });
    }
};

const imageProcessor = new ImageProcessor(logger);

if (process.execArgv[0])
    process.execArgv[0] = process.execArgv[0].replace('-brk', '');

process.on('unhandledRejection', (reason, p) => {
    logger.error('Unhandled Promise Rejection: ' + reason.stack);
});

process.on('message', async function (msg) {
    // console.worker(`Worker ${cluster.worker.id} got a message!\n${util.inspect(msg)}`);
    if (msg.cmd !== 'img')
        return;

    let buffer = await imageProcessor.execute(msg.command, msg);
    logger.worker('Finished, submitting as base64');
    process.send({
        cmd: 'img',
        code: msg.code,
        buffer: buffer.toString('base64')
    });
});