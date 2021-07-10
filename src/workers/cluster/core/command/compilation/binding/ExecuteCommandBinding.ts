import { CommandBinderState, CommandSignatureHandler } from '../../../types';
import { Binder, BindingResultValue } from '../../../globalCore';
import { CommandContext } from '../../CommandContext';
import { CommandBindingBase } from './CommandBindingBase';

export class ExecuteCommandBinding<TContext extends CommandContext> extends CommandBindingBase<TContext, never> {
    public constructor(
        private readonly signature: CommandSignatureHandler<TContext>
    ) {
        super();
    }

    public * debugView(): Generator<string> {
        yield `Execute ${this.signature.execute.toString()}`;
    }

    public async [Binder.binder](state: CommandBinderState<TContext>): Promise<BindingResultValue<CommandBinderState<TContext>>> {
        if (state.flags._.length !== state.argIndex) {
            return this.bindingError(state, `❌ Too many arguments! Expected at most ${state.bindIndex} but got ${state.flags._.length}`);
        }

        const args = [];
        for (const arg of state.arguments) {
            switch (arg.success) {
                case true:
                    args.push(arg.value);
                    break;
                case 'deferred': {
                    const result = await arg.getValue();
                    if (!result.success) {
                        return this.bindingError(state, result.error);
                    }
                    args.push(result);
                    break;
                }

            }
        }

        return this.bindingSuccess(state, [], 0, await this.signature.execute(state.context, args, state.flags));
    }

}
