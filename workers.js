const util = require('util');
module.exports = cluster = require('cluster');

const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
    const Collection = require('eris').Collection;
    global.workers = new Collection(cluster.Worker); 

    cluster.setupMaster({
        exec: 'workers.js',
        silent: false
    });

    cluster.on('message', (worker, message, handle) => {
        logger.cluster(`Worker ${worker.process.pid} says:\n${util.inspect(message)}`);
    });

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('online', function(worker) {
        workers.add(worker);
        logger.cluster('Worker ' + worker.process.pid + ' is online');
    });

    cluster.on('exit', function(worker, code, signal) {
        workers.remove(worker);
        logger.cluster('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
        logger.cluster('Starting a new worker');
        cluster.fork();
    });

} else {

    console.log('Im alive!');
    process.send(`Worker ${process.pid} is alive!`);
    process.on('message', (message, handle) => {
        logger.cluster(`Worker ${process.pid} got a message!\n${util.inspect(message)}`);
        process.send('Thanks for the message!');
    });
}