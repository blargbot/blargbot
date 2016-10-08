var e = module.exports = {};
const winston = require('winston');
const moment = require('moment-timezone');
const config = require('winston/lib/winston/config');

e.init = () => {
    var logger = e.logger = new (winston.Logger)({
        levels: {
            uncaughterror: 0,
            error: 1,
            warn: 2,
            command: 3,
            init: 4,
            output: 5,
            irc: 6,
            info: 7,
            music: 8,
            verbose: 9,
            debug: 10,
            silly: 11
        },
        colors: {
            error: 'red',
            uncaughterror: 'red',
            warn: 'yellow',
            info: 'green',
            verbose: 'cyan',
            debug: 'blue',
            silly: 'magenta',
            command: 'blue',
            music: 'cyan',
            init: 'green',
            output: 'magenta',
            irc: 'yellow',
            timestamp: 'grey',
            bold: 'bold'
        },
        level: 'debug',
        exitOnError: false,
        transports: [
            new (winston.transports.Console)({
                prettyPrint: true,
                colorize: true,
                name: 'general',
                silent: false,
                handleExceptions: true,
                timestamp: () => {
                    return `[${moment().tz('Canada/Mountain').format('MM/DD HH:mm:ss')}]`;
                },
                formatter: options => {
                    // Return string will be passed to logger.
                    return config.colorize('timestamp', options.timestamp()) + config.colorize(options.level, '[' + options.level.toUpperCase() + '] ')
                        + (options.level == 'error' && options.meta && options.meta.stack ? (options.meta.stack.join ? options.meta.stack.join('\n') : options.meta.stack) : (undefined !== options.message ? options.message : '') +
                            (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta, null, 2) : ''));
                }
            })
        ]
    });

    return logger;
};