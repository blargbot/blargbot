import type { BBTagAnyLocal } from './BBTagAnyLocal.js';
import type { BBTagReplacer } from './BBTagReplacer.js';
import { UnknownSubtagError } from './BBTagRuntimeError.js';

type GetLocals<T extends BBTagReplacer<never>> = (T extends BBTagReplacer<infer R> ? (v: R) => void : never) extends (v: infer R) => void ? R : never
export interface BBTagReplacerBuilder<Locals extends Record<string, unknown> = BBTagAnyLocal> {
    register<OwnInputs extends Record<string, unknown>>(
        names: string | Iterable<string>,
        replacer: BBTagReplacer<OwnInputs>
    ): BBTagReplacerBuilder<Locals & OwnInputs>;

    register<OwnInputs extends Record<string, unknown>>(
        replacer: BBTagReplacer<OwnInputs> & { names: readonly string[]; }
    ): BBTagReplacerBuilder<Locals & OwnInputs>;

    registerAll<Replacer extends BBTagReplacer<never>>(
        replacers: Iterable<Replacer & { names: readonly string[]; }>
            | Record<string, Replacer & { names?: readonly string[]; }>
    ): BBTagReplacerBuilder<Locals & GetLocals<Replacer>>;

    build(): BBTagReplacer<Locals>;
}

export function composeBBTagReplacer<Locals extends Record<string, unknown>>(
    configure: (builder: BBTagReplacerBuilder) => BBTagReplacerBuilder<Locals>
): BBTagReplacer<{ [P in keyof Locals]: Locals[P] }> {
    return configure(new Builder(Object.create(null) as BBTagAnyLocal)).build();
}

interface BuilderState<Locals extends Record<string, unknown>> {
    readonly [x: string]: BBTagReplacer<Locals>;
}

class Builder<Locals extends Record<string, unknown>> implements BBTagReplacerBuilder<Locals> {
    readonly #state: BuilderState<Locals>;

    public constructor(state: BuilderState<Locals>) {
        this.#state = state;
    }

    static #pushReplacer<T extends Record<string, unknown>>(state: Record<string, BBTagReplacer<T>>, names: Iterable<string>, replacer: BBTagReplacer<T>): void {
        for (const n of names) {
            const name = n.toLowerCase();
            if (name in state)
                throw new Error(`Duplicate subtag with name ${JSON.stringify(name)} found`);
            state[name] = replacer;
        }
    }

    public register<OwnInputs extends Record<string, unknown>>(
        names: string | Iterable<string>,
        replacer: BBTagReplacer<OwnInputs>
    ): BBTagReplacerBuilder<Locals & OwnInputs>
    public register<OwnInputs extends Record<string, unknown>>(
        replacer: BBTagReplacer<OwnInputs> & { names: readonly string[]; }
    ): BBTagReplacerBuilder<Locals & OwnInputs>
    public register<OwnInputs extends Record<string, unknown>>(...args: [
        names: string | Iterable<string>,
        replacer: BBTagReplacer<OwnInputs>
    ] | [
        replacer: BBTagReplacer<OwnInputs> & { names: readonly string[]; }
    ]): BBTagReplacerBuilder<Locals & OwnInputs> {
        const [names, replacer] = args.length === 2 ? args : [args[0].names, args[0]];

        const state = Object.create(null) as { [x: string]: BBTagReplacer<Locals & OwnInputs>; };
        Object.assign(state, this.#state);

        Builder.#pushReplacer(state, typeof names === 'string' ? [names] : names, replacer);

        return new Builder(state);
    }

    public registerAll<Replacers extends BBTagReplacer<never>>(
        replacers: Iterable<Replacers & { names: readonly string[]; }>
            | Record<string, Replacers & { names?: readonly string[]; }>
    ): BBTagReplacerBuilder<Locals & GetLocals<Replacers>> {
        const state = Object.create(null) as { [x: string]: BBTagReplacer<Locals & GetLocals<Replacers>>; };
        Object.assign(state, this.#state);

        if (Symbol.iterator in replacers) {
            for (const replacer of replacers)
                Builder.#pushReplacer(state, replacer.names, replacer);
        } else {
            for (const [name, replacer] of Object.entries(replacers)) {
                Builder.#pushReplacer(state, replacer.names ?? [name], replacer);
            }
        }

        return new Builder(state);
    }

    public build(): BBTagReplacer<Locals> {
        const state = this.#state;
        function findSubtag(name: string): BBTagReplacer<Locals> | undefined {
            name = name.toLowerCase();
            if (name in state)
                return state[name];
            const splitAt = name.indexOf('.');
            if (splitAt === -1)
                return undefined;
            name = name.slice(0, splitAt);
            return state[name];
        }
        return async function* executeCompositeBBTagReplacers(context, name, bbtag) {
            const subtag = findSubtag(name);
            yield* await (subtag === undefined
                ? context.addError(new UnknownSubtagError(name), bbtag)
                : subtag(context, name, bbtag)
            );
        };

    }
}
