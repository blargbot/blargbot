import CatLoggr, { LogLevel } from 'cat-loggr/ts';
import Chalk from 'chalk';
import Sequelize, { ValidationError } from 'sequelize';

export function createLogger(config: Configuration, clusterId: string) {
    const logger = new CatLoggr({
        shardId: clusterId,
        level: config.general.loglevel ?? 'info',
        shardLength: 6,
        levels: [
            logLevel('fatal', Chalk.red.bgBlack, { err: true }),
            logLevel('error', Chalk.black.bgRed, { err: true }),
            logLevel('warn', Chalk.black.bgYellow, { err: true }),
            logLevel('trace', Chalk.green.bgBlack, { trace: true }),
            logLevel('website', Chalk.black.bgCyan),
            logLevel('ws', Chalk.yellow.bgBlack),
            logLevel('cluster', Chalk.black.bgMagenta),
            logLevel('worker', Chalk.black.bgMagenta),
            logLevel('command', Chalk.black.bgBlue),
            logLevel('irc', Chalk.yellow.bgBlack),
            logLevel('shardi', Chalk.blue.bgYellow),
            logLevel('init', Chalk.black.bgBlue),
            logLevel('info', Chalk.black.bgGreen),
            logLevel('output', Chalk.black.bgMagenta),
            logLevel('bbtag', Chalk.black.bgGreen),
            logLevel('verbose', Chalk.black.bgCyan),
            logLevel('adebug', Chalk.cyan.bgBlack),
            logLevel('debug', Chalk.magenta.bgBlack, { aliases: ['log', 'dir'] }),
            logLevel('database', Chalk.black.bgBlue),
            logLevel('module', Chalk.black.bgBlue)
        ]
    });

    logger.addArgHook(({ arg }) => {
        if (isSequelizeValidationError(arg) && Array.isArray(arg.errors)) {
            let text: string[] = [arg.stack || ''];
            for (const err of arg.errors) {
                text.push(`\n - ${err.message}\n   - ${err.path} ${err.value}`);
            }
            return text.join('');
        }
        return null;
    });

    return logger;
}

function logLevel(name: string, color: typeof Chalk, options?: Omit<Partial<LogLevel>, 'color' | 'name'>): LogLevel {
    return {
        name,
        color: color,
        aliases: options?.aliases!,
        err: options?.err!,
        trace: options?.trace!,
        position: options?.position,
        colors: options?.colors,
        setAliases: options?.setAliases!,
        setColors: options?.setColors!,
        setError: options?.setError!,
        setTrace: options?.setTrace!
    }
}

function isSequelizeValidationError(error: any): error is ValidationError {
    return typeof error === "object" && error instanceof Sequelize.ValidationError;
}