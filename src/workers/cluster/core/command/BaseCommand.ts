import { MessageFile } from 'eris';
import { SendPayload } from '../globalCore';
import { CommandHandler, CommandOptionsBase, CommandResult, FlagDefinition } from '../types';
import { CommandType } from '../utils';
import { CommandContext } from './CommandContext';

export abstract class BaseCommand implements CommandOptionsBase {
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
    public readonly onlyOn: string | undefined;
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
        this.onlyOn = options.onlyOn;
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
            const result = await this.preExecute(context);
            if (result.continue)
                result.value = await this.#handler.execute(context);
            const [payload, files] = splitResult(result.value);
            if (payload !== undefined || files !== undefined)
                await context.reply(payload, files);
        }
        finally {
            await this.postExecute(context);
        }
    }

    protected preExecute(context: CommandContext): Promise<MiddlewareResult> | MiddlewareResult {
        for (const getKey of this.ratelimit) {
            const lock = this.#locks[getKey(context)] ??= { times: 0 };
            lock.times++;
            if (lock.times === 2)
                return { continue: false, value: '❌ Sorry, this command is already running! Please wait and try again.' };
            if (lock.times > 1)
                return { continue: false, value: undefined };
        }

        if (this.cooldown > 0) {
            const cd = this.#cooldowns[context.author.id] ??= { lasttime: 0, times: 0 };
            cd.times++;
            const remaining = cd.lasttime + this.cooldown - Date.now();
            if (remaining > 0) {
                return cd.times === 2
                    ? { continue: false, value: `❌ Sorry, you ran this command too recently! Please wait ${Math.round(remaining / 100) / 10}s and try again.` }
                    : { continue: false, value: undefined };
            }
            cd.lasttime = Date.now() + 999999;
        }

        return { continue: true, value: undefined };
    }

    protected postExecute(context: CommandContext): Promise<void> | void {
        for (const getKey of this.ratelimit)
            delete this.#locks[getKey(context)];

        if (this.cooldown > 0) {
            const cd = this.#cooldowns[context.author.id] ??= { lasttime: 0, times: 1 };
            const now = cd.lasttime = Date.now();
            setTimeout(() => {
                if (this.#cooldowns[context.author.id].lasttime === now)
                    delete this.#cooldowns[context.author.id];
            }, this.cooldown);
        }
    }
}

function splitResult(result: CommandResult | undefined): [SendPayload | undefined, MessageFile[] | undefined] {
    if (result === undefined)
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

interface MiddlewareResult {
    continue: boolean;
    value: CommandResult;
}
