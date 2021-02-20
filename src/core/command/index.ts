import { Message, MessageFile } from 'eris';
import { Cluster, ClusterUtilities } from '../../cluster';
import { CommandType, FlagDefinition, FlagResult, parse } from '../../utils';
import { Database } from '../database';
import { compileHandlerTree } from './compileHandlerTree';
import { CommandHandler, CommandHandlerTree, CommandOptions, HandlerResult } from './types';
import { Client as ErisClient } from 'eris';
import { SendPayload } from '../BaseUtilities';

export abstract class BaseCommand implements Required<CommandOptions> {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #getHandler: (flags: FlagResult) => CommandHandler<this>;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #handlers: CommandHandlerTree<this>;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #locks: Record<string, { times: number } | undefined>;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #cooldowns: Record<string, { lasttime: number, times: number }>;

    public get handlers(): CommandHandlerTree<this> { return this.#handlers; }

    protected readonly lockKeys: Array<(message: Message) => string>;
    public readonly name: string;
    public readonly aliases: string[];
    public readonly category: CommandType;
    public readonly cannotDisable: boolean;
    public readonly hidden: boolean;
    public readonly usage: string;
    public readonly info: string;
    public readonly flags: FlagDefinition[];
    public readonly onlyOn: string | null;
    public readonly cooldown: number;

    protected get util(): ClusterUtilities { return this.cluster.util; }
    protected get logger(): CatLogger { return this.cluster.logger; }
    protected get database(): Database { return this.cluster.database; }
    protected get discord(): ErisClient { return this.cluster.discord; }
    protected get config(): Configuration { return this.cluster.config; }

    protected constructor(
        protected readonly cluster: Cluster,
        options: CommandOptions
    ) {
        this.name = options.name;
        this.aliases = options.aliases ?? [];
        this.category = options.category;
        this.cannotDisable = options.cannotDisable ?? true;
        this.hidden = options.hidden ?? false;
        this.usage = 'WIP';
        this.info = options.info ?? 'WIP';
        this.flags = options.flags ?? [];
        this.onlyOn = options.onlyOn ?? null;
        this.cooldown = options.cooldown ?? 0;
        this.lockKeys = [];
        this.#locks = {};
        this.#cooldowns = {};

        this.#handlers = {};
        this.#getHandler = compileHandlerTree(this.#handlers, this.name);
    }

    protected setHandlers(handlers: CommandHandlerTree<this>): this {
        this.#handlers = handlers;
        this.#getHandler = compileHandlerTree(this.handlers, this.name);
        return this;
    }

    public async execute(message: Message, args: string[], raw: string): Promise<void> {
        const flags = parse.flags(this.flags, args);
        try {
            const handler = this.#getHandler(flags);
            let result = await this.preExecute(message, flags, raw);
            if (result === undefined)
                result = await handler.call(this, message, flags.undefined, flags, raw);
            const [payload, files] = splitResult(result);
            if (payload !== undefined || files !== undefined)
                await this.util.send(message, payload, files);
        }
        finally {
            await this.postExecute(message, flags, raw);
        }
    }

    protected preExecute(message: Message, _flags: FlagResult, _raw: string): Promise<HandlerResult | null> | HandlerResult | null {
        for (const getKey of this.lockKeys) {
            const lock = this.#locks[getKey(message)] ??= { times: 0 };
            lock.times++;
            if (lock.times === 2)
                return '❌ Sorry, this command is already running! Please wait and try again.';
            if (lock.times > 1)
                return null;
        }

        if (this.cooldown > 0) {
            const cd = this.#cooldowns[message.author.id] ??= { lasttime: 0, times: 0 };
            cd.times++;
            const remaining = cd.lasttime + this.cooldown - Date.now();
            if (remaining > 0) {
                return cd.times === 2
                    ? `❌ Sorry, you ran this command too recently! Please wait ${Math.round(remaining / 100) / 10}s and try again.`
                    : null;
            }
            cd.lasttime = Date.now() + 999999;
        }
    }

    protected postExecute(message: Message, _flags: FlagResult, _raw: string): Promise<void> | void {
        for (const getKey of this.lockKeys)
            delete this.#locks[getKey(message)];

        if (this.cooldown > 0) {
            const cd = this.#cooldowns[message.author.id] ??= { lasttime: 0, times: 1 };
            const now = cd.lasttime = Date.now();
            setTimeout(() => {
                if (this.#cooldowns[message.author.id]?.lasttime === now)
                    delete this.#cooldowns[message.author.id];
            }, this.cooldown);
        }
    }
}

function splitResult(result: HandlerResult | null): [SendPayload | undefined, MessageFile[] | undefined] {
    if (result === undefined || result === null)
        return [undefined, undefined];
    if (typeof result !== 'object')
        return [result, undefined];
    if ('file' in result)
        return [undefined, [result]];
    if ('length' in result)
        return [undefined, result];
    if ('files' in result)
        return [result.content, Array.isArray(result.files) ? result.files : [result.files]];
    return [result, undefined];
}