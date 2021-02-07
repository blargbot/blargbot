"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = void 0;
const ts_1 = __importDefault(require("cat-loggr/ts"));
const sequelize_1 = __importDefault(require("sequelize"));
function createLogger(config, workerId) {
    const logger = new ts_1.default({
        shardId: workerId,
        level: config.general.loglevel ?? 'info',
        shardLength: 6,
        levels: [
            logLevel('fatal', ts_1.default._chalk.red.bgBlack, { err: true }),
            logLevel('error', ts_1.default._chalk.black.bgRed, { err: true }),
            logLevel('warn', ts_1.default._chalk.black.bgYellow, { err: true }),
            logLevel('trace', ts_1.default._chalk.green.bgBlack, { trace: true }),
            logLevel('website', ts_1.default._chalk.black.bgCyan),
            logLevel('ws', ts_1.default._chalk.yellow.bgBlack),
            logLevel('cluster', ts_1.default._chalk.black.bgMagenta),
            logLevel('worker', ts_1.default._chalk.black.bgMagenta),
            logLevel('command', ts_1.default._chalk.black.bgBlue),
            logLevel('irc', ts_1.default._chalk.yellow.bgBlack),
            logLevel('shardi', ts_1.default._chalk.blue.bgYellow),
            logLevel('init', ts_1.default._chalk.black.bgBlue),
            logLevel('info', ts_1.default._chalk.black.bgGreen),
            logLevel('output', ts_1.default._chalk.black.bgMagenta),
            logLevel('bbtag', ts_1.default._chalk.black.bgGreen),
            logLevel('verbose', ts_1.default._chalk.black.bgCyan),
            logLevel('adebug', ts_1.default._chalk.cyan.bgBlack),
            logLevel('debug', ts_1.default._chalk.magenta.bgBlack, { aliases: ['log', 'dir'] }),
            logLevel('database', ts_1.default._chalk.black.bgBlue),
            logLevel('module', ts_1.default._chalk.black.bgBlue)
        ]
    });
    logger.addArgHook(({ arg }) => {
        if (isSequelizeValidationError(arg) && Array.isArray(arg.errors)) {
            const text = [arg.stack || ''];
            for (const err of arg.errors) {
                text.push(`\n - ${err.message}\n   - ${err.path} ${err.value}`);
            }
            return text.join('');
        }
        return null;
    });
    return logger;
}
exports.createLogger = createLogger;
function logLevel(name, color, options) {
    const level = {
        name,
        color: color,
        aliases: options?.aliases,
        err: options?.err,
        trace: options?.trace,
        position: options?.position,
        colors: options?.colors,
        setAliases: options?.setAliases,
        setColors: options?.setColors,
        setError: options?.setError,
        setTrace: options?.setTrace
    };
    if (bypassBorkedTypeDefinition(level))
        return level;
    throw new Error('errr this shouldnt have happened ever. The type check should just return true always');
}
function isSequelizeValidationError(error) {
    return typeof error === 'object' && error instanceof sequelize_1.default.ValidationError;
}
function bypassBorkedTypeDefinition(value) {
    return value !== undefined;
}
//# sourceMappingURL=Logger.js.map