const chalk = require('chalk');
const moment = require('moment-timezone');
const util = require('util');

class Logger {
    constructor(shardId, level) {
        this.shard = shardId;
        if (typeof this.shard === 'string') this.shard = 'MS';
        else if (this.shard < 10) this.shard = '0' + this.shard;
        this._level = level;
        this.levels = {};
        let max = 0;
        this._levels = [
            { name: 'fatal', color: chalk.red.bgBlack, err: true },
            { name: 'error', color: chalk.black.bgRed, err: true },
            { name: 'warn', color: chalk.black.bgYellow, err: true },
            { name: 'trace', color: chalk.green.bgBlack, trace: true },
            { name: 'init', color: chalk.black.bgBlue },
            { name: 'info', color: chalk.black.bgGreen },
            { name: 'output', color: chalk.black.bgMagenta },
            { name: 'verbose', color: chalk.black.bgCyan },
            { name: 'adebug', color: chalk.cyan.bgBlack },
            { name: 'debug', color: chalk.magenta.bgBlack, alias: ['log', 'dir'] },
            { name: 'database', color: chalk.black.bgBlue }
        ];
        this._levels = this._levels.map(l => {
            l.position = this._levels.indexOf(l);
            this.levels[l.name] = l;
            let func = function (...args) {
                return this.format(l, ...args);
            }.bind(this);
            this[l.name] = func;
            if (l.alias && Array.isArray(l.alias))
                for (const alias of l.alias) this[alias] = func;
            max = l.name.length > max ? l.name.length : max;
            return l;
        });

        this.maxLength = max + 2;

        this._meta = {};
    }

    get level() {
        return this.levels[this._level];
    }

    setGlobal() {
        Object.defineProperty.bind(this)(global, 'console', {
            get: () => {
                return this;
            }
        });
        return this;
    }

    get timestamp() {
        return chalk.black.bgWhite(` ${moment().tz('Canada/Mountain').format('MM/DD HH:mm:ss')} `);
    }

    centrePad(text, length) {
        return ' '.repeat(Math.floor((length - text.length) / 2))
            + text + ' '.repeat(Math.ceil((length - text.length) / 2));
    }

    write(text, err = false) {
        let stream = err ? process.stderr : process.stdout;
        let shard = `${this.shard}`;
        let shardText = chalk.black.bold.bgYellow(this.centrePad(shard, 4, false));
        stream.write(`${shardText}${this.timestamp}${text}\n`);
        return this;
    }

    meta(meta = { depth: 3, color: true }) {
        this._meta = meta;
        return this;
    }

    format(level, ...args) {
        if (level.position > this.level.position) return;
        let output = level.color(this.centrePad(level.name, this.maxLength)) + ' ';
        let text = [];
        for (const arg of args) {
            if (typeof arg === 'string') {
                text.push(chalk.magenta(this._meta.quote ? `'${arg}'` : arg));
            } else if (typeof arg === 'number') {
                text.push(chalk.cyan(arg));
            } else if (typeof arg === 'object') {
                text.push('\n');
                if (arg instanceof Error) {
                    text.push(chalk.red(arg.stack));
                } else {
                    text.push(util.inspect(arg, this._meta));
                }
            } else text.push(arg);
        }
        if (level.trace) {
            text.push(new Error().stack);
        }
        output += text.join(' ');
        if (level.err) output = chalk.red(output);
        return this.write(output, level.err).meta();
    }
}
/*
class Logger extends Winston.Logger {
    constructor() {
        super({
            exitOnError: false,
            levels: LogLevels,
            colors: LogColours
        });
        this.setLevels(LogLevels);
        this.master = process.env.SHARD_ID == -1;
        this.colorize = wconfig.colorize;
        this.add(Winston.transports.Console, {
            name: 'general',
            stderrLevels: ['error', 'warn'],
            silent: false,
            handleExceptions: true,
            prettyPrint: true,
            timestamp: function () {
                return `[${moment().tz('Canada/Mountain').format('MM/DD HH:mm:ss')}]`;
            },
            formatter: function (options) {
                let output = '';
                output += this.colorize('shard', pad(this.master ? '[M]' : `[${process.env.SHARD_ID}]`, 4));
                output += this.colorize('timestamp', options.timestamp());
                output += this.colorize(options.level, pad(`[${options.level.toUpperCase()}]`, maxLength + 2));
                output += ' ';
                if (options.level == 'error' && options.meta && options.meta.stack) {
                    output += options.meta.message ? options.meta.message + '\n' : '';
                    if (Array.isArray(options.meta.stack))
                        output += options.meta.stack.join('\n');
                    else
                        output += options.meta.stack;
                } else {
                    output += options.message || '';
                    console.log(options.message);
                    if (options.meta && Object.keys(options.meta).length > 0) {
                        output += '\n' + util.inspect(options.meta, { depth: 4 });
                    }
                }
                return output;
            }.bind(this)
        });

        this.level = 'debug';
    }
}

function pad(value, length) {
    return ' '.repeat(length - value.length) + value;
}*/

module.exports = Logger;