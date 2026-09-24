import type { BBTagReplacer } from './BBTagReplacer.js';
import { UnknownSubtagError } from './BBTagRuntimeError.js';

type GetLocals<T extends BBTagReplacer<never>> = (T extends BBTagReplacer<infer R> ? (v: R) => void : never) extends (v: infer R) => void ? R : never
export interface BBTagReplacerComposer<Locals extends object = object> {
    register<OwnInputs extends object>(
        replacer: BBTagReplacer<OwnInputs>
    ): BBTagReplacerComposer<Locals & OwnInputs>;

    registerAll<Replacer extends BBTagReplacer<never>>(
        replacers: Iterable<Replacer> | Record<string, Replacer>
    ): BBTagReplacerComposer<Locals & GetLocals<Replacer>>;

    build(): BBTagReplacer<Locals>;
}

export function composeReplacer<Locals extends object>(
    configure: (builder: BBTagReplacerComposer) => BBTagReplacerComposer<Locals>
): BBTagReplacer<{ [P in keyof Locals]: Locals[P] }> {
    return configure(new Builder<object>(new Map())).build();
}

type BuilderState<Locals extends object> = ReadonlyMap<string, BBTagReplacer<Locals>>

class Builder<Locals extends object> implements BBTagReplacerComposer<Locals> {
    readonly #state: BuilderState<Locals>;

    public constructor(state: BuilderState<Locals>) {
        this.#state = state;
    }

    static #pushReplacer<T extends object>(state: Map<string, BBTagReplacer<T>>, replacer: BBTagReplacer<T>): void {
        for (const n of [replacer.name, ...replacer.aliases]) {
            if (n === null)
                continue;
            const name = n.toLowerCase();
            if (state.has(name))
                throw new Error(`Duplicate subtag with name ${JSON.stringify(name)} found`);
            state.set(name, replacer);
        }
    }

    public register<OwnInputs extends object>(replacer: BBTagReplacer<OwnInputs>): BBTagReplacerComposer<Locals & OwnInputs> {
        const state = new Map<string, BBTagReplacer<Locals & OwnInputs>>(this.#state);

        Builder.#pushReplacer(state, replacer);

        return new Builder(state);
    }

    public registerAll<Replacers extends BBTagReplacer<never>>(
        replacers: Iterable<Replacers> | Record<string, Replacers>
    ): BBTagReplacerComposer<Locals & GetLocals<Replacers>> {
        const state = new Map<string, BBTagReplacer<Locals & GetLocals<Replacers>>>(this.#state);

        if (Symbol.iterator in replacers) {
            for (const replacer of replacers)
                Builder.#pushReplacer(state, replacer);
        } else {
            for (const replacer of Object.values(replacers)) {
                Builder.#pushReplacer(state, replacer);
            }
        }

        return new Builder(state);
    }

    public build(): BBTagReplacer<Locals> {
        const lookup = new Map(this.#state);
        function findReplacer(name: string): BBTagReplacer<Locals> | undefined {
            name = name.toLowerCase();
            const result = lookup.get(name);
            if (result?.canReplace(name) === true)
                return result;
            const splitAt = name.indexOf('.');
            if (splitAt === -1)
                return undefined;
            name = name.slice(0, splitAt + 1);
            const result2 = lookup.get(name);
            if (result2?.canReplace(name) === true)
                return result2;
            return undefined;
        }
        return {
            name: null,
            aliases: new Set(lookup.keys()),
            canReplace: v => findReplacer(v) !== undefined,
            replace: async function* executeCompositeBBTagReplacers(context, name, bbtag) {
                const replacer = findReplacer(name);
                yield* await (replacer === undefined
                    ? context.addError(new UnknownSubtagError(name), bbtag)
                    : replacer.replace(context, name, bbtag)
                );
            }
        };
    }
}
