import { } from '@sentry/node'; // TODO add sentry
import CatLoggr, { LogLevel } from 'cat-loggr/ts';
import Sequelize, { ValidationError } from 'sequelize';

export type Logger = { [P in LogLevels]: (...args: unknown[]) => void }
    & Pick<CatLoggr, 'addPreHook' | 'addPostHook' | 'addArgHook' | 'setDefaultMeta' | 'setLevel' | 'setGlobal' | 'meta'>;
type GenericLogLevel<T extends string, R extends readonly string[] | undefined> = LogLevel & { name: T; aliases?: R; }
type Color = typeof CatLoggr._chalk;
type LogLevels =
    | typeof logLevels[number]['name']
    | typeof logLevels[number]['aliases'][number];

export function createLogger(config: Configuration, workerId: string): Logger {
    const logger = new CatLoggr({
        shardId: workerId,
        level: config.general.loglevel,
        shardLength: 12,
        levels: [...logLevels]
    });

    logger.addArgHook(({ arg }) => {
        if (isSequelizeValidationError(arg) && Array.isArray(arg.errors)) {
            const text: string[] = [arg.stack ?? ''];
            for (const err of arg.errors) {
                text.push(`\n - ${err.message}\n   - ${err.path ?? 'UNKNOWN PATH'} ${err.value ?? 'UNKNOWN VALUE'}`);
            }
            return text.join('');
        }
        return null;
    });

    if (coerceCatLoggr(logger))
        return logger;

    throw new Error('The constructed logger doesnt match its definition!');
}

function logLevel<T extends string, R extends readonly string[] | undefined = []>(
    name: T,
    color: Color,
    options?: Omit<Partial<LogLevel>, 'color' | 'name' | 'aliases'> & { aliases?: R; }
): GenericLogLevel<T, R> {
    const level = {
        ...options,
        name,
        color
    };
    if (coreceLogLevel(level))
        return level;

    throw new Error('errr this shouldnt have happened ever. The type check should just return true always');
}

const logLevels = [
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
    logLevel('debug', CatLoggr._chalk.magenta.bgBlack, { aliases: ['log', 'dir'] as ['log', 'dir'] }),
    logLevel('database', CatLoggr._chalk.black.bgBlue),
    logLevel('module', CatLoggr._chalk.black.bgBlue)
] as const;

function isSequelizeValidationError(error: unknown): error is ValidationError {
    return typeof error === 'object' && error instanceof Sequelize.ValidationError;
}

function coreceLogLevel<T extends string, R extends readonly string[] | undefined>(
    _value: Omit<Partial<LogLevel>, 'color' | 'aliases' | 'name'> & { name: T; color: Color; aliases?: R; }
): _value is GenericLogLevel<T, R> {
    return true;
}

function coerceCatLoggr(logger: CatLoggr): logger is CatLoggr & Logger {
    for (const { name } of logLevels)
        if (!(name in logger) || typeof logger[name] !== 'function')
            return false;
    return true;
}
