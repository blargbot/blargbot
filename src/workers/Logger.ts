import CatLoggr, { LogLevel } from 'cat-loggr/ts';
import Sequelize, { ValidationError } from 'sequelize';

export function createLogger(config: Configuration, clusterId: string) {
    const logger = new CatLoggr({
        shardId: clusterId,
        level: config.general.loglevel ?? 'info',
        shardLength: 6,
        levels: [
            logLevel('fatal', CatLoggr._chalk.red.bgBlack, { err: true }),
            logLevel('error', CatLoggr._chalk.black.bgRed, { err: true }),
            logLevel('warn', CatLoggr._chalk.black.bgYellow, { err: true }),
            logLevel('trace', CatLoggr._chalk.green.bgBlack, { trace: true }),
            logLevel('website', CatLoggr._chalk.black.bgCyan),
            logLevel('ws', CatLoggr._chalk.yellow.bgBlack),
            logLevel('cluster', CatLoggr._chalk.black.bgMagenta),
            logLevel('worker', CatLoggr._chalk.black.bgMagenta),
            logLevel('command', CatLoggr._chalk.black.bgBlue),
            logLevel('irc', CatLoggr._chalk.yellow.bgBlack),
            logLevel('shardi', CatLoggr._chalk.blue.bgYellow),
            logLevel('init', CatLoggr._chalk.black.bgBlue),
            logLevel('info', CatLoggr._chalk.black.bgGreen),
            logLevel('output', CatLoggr._chalk.black.bgMagenta),
            logLevel('bbtag', CatLoggr._chalk.black.bgGreen),
            logLevel('verbose', CatLoggr._chalk.black.bgCyan),
            logLevel('adebug', CatLoggr._chalk.cyan.bgBlack),
            logLevel('debug', CatLoggr._chalk.magenta.bgBlack, { aliases: ['log', 'dir'] }),
            logLevel('database', CatLoggr._chalk.black.bgBlue),
            logLevel('module', CatLoggr._chalk.black.bgBlue)
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

function logLevel(name: string, color: typeof CatLoggr._chalk, options?: Omit<Partial<LogLevel>, 'color' | 'name'>): LogLevel {
    return {
        name,
        color: <any>color,
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