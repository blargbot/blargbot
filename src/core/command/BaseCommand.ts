import { MessageFile } from 'eris';
import { CommandType, FlagDefinition } from '../../utils';
import { CommandResult, CommandHandler, CommandOptionsBase } from './types';
import { SendPayload } from '../BaseUtilities';
import { CommandContext } from './CommandContext';

export abstract class BaseCommand implements Required<CommandOptionsBase> {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #locks: Record<string, { times: number; } | undefined>;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #cooldowns: Record<string, { lasttime: number; times: number; }>;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #handler: CommandHandler<CommandContext>;

    protected readonly ratelimit: Array<(context: CommandContext) => string>;
    public readonly name: string;
    public readonly aliases: readonly string[];
    public readonly category: CommandType;
    public readonly cannotDisable: boolean;
    public readonly info: string;
    public readonly flags: readonly FlagDefinition[];
    public readonly onlyOn: string | null;
    public readonly cooldown: number;
    public readonly usage: string;

    public get names(): readonly string[] { return [this.name, ...this.aliases]; }

    protected constructor(
        options: CommandOptionsBase,
        handler: CommandHandler<CommandContext>
    ) {
        this.name = options.name;
        this.aliases = options.aliases ?? [];
        this.category = options.category;
        this.cannotDisable = options.cannotDisable ?? true;
        this.info = options.info ?? 'WIP';
        this.flags = options.flags ?? [];
        this.onlyOn = options.onlyOn ?? null;
        this.cooldown = options.cooldown ?? 0;
        this.ratelimit = [];
        this.#locks = {};
        this.#cooldowns = {};

        this.#handler = handler;
        this.usage = handler.signatures.map(u => u.map(p => p.display).join(' ')).join('\n');
    }

    public abstract checkContext(context: CommandContext): boolean;

    public async execute(context: CommandContext): Promise<void> {
        try {
            let result = await this.preExecute(context);
            if (result === undefined)
                result = await this.#handler.execute(context);
            const [payload, files] = splitResult(result);
            if (payload !== undefined || files !== undefined)
                await context.reply(payload, files);
        }
        finally {
            await this.postExecute(context);
        }
    }

    protected preExecute(context: CommandContext): Promise<CommandResult | null> | CommandResult | null {
        for (const getKey of this.ratelimit) {
            const lock = this.#locks[getKey(context)] ??= { times: 0 };
            lock.times++;
            if (lock.times === 2)
                return '❌ Sorry, this command is already running! Please wait and try again.';
            if (lock.times > 1)
                return null;
        }

        if (this.cooldown > 0) {
            const cd = this.#cooldowns[context.author.id] ??= { lasttime: 0, times: 0 };
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

    protected postExecute(context: CommandContext): Promise<void> | void {
        for (const getKey of this.ratelimit)
            delete this.#locks[getKey(context)];

        if (this.cooldown > 0) {
            const cd = this.#cooldowns[context.author.id] ??= { lasttime: 0, times: 1 };
            const now = cd.lasttime = Date.now();
            setTimeout(() => {
                if (this.#cooldowns[context.author.id]?.lasttime === now)
                    delete this.#cooldowns[context.author.id];
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