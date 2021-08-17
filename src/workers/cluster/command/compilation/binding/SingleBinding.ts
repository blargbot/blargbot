import { CommandBinderParseResult, CommandBinderState, CommandSingleParameter } from '@cluster/types';
import { Binder } from '@core/Binder';
import { Binding, BindingResultAsyncIterator } from '@core/types';

import { CommandContext } from '../../CommandContext';
import { CommandBindingBase } from './CommandBindingBase';

export class SingleBinding<TContext extends CommandContext, TResult> extends CommandBindingBase<TContext, TResult | undefined> {
    public readonly name: string;

    public constructor(
        protected readonly parameter: CommandSingleParameter,
        protected readonly next: ReadonlyArray<Binding<CommandBinderState<TContext>>>,
        protected readonly parse: (value: string, state: CommandBinderState<TContext>) => Awaitable<CommandBinderParseResult<TResult>>
    ) {
        super();
        this.name = parameter.name;
    }

    public * debugView(): Generator<string> {
        yield `Single ${this.parameter.required ? 'required' : 'optional'} ${this.parameter.raw ? 'raw ' : ''}value into variable '${this.name}'${this.parameter.fallback === undefined ? '' : ` with fallback of '${this.parameter.fallback}'`}`;
        for (const binding of this.next)
            for (const line of binding.debugView())
                yield `    ${line}`;
    }

    public async *[Binder.binder](state: CommandBinderState<TContext>): BindingResultAsyncIterator<CommandBinderState<TContext>> {
        const arg = state.flags._.get(state.argIndex);
        if (arg !== undefined) {
            const result = await this.parse(this.parameter.raw ? arg.raw : arg.value, state);
            yield this.getBindingResult(state, this.next, 1, result);
        }

        if (this.parameter.required)
            yield this.bindingError(state, state.command.error(`Not enough arguments! \`${this.name}\` is required`));
        else if (this.parameter.fallback !== undefined)
            yield this.getBindingResult(state, this.next, 0, await this.parse(this.parameter.fallback, state));
        else
            yield this.getBindingResult(state, this.next, 0, { success: true, value: undefined });
    }
}
