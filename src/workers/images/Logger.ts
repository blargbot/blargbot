function logLevel(level: string) {
    return function (...args: any[]) {
        process.send!({
            cmd: 'log',
            level: 'debug',
            msg: args.join(' ')
        });
    }
}

export function createLogger(process: NodeJS.Process) {
    if (!('send' in process))
        throw new Error('process must be a worker process');

    return {
        cluster: logLevel('cluster'),
        debug: logLevel('debug'),
        warn: logLevel('warn'),
        error: logLevel('error'),
        worker: logLevel('worker'),
        init: logLevel('init'),
        module: logLevel('module')
    }
}