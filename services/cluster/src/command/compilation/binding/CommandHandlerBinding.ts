import type { CommandBinderState, CommandSignatureHandler } from '@blargbot/cluster/types.js';

import type { CommandContext } from '../../CommandContext.js';
import type { BindingResultValue } from './Binder.js';
import { Binder } from './Binder.js';
import { CommandBindingBase } from './CommandBindingBase.js';

export class CommandHandlerBinding<TContext extends CommandContext> extends CommandBindingBase<TContext> {
    readonly #signature: CommandSignatureHandler<TContext>;

    public constructor(
        signature: CommandSignatureHandler<TContext>
    ) {
        super();
        this.#signature = signature;
    }

    public * debugView(): Generator<string> {
        yield `Execute ${this.#signature.execute.toString()}`;
    }

    public [Binder.binder](state: CommandBinderState<TContext>): BindingResultValue<CommandBinderState<TContext>> {
        if (state.flags._.length !== state.argIndex) {
            return this.bindingError(state, { tooManyArgs: true });
        }

        return this.bindingSuccess({
            ...state,
            handler: this.#signature
        }, [], 0);
    }
}
