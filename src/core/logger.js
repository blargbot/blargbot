const CatLoggr = require('cat-loggr');
const seqErrors = require('sequelize/lib/errors');
const Sentry = require("@sentry/node");
// or use es6 import statements
// import * as Sentry from '@sentry/node';

const Tracing = require("@sentry/tracing");
// or use es6 import statements
// import * as Tracing from '@sentry/tracing';

const config = require('../../config.json');

if (config.sentryURL) {
    Sentry.init({
        dsn: config.sentryURL,
        environment: config.isbeta ? 'development' : 'production',
        integrations: [
            // enable HTTP calls tracing
            new Sentry.Integrations.Http({ tracing: true })
        ],

        // Set tracesSampleRate to 1.0 to capture 100%
        // of transactions for performance monitoring.
        // We recommend adjusting this value in production
        tracesSampleRate: 1.0
    });

    Sentry.setContext('cluster', {
        clusterId: process.env.CLUSTER_ID || 'master'
    });
}

const loggr = new CatLoggr({
    shardId: process.env.CLUSTER_ID || 'MS',
    level: config.general.isbeta ? 'debug' : 'info',
    shardLength: 4,
    levels: [
        { name: 'fatal', color: CatLoggr._chalk.red.bgBlack, err: true },
        { name: 'error', color: CatLoggr._chalk.black.bgRed, err: true },
        { name: 'warn', color: CatLoggr._chalk.black.bgYellow, err: true },
        { name: 'trace', color: CatLoggr._chalk.green.bgBlack, trace: true },
        { name: 'website', color: CatLoggr._chalk.black.bgCyan },
        { name: 'ws', color: CatLoggr._chalk.yellow.bgBlack },
        { name: 'cluster', color: CatLoggr._chalk.black.bgMagenta },
        { name: 'worker', color: CatLoggr._chalk.black.bgMagenta },
        { name: 'command', color: CatLoggr._chalk.black.bgBlue },
        { name: 'irc', color: CatLoggr._chalk.yellow.bgBlack },
        { name: 'shardi', color: CatLoggr._chalk.blue.bgYellow },
        { name: 'init', color: CatLoggr._chalk.black.bgBlue },
        { name: 'info', color: CatLoggr._chalk.black.bgGreen },
        { name: 'output', color: CatLoggr._chalk.black.bgMagenta },
        { name: 'bbtag', color: CatLoggr._chalk.black.bgGreen },
        { name: 'verbose', color: CatLoggr._chalk.black.bgCyan },
        { name: 'adebug', color: CatLoggr._chalk.cyan.bgBlack },
        { name: 'debug', color: CatLoggr._chalk.magenta.bgBlack, aliases: ['log', 'dir'] },
        { name: 'database', color: CatLoggr._chalk.black.bgBlue },
        { name: 'module', color: CatLoggr._chalk.black.bgBlue }
    ]
}).setGlobal();

loggr.addPreHook(({ level, error, args, shard, context }) => {
    if (config.sentryURL && error) {
        if (typeof args[0] === 'string' && args[0].test(/Creating a pool connected to|Invalid session, reidentifying/i)) {
            return;
        }

        const transaction = Sentry.startTransaction({
            op: 'transaction',
            name: level
        });

        const logContext = {
            shard,
            ...context
        };

        let error;
        for (const arg of args) {
            if (arg instanceof Error) {
                error = arg;
                break;
            }
        }
        if (error) {
            Sentry.captureException(error, {
                ...logContext,
                args
            });
        } else {
            Sentry.captureException(args[0], {
                ...logContext,
                args: args.slice(1)
            });
        }
        transaction.finish();
    }
});

loggr.addArgHook(({ arg }) => {
    if (arg instanceof seqErrors.BaseError && Array.isArray(arg.errors)) {
        let text = [arg.stack];
        for (const err of arg.errors) {
            text.push(`\n - ${err.message}\n   - ${err.path} ${err.validatorKey} ${err.value}`);
        }
        return text;
    } else return null;
});

module.exports = loggr;