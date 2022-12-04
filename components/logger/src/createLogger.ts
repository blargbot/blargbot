import type { Configuration } from '@blargbot/config/Configuration.js';
import * as Sentry from '@sentry/node';
import type { ArgHookCallback, Color, PreHookCallback } from 'cat-loggr/ts.js';
import CatLoggr, { LogLevel as CatLogLevel } from 'cat-loggr/ts.js';

import type { Logger, LogLevel } from './Logger.js';

export function createLogger(config: Configuration, workerId: string): Logger {
    const logger = new CatLoggr.default({
        shardId: workerId,
        level: config.general.loglevel,
        shardLength: 6,
        levels: Object.entries(logLevels).map(([l, { color, isError, isTrace }]) => {
            const level = new CatLogLevel(l, <Color><unknown>color);
            level.err = isError ?? false;
            level.trace = isTrace ?? false;
            return level;
        })
    });

    const _logger = logger as unknown as Logger;

    if (config.sentry.base !== '')
        logger.addPreHook(createSentryPreHook(config, workerId) as unknown as ArgHookCallback);

    const setGlobal = _logger.setGlobal.bind(logger);
    _logger.setGlobal = function (...args) {
        _logger.setGlobal = setGlobal;
        const res = _logger.setGlobal(...args);

        process.on('uncaughtExceptionMonitor', ex => _logger.error('Uncaught exception', ex));
        return res;
    };

    return _logger;
}

const chalk = CatLoggr.default._chalk;
const logLevels: Record<LogLevel, { color: typeof chalk; isError?: boolean; isTrace?: boolean; sentryLevel?: Sentry.SeverityLevel; }> = {
    fatal: { color: chalk.red.bgBlack, isError: true, sentryLevel: 'fatal' },
    error: { color: chalk.black.bgRed, isError: true, sentryLevel: 'error' },
    warn: { color: chalk.black.bgYellow, isError: true, sentryLevel: 'warning' },
    website: { color: chalk.black.bgCyan },
    ws: { color: chalk.yellow.bgBlack },
    cluster: { color: chalk.black.bgMagenta },
    worker: { color: chalk.black.bgMagenta },
    command: { color: chalk.black.bgBlue },
    shardi: { color: chalk.blue.bgYellow },
    init: { color: chalk.black.bgBlue },
    info: { color: chalk.black.bgGreen },
    trace: { color: chalk.green.bgBlack, isTrace: true },
    output: { color: chalk.black.bgMagenta },
    bbtag: { color: chalk.black.bgGreen },
    adebug: { color: chalk.cyan.bgBlack },
    debug: { color: chalk.magenta.bgBlack },
    middleware: { color: chalk.magenta.bgBlack },
    log: { color: chalk.magenta.bgBlack },
    dir: { color: chalk.magenta.bgBlack },
    verbose: { color: chalk.black.bgCyan },
    database: { color: chalk.black.bgBlue },
    module: { color: chalk.black.bgBlue }
};

function createSentryPreHook(config: Configuration, workerId: string): PreHookCallback {
    Sentry.init({
        dsn: config.sentry.base,
        environment: config.general.isProd !== true ? 'development' : 'production',
        integrations: [
            new Sentry.Integrations.Http({ tracing: true })
        ],
        tracesSampleRate: config.sentry.sampleRate
    });

    Sentry.setTag('worker', workerId);
    return (...args) => sentryPreHook(...args);
}

function sentryPreHook(...[{ args, level, context, shard }]: Parameters<PreHookCallback>): null {
    const sentryLevel = level in logLevels ? logLevels[level as keyof typeof logLevels].sentryLevel : undefined;
    if (sentryLevel === undefined)
        return null;

    args = [...args as unknown[]];
    let error = args.find((v): v is Error => v instanceof Error);
    if (error === undefined) {
        error = new Error(args.splice(0, args.length).join(' '));
        // eslint-disable-next-line @typescript-eslint/unbound-method
        Error.captureStackTrace(error, CatLoggr.default.prototype._format);
        const stack = error.stack?.split('\n');
        stack?.splice(1, 1);
        error.stack = stack?.join('\n');
    } else
        args.splice(args.indexOf(error), 1);

    const _error = error;
    Sentry.withScope(scope => sendToSentry(scope, sentryLevel, _error, { ...context, shard, args }));

    return null;
}

function sendToSentry(scope: Sentry.Scope, level: Sentry.SeverityLevel, error: Error, context: object): void {
    scope.setLevel(level);
    Sentry.captureException(error, context);
}
