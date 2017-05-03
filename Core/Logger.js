const LogLevels = {};

const Colours = {
    RED: 'red',
    YELLOW: 'yellow',
    GREEN: 'green',
    CYAN: 'cyan',
    BLUE: 'blue',
    MAGENTA: 'magenta',
    GREY: 'grey',
    BOLD: 'bold'
};

const LogColours = {
    timestamp: Colours.GREY,
    shard: Colours.YELLOW
};

const Levels = [{ name: 'error', color: Colours.RED },
{ name: 'warn', color: Colours.YELLOW },
{ name: 'init', color: Colours.GREEN },
{ name: 'info', color: Colours.GREEN },
{ name: 'output', color: Colours.MAGENTA },
{ name: 'verbose', color: Colours.CYAN },
{ name: 'database', color: Colours.BLUE },
{ name: 'debug', color: Colours.GREY },
{ name: 'adebug', color: Colours.CYAN }];

var maxLength = 0;

for (let i = 0; i < Levels.length; i++) {
    if (maxLength < Levels[i].name.length) maxLength = Levels[i].name.length;
    LogLevels[Levels[i].name] = i;
    LogColours[Levels[i].name] = Levels[i].color;
}

class Logger extends _dep.Winston.Logger {
    constructor() {
        super({
            exitOnError: false,
            levels: LogLevels,
            colors: LogColours
        });
        this.setLevels(LogLevels);
        this.master = process.env.SHARD_ID == -1;
        this.colorize = _dep.wconfig.colorize;
        this.add(_dep.Winston.transports.Console, {
            name: 'general',
            stderrLevels: ['error', 'warn'],
            silent: false,
            handleExceptions: true,
            prettyPrint: true,
            timestamp: function () {
                return `[${_dep.moment().tz('Canada/Mountain').format('MM/DD HH:mm:ss')}]`;
            },
            formatter: function (options) {
                let output = '';
                output += this.colorize('shard', pad(this.master ? '[M]' : `[${process.env.SHARD_ID}]`, 4));
                output += this.colorize('timestamp', options.timestamp());
                output += this.colorize(options.level, pad(`[${options.level.toUpperCase()}]`, maxLength + 2));
                output += ' ';
                if (options.level == 'error' && options.meta && options.meta.stack) {
                    if (Array.isArray(options.meta.stack))
                        output += options.meta.stack.join('\n');
                    else
                        output += options.meta.stack;
                } else {
                    output += options.message || '';

                    if (options.meta && Object.keys(options.meta).length > 0) {
                        output += '\n' + _dep.util.inspect(options.meta, { depth: 4 });
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
}

module.exports = Logger;