import { CommandBinderState } from '@blargbot/cluster/types';
import { guard } from '@blargbot/cluster/utils';
import { Binder } from '@blargbot/core/Binder';
import { Binding, BindingResult } from '@blargbot/core/types';

import { CommandContext } from '../../CommandContext';
import { CommandBindingBase } from './CommandBindingBase';

interface SwitchOptions<TContext extends CommandContext> {
    readonly [key: string]: {
        bindings: ReadonlyArray<Binding<CommandBinderState<TContext>>>;
        hidden: boolean;
    } | undefined;
}

export class SwitchBinding<TContext extends CommandContext> extends CommandBindingBase<TContext> {
    protected readonly expected: readonly string[];
    protected readonly lookup: Readonly<Record<string, ReadonlyArray<Binding<CommandBinderState<TContext>>> | undefined>>;

    public constructor(
        options: SwitchOptions<TContext>,
        aliases: Readonly<Record<string, readonly string[] | undefined>>
    ) {
        super();

        this.expected = Object.entries(options).filter(e => e[1]?.hidden !== true).map(e => e[0]);

        this.lookup = Object.fromEntries([
            ...Object.entries(aliases).map(entry => [entry[0].toLowerCase(), entry[1]?.flatMap(k => options[k]?.bindings).filter(guard.hasValue)] as const),
            ...Object.entries(options).map(entry => [entry[0].toLowerCase(), entry[1]?.bindings] as const),
            ...Object.entries(aliases).map(entry => [entry[0], entry[1]?.flatMap(k => options[k]?.bindings).filter(guard.hasValue)] as const),
            ...Object.entries(options).map(entry => [entry[0], entry[1]?.bindings] as const)
        ]);
    }

    public * debugView(): Generator<string> {
        yield `Switch value`;
        for (const option of Object.keys(this.lookup)) {
            yield `    case '${option}'`;
            for (const binding of this.lookup[option] ?? []) {
                for (const line of binding.debugView()) {
                    yield `        ${line}`;
                }
            }
        }
    }

    public [Binder.binder](state: CommandBinderState<TContext>): BindingResult<CommandBinderState<TContext>> {
        const arg = state.flags._.get(state.argIndex)?.value;
        if (arg === undefined)
            return this.bindingError(state, { notEnoughArgs: [...this.expected] });

        const nextRequired = this.lookup[arg] ?? this.lookup[arg.toLowerCase()];
        if (nextRequired !== undefined && nextRequired.length > 0)
            return this.bindingSuccess(state, nextRequired, 1, undefined, false);

        const nextOptional = this.lookup[``];
        if (nextOptional !== undefined)
            return this.bindingSuccess(state, nextOptional, 0, undefined);

        if (this.expected.length > 0)
            return this.bindingError(state, { parseFailed: { attemptedValue: arg, types: [...this.expected] } });

        return this.bindingError(state, { tooManyArgs: true });
    }
}
