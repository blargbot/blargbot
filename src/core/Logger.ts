import '@sentry/tracing';

import * as Sentry from '@sentry/node';
import CatLoggr, { LogLevel } from 'cat-loggr/ts';
import Sequelize, { ValidationError } from 'sequelize';

export type Logger = { [P in LogLevels]: (...args: unknown[]) => void }
    & Pick<CatLoggr, 'addPreHook' | 'addPostHook' | 'addArgHook' | 'setDefaultMeta' | 'setLevel' | 'setGlobal' | 'meta'>;
type GenericLogLevel<T extends string, R extends readonly string[]> = LogLevel & { name: T; aliases?: R; sentry?: Sentry.Severity; }
type Color = typeof CatLoggr._chalk;
type LogLevels =
    | typeof logLevels[number]['name']
    | typeof logLevels[number]['aliases'][number];

export function createLogger(config: Configuration, workerId: string): Logger {
    const logger = new CatLoggr({
        shardId: workerId,
        level: config.general.loglevel,
        shardLength: 6,
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

    if (config.sentry.base !== '') {
        const sentry = new Sentry.Hub(new Sentry.NodeClient({
            dsn: config.sentry.base,
            environment: config.general.isbeta ? 'development' : 'production',
            integrations: [
                new Sentry.Integrations.Http({ tracing: true })
            ],
            tracesSampleRate: config.sentry.sampleRate
        }));

        sentry.setTag('worker', workerId);
        logger.addPreHook(logEntry => {
            const args: unknown[] = [...logEntry.args as unknown[]];
            const error = logEntry.args.find((arg): arg is Error => arg instanceof Error) ?? args.splice(0, args.length).join(' ');
            const level = logLevelMap[logEntry.level];
            if (level === undefined)
                return null;

            // eslint-disable-next-line @typescript-eslint/ban-types
            const context: object = {
                ...logEntry.context,
                shard: logEntry.shard,
                args
            };

            sentry.withScope(scope => {
                if (typeof error !== 'string') {
                    scope.setLevel(level);
                    sentry.captureException(error, context);
                } else {
                    sentry.captureMessage(error, level, context);
                }
            });
            return null;
        });
    }

    if (coerceCatLoggr(logger))
        return logger;

    throw new Error('The constructed logger doesnt match its definition!');
}

function logLevel<T extends string, R extends readonly string[]>(
    name: T,
    color: Color,
    options?: Pick<Partial<LogLevel>, 'err' | 'trace'> & {
        aliases?: R;
        sentry?: Sentry.Severity;
    }
): GenericLogLevel<T, R> {
    return {
        name,
        color: color as GenericLogLevel<T, R>['color'],
        sentry: options?.sentry,
        err: options?.err ?? false,
        trace: options?.trace ?? false,
        aliases: (options?.aliases ?? []) as unknown as string[] & R,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        setAliases: undefined!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        setColors: undefined!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        setError: undefined!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        setTrace: undefined!
    };
}

const { red, black, yellow, blue, green, cyan, magenta } = CatLoggr._chalk;

const logLevels = [
    logLevel('fatal', red.bgBlack, { err: true, sentry: Sentry.Severity.Fatal }),
    logLevel('error', black.bgRed, { err: true, sentry: Sentry.Severity.Error }),
    logLevel('warn', black.bgYellow, { err: true, sentry: Sentry.Severity.Warning }),
    logLevel('website', black.bgCyan),
    logLevel('ws', yellow.bgBlack),
    logLevel('cluster', black.bgMagenta),
    logLevel('worker', black.bgMagenta),
    logLevel('command', black.bgBlue),
    logLevel('shardi', blue.bgYellow),
    logLevel('init', black.bgBlue),
    logLevel('info', black.bgGreen),
    logLevel('trace', green.bgBlack, { trace: true }),
    logLevel('output', black.bgMagenta),
    logLevel('bbtag', black.bgGreen),
    logLevel('verbose', black.bgCyan),
    logLevel('adebug', cyan.bgBlack),
    logLevel('debug', magenta.bgBlack, { aliases: ['log', 'dir'] as const }),
    logLevel('database', black.bgBlue),
    logLevel('module', black.bgBlue)
] as const;

const logLevelMap = Object.fromEntries(logLevels.flatMap(l => [[l.name, l.sentry] as const, ...l.aliases.map(a => [a, l.sentry] as const)]));

function isSequelizeValidationError(error: unknown): error is ValidationError {
    return typeof error === 'object' && error instanceof Sequelize.ValidationError;
}

function coerceCatLoggr(logger: CatLoggr): logger is CatLoggr & Logger {
    for (const { name } of logLevels)
        if (!(name in logger) || typeof logger[name] !== 'function')
            return false;
    return true;
}
