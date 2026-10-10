import type { BBTagReplacer } from './BBTagReplacer.js';
import { UnknownSubtagError } from './BBTagRuntimeError.js';

type BBTagReplacerFactory<in Locals extends object, in Options> = (options: Options) => BBTagReplacer<Locals>;
type ReplacerOrFactory<Locals extends object = never, Options = never> = BBTagReplacer<Locals> | BBTagReplacerFactory<Locals, Options>;
type IterableOrRecord<T = unknown> = Iterable<T> | Record<string, T>;

type GetElement<T extends IterableOrRecord>
    = T extends IterableOrRecord<infer R>
    ? R
    : never;
type GetReplacerArgs<T extends ReplacerOrFactory>
    = T extends BBTagReplacer<infer Locals>
    ? { locals: Locals; options: never; }
    : T extends BBTagReplacerFactory<infer Locals, infer Options>
    ? { locals: Locals; options: Options; }
    : never;
type UnionToIntersection<U> =
    (U extends unknown ? (x: U) => void : never) extends
    (x: infer I) => void
    ? I
    : never;
type GetLocals<T extends IterableOrRecord<ReplacerOrFactory>> = UnionToIntersection<GetReplacerArgs<GetElement<T>>['locals']>;
type GetOptions<T extends IterableOrRecord<ReplacerOrFactory>> = UnionToIntersection<GetReplacerArgs<GetElement<T>>['options']>;

export interface BBTagReplacerComposer<Locals extends object = object> {
    register<OwnInputs extends object>(
        replacer: BBTagReplacer<OwnInputs>
    ): BBTagReplacerComposer<Locals & OwnInputs>;
    register<OwnInputs extends object, Options>(
        replacer: (options: NoInfer<Options>) => BBTagReplacer<OwnInputs>,
        options: Options
    ): BBTagReplacerComposer<Locals & OwnInputs>;

    registerAll<Replacers extends IterableOrRecord<BBTagReplacer<never>>>(
        replacers: Replacers
    ): BBTagReplacerComposer<Locals & GetLocals<Replacers>>;
    registerAll<Replacers extends IterableOrRecord<ReplacerOrFactory>>(
        replacers: Replacers,
        options: GetOptions<Replacers>
    ): BBTagReplacerComposer<Locals & GetLocals<Replacers>>;

    build(): BBTagReplacer<Locals>;
}

export function composeReplacer<Locals extends object>(
    configure: (builder: BBTagReplacerComposer) => BBTagReplacerComposer<Locals>
): BBTagReplacer<Locals> {
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

    public register<OwnInputs extends object, Options>(
        replacer: BBTagReplacer<OwnInputs> | ((options: Options) => BBTagReplacer<OwnInputs>),
        options?: Options
    ): BBTagReplacerComposer<Locals & OwnInputs> {
        const state = new Map<string, BBTagReplacer<Locals & OwnInputs>>(this.#state);

        if (typeof replacer === 'function')
            replacer = replacer(options!);

        Builder.#pushReplacer(state, replacer);

        return new Builder(state);
    }

    public registerAll(
        replacers: IterableOrRecord<ReplacerOrFactory>,
        options?: never
    ): BBTagReplacerComposer<Locals> {
        const state = new Map<string, BBTagReplacer<Locals>>(this.#state);

        if (Symbol.iterator in replacers) {
            for (const replacer of replacers as Iterable<ReplacerOrFactory>) {
                Builder.#pushReplacer(state, typeof replacer === 'function' ? replacer(options!) : replacer);
            }
        } else {
            for (const replacer of Object.values(replacers)) {
                Builder.#pushReplacer(state, typeof replacer === 'function' ? replacer(options!) : replacer);
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
