import { CommandBinderState, CommandSingleParameter, CommandVariableTypeName } from '@blargbot/cluster/types.js';
import { humanize } from '@blargbot/cluster/utils/index.js';
import { Binder } from '@blargbot/core/Binder.js';
import { Binding, BindingResultAsyncIterator } from '@blargbot/core/types.js';

import { CommandContext } from '../../CommandContext.js';
import { createCommandArgument } from '../commandArgument.js';
import { CommandBindingBase } from './CommandBindingBase.js';

export class SingleBinding<TContext extends CommandContext, Name extends CommandVariableTypeName> extends CommandBindingBase<TContext> {
    public readonly name: string;

    public constructor(
        public readonly parameter: CommandSingleParameter<Name, false>,
        protected readonly next: ReadonlyArray<Binding<CommandBinderState<TContext>>>
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
            const result = await this.parameter.type.parse(this.parameter.raw ? arg.raw : arg.value, state);
            yield this.getBindingResult(state, this.next, 1, result);
        }

        if (this.parameter.required)
            yield this.bindingError(state, { notEnoughArgs: [humanize.commandParameter(this.parameter)] });
        else if (this.parameter.fallback !== undefined)
            yield this.getBindingResult(state, this.next, 0, await this.parameter.type.parse(this.parameter.fallback, state));
        else
            yield this.getBindingResult(state, this.next, 0, { success: true, value: createCommandArgument(this.parameter.type.name, undefined) });
    }
}
