import { CommandBinderParseResult, CommandBinderState } from '@cluster/types';
import { Binder } from '@core/Binder';
import { Binding, BindingResultIterator } from '@core/types';

import { CommandContext } from '../../CommandContext';
import { CommandVariableType } from '../parameterType';
import { CommandBindingBase } from './CommandBindingBase';

export class ConcatBinding<TContext extends CommandContext, TResult> extends CommandBindingBase<TContext, TResult> {
    public constructor(
        public readonly name: string,
        protected readonly fallback: string | undefined,
        protected readonly raw: boolean,
        protected readonly next: ReadonlyArray<Binding<CommandBinderState<TContext>>>,
        protected readonly parse: (value: string, state: CommandBinderState<TContext>) => CommandBinderParseResult<TResult>,
        protected readonly type: CommandVariableType
    ) {
        super();
    }

    public * debugView(): Generator<string> {
        yield `Concat ${this.raw ? 'raw ' : ''}values into variable '${this.name}'${this.fallback === undefined ? '' : ` with fallback of '${this.fallback}'`}`;
        for (const binding of this.next)
            for (const line of binding.debugView())
                yield `    ${line}`;
    }

    public *[Binder.binder](state: CommandBinderState<TContext>): BindingResultIterator<CommandBinderState<TContext>> {
        if (this.fallback !== undefined && this.type === 'string')
            yield this.getBindingResult(state, this.next, 0, this.parse(this.fallback, state));

        for (let i = 1; i <= state.flags._.length - state.argIndex; i++) {
            const args = state.flags._.merge(state.argIndex, state.argIndex + i);
            const arg = this.raw ? args.raw : args.value;
            yield this.getBindingResult(state, this.next, i, this.parse(arg, state));
        }

        if (this.fallback !== undefined && this.type !== 'string')
            yield this.getBindingResult(state, this.next, 0, this.parse(this.fallback, state));
        if (this.fallback === undefined && state.flags._.length === state.argIndex)
            yield this.bindingError(state, state.command.error(`Not enough arguments! \`${this.name}\` is required`));
    }
}
