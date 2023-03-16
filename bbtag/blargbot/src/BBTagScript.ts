import type { BBTagCallToken, BBTagStatementToken } from '@bbtag/language';
import { parseBBTag } from '@bbtag/language';
import type { Scheduler } from '@blargbot/async-tools';
import { markup } from '@blargbot/discord-util';
import type { Flag, FlagResult } from '@blargbot/input';
import { parseInput } from '@blargbot/input';

import type { BBTagCall } from './BBTagCall.js';
import type { BBTagRuntime } from './BBTagRuntime.js';
import type { BBTagStatement } from './BBTagStatement.js';
import { BBTagRuntimeError, InternalServerError, TagCooldownError, UnknownSubtagError } from './errors/index.js';
import type { SubtagExecutor } from './SubtagExecutor.js';
import { BBTagRuntimeState } from './types.js';

export class BBTagScript {
    readonly #execSubtag: SubtagExecutor;
    readonly #scheduler: Scheduler;
    #result?: Awaitable<string>;

    public readonly runtime: BBTagRuntime;
    public readonly source: string;
    public readonly name: string;
    public readonly inputRaw: string;
    public readonly input: string[];
    public readonly flaggedInput: FlagResult;
    public readonly flags: readonly Flag[];
    public readonly cooldownMs: number;
    public readonly ast: BBTagStatementToken;

    public constructor(
        runtime: BBTagRuntime,
        options: BBTagScriptOptions,
        execSubtag: SubtagExecutor,
        scheduler: Scheduler
    ) {
        this.#execSubtag = execSubtag;
        this.#scheduler = scheduler;
        this.runtime = runtime;
        this.cooldownMs = options.cooldownMs;
        this.source = options.source;
        this.name = options.name;
        this.inputRaw = options.inputRaw;
        this.flags = options.flags;
        const { args, flags } = parseInput(options.flags, options.inputRaw);
        this.input = args;
        this.flaggedInput = flags;
        this.ast = parseBBTag(this.source);
    }

    public execute(): Awaitable<string> {
        if (this.#result !== undefined)
            throw new Error('Cannot execute a script multiple times!');

        return this.#result = this.#execute();
    }

    async #execute(): Promise<string> {
        await this.#checkCooldown();
        return await this.runtime.withModule(() =>
            new BBTagScript.#bbtagStatement(this, this.ast)
                .resolve());
    }

    async #checkCooldown(): Promise<void> {
        if (this.cooldownMs <= 0)
            return;

        const cooldown = await this.runtime.runner.cooldowns.getCooldown(this);
        const cooldownMs = cooldown.valueOf();
        const now = Date.now();
        if (now >= cooldownMs)
            return;

        if (this.runtime.entrypoint === this)
            await this.runtime.output(`This ${this.runtime.isCC ? 'custom command' : 'tag'} is currently under cooldown. Please try again ${markup.timestamp.relative(cooldownMs - now)}.`);

        throw new TagCooldownError(this.name, this.runtime.isCC, now - cooldownMs);
    }

    public async eval(statement: BBTagStatementToken): Promise<string> {
        return await new BBTagScript.#bbtagStatement(this, statement).resolve();
    }

    static #bbtagStatement: new (script: BBTagScript, statement: BBTagStatementToken) => BBTagStatement;

    static {
        class BBTagScriptStatement implements BBTagStatement {
            readonly #script: BBTagScript;
            readonly #values: ReadonlyArray<string | BBTagScriptCall>;

            public readonly ast: BBTagStatementToken;
            public readonly isEmpty: boolean;

            public constructor(script: BBTagScript, ast: BBTagStatementToken) {
                this.#script = script;
                this.#values = ast.values.map(v => typeof v === 'string' ? v : new BBTagScriptCall(script, v));
                this.ast = ast;
                this.isEmpty = ast.values.length === 0;
                Object.freeze(this);
            }

            async * #resolve(): AsyncGenerator<void, string, void> {
                const result = [];
                for (const value of this.#values) {
                    result.push(typeof value === 'string' ? value : await value.resolve());
                    if (this.#script.runtime.state !== BBTagRuntimeState.RUNNING)
                        break;
                    yield;
                }
                return result.join('');
            }

            public resolve(): Awaitable<string> {
                const steps = this.#resolve();
                Object.assign(steps, { context: this });
                return this.#script.#scheduler.schedule(steps);
            }
        }

        class BBTagScriptCall implements BBTagCall {
            readonly #script: BBTagScript;

            public readonly ast: BBTagCallToken;
            public readonly name: BBTagScriptStatement;
            public readonly args: readonly BBTagScriptStatement[];

            public constructor(script: BBTagScript, ast: BBTagCallToken) {
                this.#script = script;
                this.ast = ast;
                this.name = new BBTagScriptStatement(script, ast.name);
                this.args = ast.args.map(a => new BBTagScriptStatement(script, a));
                Object.freeze(this);
            }

            public async resolve(): Promise<string> {
                const name = await this.#script.runtime.withScope(() => this.name.resolve());
                const subtag = this.#script.runtime.subtags.get(name);
                if (subtag === undefined)
                    return this.#script.runtime.addError(new UnknownSubtagError(name), this.ast);

                await this.#script.runtime.limit.check(subtag.id);

                try {
                    return await this.#script.#execSubtag(subtag, this.#script, name, this);
                } catch (err: unknown) {
                    if (err instanceof BBTagRuntimeError)
                        return this.#script.runtime.addError(err, this.ast);
                    if (err instanceof RangeError)
                        throw err;
                    return this.#script.runtime.addError(new InternalServerError(err), this.ast);
                }
            }
        }

        this.#bbtagStatement = BBTagScriptStatement;
    }
}

export interface BBTagScriptOptions {
    readonly source: string;
    readonly cooldownMs: number;
    readonly name: string;
    readonly inputRaw: string;
    readonly flags: readonly Flag[];
}
