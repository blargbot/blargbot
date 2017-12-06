/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:28:09
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-12-06 09:32:51
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */
if (process.execArgv[0])
    process.execArgv[0] = process.execArgv[0].replace('-brk', '');

const cluster = dep.cluster;
module.exports = cluster;

const reload = dep.reload;

const numCPUs = Math.min(dep.os.cpus().length, 2);

if (cluster.isMaster) {
    const Collection = dep.Eris.Collection;
    global.workers = new Collection(cluster.Worker);

    var i = 0;

    cluster.send = function (message) {
        if (!(i >= 0 && i < Object.keys(cluster.workers).length)) {
            i = 0;
        }
        logger.cluster(`Sending a message to worker ${Object.keys(cluster.workers)[i]}`);
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
                logger.log(msg.level, msg.msg);
                break;
            case 'img':
                logger.cluster('base64 received, sending to the EE');
                bu.emitter.emit(msg.code, Buffer.from(msg.buffer, 'base64'));
                break;
            default:
                logger.cluster(`Worker ${worker.process.pid} says:\n${dep.util.inspect(msg)}`);
                break;
        }
    });

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('online', function (worker) {
        workers.add(worker);
        logger.cluster('Worker ' + worker.process.pid + ' is online');
    });

    cluster.on('exit', function (worker, code, signal) {
        workers.remove(worker);
        logger.cluster('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
        cluster.fork();
    });

}