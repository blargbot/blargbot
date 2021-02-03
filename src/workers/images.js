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

    const handler = imageProcessor.generators[msg.command];
    if (!(handler instanceof ImageGenerator))
        return;

    try {
        await submitBuffer(msg.code, await handler.execute(msg));
    } catch (err) {
        logger.error(err.stack);
        await submitBuffer(msg.code, '');
    }
});

async function submitBuffer(code, buffer) {
    logger.worker('Finished, submitting as base64');
    process.send({
        cmd: 'img',
        code: code,
        buffer: typeof buffer === 'string' ? buffer : buffer.toString('base64')
    });
}