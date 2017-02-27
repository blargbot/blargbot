var e = module.exports = {};

const levels = {
    killme: 0,
    error: 1,
    warn: 2,
    command: 3,
    init: 4,
    irc: 5,
    website: 6,
    cluster: 7,
    worker: 8,
    music: 9,
    shard: 10,
    ws: 11,
    info: 12,
    output: 13,
    verbose: 14,
    debug: 15,
    silly: 16
};

const colors = {
    error: 'red',
    killme: 'red',
    warn: 'yellow',
    info: 'green',
    verbose: 'cyan',
    debug: 'grey',
    silly: 'magenta',
    command: 'blue',
    website: 'cyan',
    music: 'cyan',
    init: 'green',
    output: 'magenta',
    cluster: 'magenta',
    worker: 'magenta',
    irc: 'yellow',
    shard: 'yellow',
    ws: 'yellow',
    timestamp: 'grey',
    bold: 'bold'
};

var debug;

e.init = () => {
    try {
        debug = config.general.isbeta;
    } catch (err) {
        debug = false;
    }
    var maxLength = 0;
    for (let key in levels) {
        if (key.length > maxLength) {
            maxLength = key.length;
        }
    }
    var logger = e.logger = new(dep.winston.Logger)({
        levels: levels,
        colors: colors,
        level: 'debug',
        exitOnError: false,
        transports: [
            new(dep.winston.transports.Console)({
                prettyPrint: true,
                colorize: true,
                name: 'general',
                silent: false,
                handleExceptions: true,
                stderrLevels: ['error', 'warn'],
                timestamp: () => {
                    return `[${dep.moment().tz('Canada/Mountain').format('MM/DD HH:mm:ss')}]`;
                },
                formatter: options => {
                    // Return string will be passed to logger.

                    if (options.level == 'shard') {
                        let message = options.message.split(' ');
                        let level = pad('[' + options.level.toUpperCase() + message[0] + ']', maxLength + 2);
                        message = message.slice(1).join(' ');
                        return dep.wconfig.colorize('timestamp', options.timestamp()) + dep.wconfig.colorize(options.level, level) + ' ' +
                            (options.level == 'error' && options.meta && options.meta.stack ? (options.meta.stack.join ? options.meta.stack.join('\n') : options.meta.stack) : (undefined !== message ? message : '') +
                                (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta, null, 2) : ''));
                    }
                    return dep.wconfig.colorize('timestamp', options.timestamp()) + dep.wconfig.colorize(options.level, pad('[' + options.level.toUpperCase() + ']', maxLength + 2)) + ' ' +
                        (options.level == 'error' && options.meta && options.meta.stack ? options.meta.message + ': ' + (options.meta.stack.join ? options.meta.stack.join('\n') : options.meta.stack) : (undefined !== options.message ? options.message : '') +
                            (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta, null, 2) : ''));
                }
            }),
            new(dep.winston.transports.File)({
                name: 'file-general',
                filename: dep.path.join(__dirname, 'logs', 'generallogs.log'),
                maxsize: 10000000,
                prettyPrint: true,
                colorize: true,
                json: false,
                silent: false,
                handleExceptions: true,
                timestamp: () => {
                    return `[${dep.moment().tz('Canada/Mountain').format('MM/DD HH:mm:ss')}]`;
                },
                formatter: options => {
                    // Return string will be passed to logger.
                    return options.timestamp() + '[' + options.level.toUpperCase() + '] ' +
                        (options.level == 'error' && options.meta && options.meta.stack ?
                            (options.meta.stack.join ? options.meta.stack.join('\n') : options.meta.stack) :
                            (undefined !== options.message ? options.message : '') +
                            (options.meta && Object.keys(options.meta).length ?
                                '\n\t' + JSON.stringify(options.meta, null, 2) : ''));
                }
            }),
            new(dep.winston.transports.File)({
                name: 'file-error',
                filename: dep.path.join(__dirname, 'logs', 'errorlogs.log'),
                maxsize: 10000000,
                prettyPrint: true,
                colorize: true,
                level: 'error',
                silent: false,
                json: false,
                handleExceptions: true,
                timestamp: () => {
                    return `[${dep.moment().tz('Canada/Mountain').format('MM/DD HH:mm:ss')}]`;
                },
                formatter: options => {
                    // Return string will be passed to logger.
                    return options.timestamp() +
                        (options.level == 'error' && options.meta && options.meta.stack ?
                            (options.meta.stack.join ? options.meta.stack.join('\n') : options.meta.stack) :
                            (undefined !== options.message ? options.message : '') +
                            (options.meta && Object.keys(options.meta).length ?
                                '\n\t' + JSON.stringify(options.meta, null, 2) : ''));
                }
            })
        ]
    });
    logger.level = debug ? 'debug' : 'info';

    logger.toggleDebug = function() {
        logger.level = debug ? 'info' : 'debug';
        debug = !debug;
        return debug;
    };
    global.logger = logger;
    return logger;
};

function pad(value, length) {
    return (value.toString().length < length) ? pad(' ' + value, length) : value;
};

e.init();
global.logger = this;