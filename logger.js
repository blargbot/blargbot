var e = module.exports = {};
const winston = require('winston');
const moment = require('moment-timezone');
const path = require('path');
const config = require('winston/lib/winston/config');

const levels = {
    killme: 0,
    error: 1,
    warn: 2,
    command: 3,
    init: 4,
    output: 5,
    irc: 6,
    info: 7,
    website: 8,
    music: 9,
    verbose: 10,
    debug: 12,
    silly: 12
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
    irc: 'yellow',
    timestamp: 'grey',
    bold: 'bold'
};

e.init = () => {
    var maxLength = 0;
    for (let key in levels) {
        if (key.length > maxLength) {
            maxLength = key.length;
        }
    }
    var logger = e.logger = new (winston.Logger)({
        levels: levels,
        colors: colors,
        level: 'debug',
        exitOnError: false,
        transports: [
            new (winston.transports.Console)({
                prettyPrint: true,
                colorize: true,
                name: 'general',
                silent: false,
                handleExceptions: true,
                stderrLevels: ['error', 'warn'],
                timestamp: () => {
                    return `[${moment().tz('Canada/Mountain').format('MM/DD HH:mm:ss')}]`;
                },
                formatter: options => {
                    // Return string will be passed to logger.
                    return config.colorize('timestamp', options.timestamp()) + config.colorize(options.level, pad('[' + options.level.toUpperCase() + ']', maxLength + 2)) + ' '
                        + (options.level == 'error' && options.meta && options.meta.stack ? (options.meta.stack.join ? options.meta.stack.join('\n') : options.meta.stack) : (undefined !== options.message ? options.message : '') +
                            (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta, null, 2) : ''));
                }
            }),
            new (winston.transports.File)({
                name: 'file-general',
                filename: path.join(__dirname, 'logs', 'generallogs.log'),
                maxsize: 10000000,
                prettyPrint: true,
                colorize: true,
                json: false,
                silent: false,
                handleExceptions: true,
                timestamp: () => {
                    return `[${moment().tz('Canada/Mountain').format('MM/DD HH:mm:ss')}]`;
                },
                formatter: options => {
                    // Return string will be passed to logger.
                    return options.timestamp() + '[' + options.level.toUpperCase() + '] '
                        + (options.level == 'error' && options.meta && options.meta.stack
                            ? (options.meta.stack.join ? options.meta.stack.join('\n') : options.meta.stack)
                            : (undefined !== options.message ? options.message : '') +
                            (options.meta && Object.keys(options.meta).length
                                ? '\n\t' + JSON.stringify(options.meta, null, 2) : ''));
                }
            }),
            new (winston.transports.File)({
                name: 'file-error',
                filename: path.join(__dirname, 'logs', 'errorlogs.log'),
                maxsize: 10000000,
                prettyPrint: true,
                colorize: true,
                level: 'error',
                silent: false,
                handleExceptions: true,
                timestamp: () => {
                    return `[${moment().tz('Canada/Mountain').format('MM/DD HH:mm:ss')}]`;
                },
                formatter: options => {
                    // Return string will be passed to logger.
                    return options.timestamp() + '[' + options.level.toUpperCase() + '] '
                        + (options.level == 'error' && options.meta && options.meta.stack
                            ? (options.meta.stack.join ? options.meta.stack.join('\n') : options.meta.stack)
                            : (undefined !== options.message ? options.message : '') +
                            (options.meta && Object.keys(options.meta).length
                                ? '\n\t' + JSON.stringify(options.meta, null, 2) : ''));
                }
            })
        ]
    });
    global.logger = logger;
    return logger;
};


function pad(value, length) {
    return (value.toString().length < length) ? pad(' ' + value, length) : value;
};