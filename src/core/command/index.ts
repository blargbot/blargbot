import { Message, MessageFile } from 'eris';
import { Cluster, ClusterUtilities } from '../../cluster';
import { CommandType, FlagDefinition } from '../../utils';
import { Database } from '../database';
import { CommandDefinition, CommandOptions, CommandResult, CompiledCommand } from './types';
import { Client as ErisClient } from 'eris';
import { SendPayload } from '../BaseUtilities';
import { compileCommand } from './compileCommand';

export abstract class BaseCommand implements Required<CommandOptions> {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #runner: CompiledCommand;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #locks: Record<string, { times: number } | undefined>;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #cooldowns: Record<string, { lasttime: number, times: number }>;

    public get runner(): CompiledCommand { return this.#runner; }

    protected readonly lockKeys: Array<(message: Message) => string>;
    public readonly handler: CommandDefinition;
    public readonly name: string;
    public readonly aliases: readonly string[];
    public readonly category: CommandType;
    public readonly cannotDisable: boolean;
    public readonly hidden: boolean;
    public readonly usage: string;
    public readonly info: string;
    public readonly flags: readonly FlagDefinition[];
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
        this.info = options.info ?? 'WIP';
        this.flags = options.flags ?? [];
        this.onlyOn = options.onlyOn ?? null;
        this.cooldown = options.cooldown ?? 0;
        this.lockKeys = [];
        this.handler = options.handler;
        this.#locks = {};
        this.#cooldowns = {};

        this.#runner = compileCommand(this.handler);
        this.usage = this.#runner.usage.map(u => u.map(p => p.display).join(' ')).join('\n');
    }

    public async execute(message: Message, args: string[], raw: string): Promise<void> {
        try {
            let result = await this.preExecute(message, args, raw);
            if (result === undefined)
                result = await this.#runner.execute(message, this.flags, args, raw);
            const [payload, files] = splitResult(result);
            if (payload !== undefined || files !== undefined)
                await this.util.send(message, payload, files);
        }
        finally {
            await this.postExecute(message, args, raw);
        }
    }

    protected preExecute(message: Message, _args: string[], _raw: string): Promise<CommandResult | null> | CommandResult | null {
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

    protected postExecute(message: Message, _args: string[], _raw: string): Promise<void> | void {
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

function splitResult(result: CommandResult | null): [SendPayload | undefined, MessageFile[] | undefined] {
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