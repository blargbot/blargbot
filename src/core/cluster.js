/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:28:09
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-03-29 12:55:45
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */
if (process.execArgv[0])
    process.execArgv[0] = process.execArgv[0].replace('-brk', '');

const cluster = require('cluster');
const util = require('util');
const reload = require('require-reload')(require);

const numCPUs = 1;

module.exports = cluster;

if (cluster.isMaster) {
    const Collection = dep.Eris.Collection;
    global.workers = new Collection(cluster.Worker);

    var i = 0;

    cluster.send = function (message) {
        if (!(i >= 0 && i < Object.keys(cluster.workers).length)) {
            i = 0;
        }
        console.cluster(`Sending a message to worker ${Object.keys(cluster.workers)[i]}`);
        let res = cluster.workers[Object.keys(cluster.workers)[i]].send(message);
        i++;
        return res;
    };

    cluster.reset = function () {
        reload('./worker.js');
        for (const worker of workers) {
            worker[1].kill(0);
        }
    };

    cluster.setupMaster({
        exec: 'src/core/worker.js',
        silent: false
    });

    cluster.on('message', (worker, msg, handle) => {
        switch (msg.cmd) {
            case 'log':
                console[msg.level]('[IMAGE]', msg.msg);
                break;
            case 'img':
                console.cluster('base64 received, sending to the EE');
                bu.emitter.emit(msg.code, Buffer.from(msg.buffer, 'base64'));
                break;
            default:
                console.cluster(`Worker ${worker.process.pid} says:\n${util.inspect(msg)}`);
                break;
        }
    });

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('online', function (worker) {
        workers.add(worker);
        console.cluster('Worker ' + worker.process.pid + ' is online');
    });

    cluster.on('exit', function (worker, code, signal) {
        workers.remove(worker);
        console.cluster('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
        cluster.fork();
    });

}