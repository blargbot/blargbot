import type { BBTagAnyLocal } from './BBTagAnyLocal.js';
import type { BBTagReplacer } from './BBTagReplacer.js';

export interface BBTagReplacerBuilder<Locals extends Record<string, unknown> = BBTagAnyLocal> {
    register<OwnInputs extends Record<string, unknown>>(
        names: string | Iterable<string>,
        handler: BBTagReplacer<OwnInputs>
    ): BBTagReplacerBuilder<Locals & OwnInputs>;

    build(): BBTagReplacer<Locals>;
}

export function composeBBTagReplacer<Locals extends Record<string, unknown>>(
    configure: (builder: BBTagReplacerBuilder) => BBTagReplacerBuilder<Locals>
): BBTagReplacer<Locals> {
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

    public register<OwnInputs extends Record<string, unknown>>(
        names: string | Iterable<string>,
        handler: BBTagReplacer<OwnInputs>
    ): BBTagReplacerBuilder<Locals & OwnInputs> {
        const state = Object.create(null) as { [x: string]: BBTagReplacer<Locals & OwnInputs>; };
        Object.assign(state, this.#state);

        for (const n of typeof names === 'string' ? [names] : names) {
            const name = n.toLowerCase();
            if (name in state)
                throw new Error(`Duplicate subtag with name ${JSON.stringify(name)} found`);
            state[name] = handler;
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
        return async function* (context, name, bbtag) {
            const subtag = findSubtag(name);
            yield* await (subtag === undefined
                ? context.addError({ error: `Unknown subtag ${name}`, subtag: bbtag })
                : subtag(context, name, bbtag)
            );
        };

    }
}
