import { Binder, Binding, BindingResult, guard, humanize } from '@core';
import { CommandBinderState } from '../../../types';
import { CommandContext } from '../../CommandContext';
import { CommandBindingBase } from './CommandBindingBase';

export class SwitchBinding<TContext extends CommandContext> extends CommandBindingBase<TContext, never> {
    protected readonly expected: string;
    protected readonly lookup: Readonly<Record<Lowercase<string>, ReadonlyArray<Binding<CommandBinderState<TContext>>> | undefined>>;

    public constructor(
        options: Readonly<Record<string, ReadonlyArray<Binding<CommandBinderState<TContext>>> | undefined>>,
        aliases: Readonly<Record<string, readonly string[] | undefined>>
    ) {
        super();

        this.expected = humanize.smartJoin(Object.keys(options).map(opt => `\`${opt}\``), ', ', ' or ');

        this.lookup = Object.fromEntries([
            ...Object.entries(aliases).map(entry => [entry[0].toLowerCase(), entry[1]?.flatMap(k => options[k]).filter(guard.hasValue)] as const),
            ...Object.entries(options).map(entry => [entry[0].toLowerCase(), entry[1]] as const),
            ...Object.entries(aliases).map(entry => [entry[0], entry[1]?.flatMap(k => options[k]).filter(guard.hasValue)] as const),
            ...Object.entries(options).map(entry => [entry[0], entry[1]] as const)
        ]);
    }

    public * debugView(): Generator<string> {
        yield 'Switch value';
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
            return this.bindingError(state, state.command.error(`Not enough arguments! Expected ${this.expected} but got nothing`));

        const nextRequired = this.lookup[arg] ?? this.lookup[arg.toLowerCase()];
        if (nextRequired !== undefined && nextRequired.length > 0)
            return this.bindingSuccess(state, nextRequired, 1, undefined, false);

        const nextOptional = this.lookup[''];
        if (nextOptional !== undefined)
            return this.bindingSuccess(state, nextOptional, 0, undefined);

        return this.bindingError(state, state.command.error(`Expected ${this.expected} but got \`${arg}\``));
    }
}
