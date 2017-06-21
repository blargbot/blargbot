const chalk = require('chalk');
const moment = require('moment-timezone');
const util = require('util');
const seqErrors = require('sequelize/lib/errors');

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
            { name: 'info', color: chalk.black.bgGreen },
            { name: 'init', color: chalk.black.bgBlue },
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

    meta(meta = {}) {
        let temp = { depth: 3, color: true };
        Object.assign(temp, meta);
        this._meta = temp;
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

                    if (arg instanceof seqErrors.ValidationError) {
                        for (const err of arg.errors) {
                            text.push('\n');
                            text.push(chalk.red(err));
                        }
                    }
                } else {
                    text.push(util.inspect(arg, this._meta));
                }
            } else text.push(arg);
        }

        output += text.join(' ');
        if (level.trace || this._meta.trace) {
            output += '\n' + new Error().stack.split('\n').slice(1).join('\n');
        }
        if (level.err) output = chalk.red(output);
        return this.write(output, level.err).meta();
    }
}

module.exports = Logger;