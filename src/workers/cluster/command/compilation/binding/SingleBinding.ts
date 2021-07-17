import { CommandBinderParseResult, CommandBinderState } from '@cluster/types';
import { Binder } from '@core/Binder';
import { Binding, BindingResultIterator } from '@core/types';

import { CommandContext } from '../../CommandContext';
import { CommandBindingBase } from './CommandBindingBase';

export class SingleBinding<TContext extends CommandContext, TResult> extends CommandBindingBase<TContext, TResult> {
    public constructor(
        public readonly name: string,
        protected readonly fallback: string | undefined,
        protected readonly raw: boolean,
        protected readonly next: ReadonlyArray<Binding<CommandBinderState<TContext>>>,
        protected readonly parse: (value: string, state: CommandBinderState<TContext>) => CommandBinderParseResult<TResult>
    ) {
        super();
    }

    public * debugView(): Generator<string> {
        yield `Single ${this.raw ? 'raw ' : ''}value into variable '${this.name}'${this.fallback === undefined ? '' : ` with fallback of '${this.fallback}'`}`;
        for (const binding of this.next)
            for (const line of binding.debugView())
                yield `    ${line}`;
    }

    public *[Binder.binder](state: CommandBinderState<TContext>): BindingResultIterator<CommandBinderState<TContext>> {
        const arg = state.flags._.get(state.argIndex);
        if (arg !== undefined) {
            const result = this.parse(this.raw ? arg.raw : arg.value, state);
            yield this.getBindingResult(state, this.next, 1, result);
        }

        if (this.fallback !== undefined) {
            const result = this.parse(this.fallback, state);
            yield this.getBindingResult(state, this.next, 0, result);
        } else
            yield this.bindingError(state, state.command.error(`Not enough arguments! \`${this.name}\` is required`));
    }
}
