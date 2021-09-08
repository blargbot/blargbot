import { CommandBinderState, CommandSignatureHandler } from '@cluster/types';
import { Binder } from '@core/Binder';
import { BindingResultValue } from '@core/types';

import { CommandContext } from '../../CommandContext';
import { CommandBindingBase } from './CommandBindingBase';

export class CommandHandlerBinding<TContext extends CommandContext> extends CommandBindingBase<TContext> {
    public constructor(
        private readonly signature: CommandSignatureHandler<TContext>
    ) {
        super();
    }

    public * debugView(): Generator<string> {
        yield `Execute ${this.signature.execute.toString()}`;
    }

    public [Binder.binder](state: CommandBinderState<TContext>): BindingResultValue<CommandBinderState<TContext>> {
        if (state.flags._.length !== state.argIndex) {
            return this.bindingError(state, { tooManyArgs: true });
        }

        return this.bindingSuccess({
            ...state,
            handler: this.signature
        }, [], 0);
    }
}
