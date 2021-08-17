import { CommandBinderParseResult, CommandBinderState, CommandConcatParameter } from '@cluster/types';
import { Binder } from '@core/Binder';
import { Binding, BindingResultAsyncIterator } from '@core/types';

import { CommandContext } from '../../CommandContext';
import { CommandBindingBase } from './CommandBindingBase';

export class ConcatBinding<TContext extends CommandContext, TResult> extends CommandBindingBase<TContext, TResult | undefined> {
    public readonly name: string;

    public constructor(
        protected readonly parameter: CommandConcatParameter,
        protected readonly next: ReadonlyArray<Binding<CommandBinderState<TContext>>>,
        protected readonly parse: (value: string, state: CommandBinderState<TContext>) => Awaitable<CommandBinderParseResult<TResult>>
    ) {
        super();
        this.name = parameter.name;
    }

    public * debugView(): Generator<string> {
        yield `Concat ${this.parameter.raw ? 'raw ' : ''}values into variable '${this.name}'${this.parameter.fallback === undefined ? '' : ` with fallback of '${this.parameter.fallback}'`}`;
        for (const binding of this.next)
            for (const line of binding.debugView())
                yield `    ${line}`;
    }

    public async *[Binder.binder](state: CommandBinderState<TContext>): BindingResultAsyncIterator<CommandBinderState<TContext>> {
        if (!this.parameter.required && this.parameter.type === 'string') {
            if (this.parameter.fallback === undefined)
                yield this.getBindingResult(state, this.next, 0, { success: true, value: undefined });
            else
                yield this.getBindingResult(state, this.next, 0, await this.parse(this.parameter.fallback, state));
        }

        for (let i = 1; i <= state.flags._.length - state.argIndex; i++) {
            const args = state.flags._.merge(state.argIndex, state.argIndex + i);
            const arg = this.parameter.raw ? args.raw : args.value;
            yield this.getBindingResult(state, this.next, i, await this.parse(arg, state));
        }

        if (!this.parameter.required && this.parameter.type !== 'string') {
            if (this.parameter.fallback === undefined)
                yield this.getBindingResult(state, this.next, 0, { success: true, value: undefined });
            else
                yield this.getBindingResult(state, this.next, 0, await this.parse(this.parameter.fallback, state));
        }

        if (this.parameter.required && state.flags._.length === state.argIndex)
            yield this.bindingError(state, state.command.error(`Not enough arguments! \`${this.name}\` is required`));
    }
}
