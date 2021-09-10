import { guard } from '@cluster/utils';
import Sentry from '@sentry/node';
import CatLoggr, { ArgHookCallback, Color, LogLevel as CatLogLevel, PreHookCallback } from 'cat-loggr/ts';
import { black, blue, cyan, green, magenta, red, yellow } from 'chalk';
import { ValidationError } from 'sequelize';

import { Configuration } from './Configuration';

export type LoggerMethods = { [P in LogTypes]: (...args: unknown[]) => void; }

export interface Logger extends CatLoggr, LoggerMethods {
}

type LogLevels = typeof logLevels[number];
type LogTypes =
    | LogLevels['name']
    | Extract<LogLevels, { aliases: unknown; }>['aliases'][number];

export function createLogger(config: Configuration, workerId: string): Logger {
    const logger = new CatLoggr({
        shardId: workerId,
        level: config.general.loglevel,
        shardLength: 6,
        levels: logLevels.map(l => {
            const level = new CatLogLevel(l.name, <Color><unknown>l.color);
            if ('aliases' in l)
                level.aliases = [...l.aliases];
            if ('isError' in l)
                level.err = l.isError;
            if ('isTrace' in l)
                level.trace = l.isTrace;
            return level;
        })
    });

    logger.addArgHook(sequelizeErrorArgHook);
    if (config.sentry.base !== '')
        logger.addPreHook(createSentryPreHook(config, workerId));

    return <Logger>logger;
}

const logLevels = [
    { name: 'fatal', color: red.bgBlack, isError: true },
    { name: 'error', color: black.bgRed, isError: true },
    { name: 'warn', color: black.bgYellow, isError: true },
    { name: 'website', color: black.bgCyan },
    { name: 'ws', color: yellow.bgBlack },
    { name: 'cluster', color: black.bgMagenta },
    { name: 'worker', color: black.bgMagenta },
    { name: 'command', color: black.bgBlue },
    { name: 'shardi', color: blue.bgYellow },
    { name: 'init', color: black.bgBlue },
    { name: 'info', color: black.bgGreen },
    { name: 'trace', color: green.bgBlack, isTrace: true },
    { name: 'output', color: black.bgMagenta },
    { name: 'bbtag', color: black.bgGreen },
    { name: 'verbose', color: black.bgCyan },
    { name: 'adebug', color: cyan.bgBlack },
    { name: 'debug', color: magenta.bgBlack, aliases: ['log', 'dir'] as const },
    { name: 'database', color: black.bgBlue },
    { name: 'module', color: black.bgBlue }
] as const;

function sequelizeErrorArgHook(...[{ arg }]: Parameters<ArgHookCallback>): string | null {
    if (!isSequelizeValidationError(arg) || !Array.isArray(arg.errors))
        return null;

    const text = arg.errors.map(err => `\n - ${err.message}\n   - ${err.path ?? 'UNKNOWN PATH'} ${err.value ?? 'UNKNOWN VALUE'}`);
    return `${arg.stack ?? ''}${text.join('')}`;
}

function createSentryPreHook(config: Configuration, workerId: string): PreHookCallback {
    const sentry = new Sentry.Hub(new Sentry.NodeClient({
        dsn: config.sentry.base,
        environment: config.general.isbeta ? 'development' : 'production',
        integrations: [
            new Sentry.Integrations.Http({ tracing: true })
        ],
        tracesSampleRate: config.sentry.sampleRate
    }));

    sentry.setTag('worker', workerId);
    return (...args) => sentryPreHook(sentry, ...args);
}

function sentryPreHook(sentry: Sentry.Hub, ...[{ error: isError, args, level, context, shard }]: Parameters<PreHookCallback>): null {
    if (!isError)
        return null;

    args = [...args as unknown[]];
    const error = args.find(guard.instanceOf(Error))
        ?? args.splice(0, args.length).join(' ');

    sentry.withScope(scope => sendToSentry(sentry, scope, <Sentry.Severity>level, error, {
        ...context,
        shard: shard,
        args
    }));

    return null;
}

// eslint-disable-next-line @typescript-eslint/ban-types
function sendToSentry(sentry: Sentry.Hub, scope: Sentry.Scope, level: Sentry.Severity, error: string | Error, context: object): void {
    if (typeof error !== 'string') {
        scope.setLevel(level);
        sentry.captureException(error, context);
    } else {
        sentry.captureMessage(error, level, context);
    }
}

function isSequelizeValidationError(error: unknown): error is ValidationError {
    return typeof error === 'object' && error instanceof ValidationError;
}
