import type { CommandBinderParseResult, CommandBinderState, CommandBinderStateFailureReason } from '@blargbot/cluster/types.js';

import type { CommandContext } from '../../CommandContext.js';
import type { Binding, BindingFailure, BindingResult, BindingResultValue, BindingSuccess } from './Binder.js';
import { Binder } from './Binder.js';

export abstract class CommandBindingBase<TContext extends CommandContext> implements Binding<CommandBinderState<TContext>> {
    public abstract [Binder.binder](state: CommandBinderState<TContext>): BindingResult<CommandBinderState<TContext>>

    public abstract debugView(): Iterable<string>;

    protected bindingError(
        state: CommandBinderState<TContext>,
        error: CommandBinderStateFailureReason,
        argCount = 0
    ): BindingFailure<CommandBinderState<TContext>> {
        state.addFailure(state.argIndex, error);
        return {
            success: false,
            state: {
                ...state,
                argIndex: state.argIndex + argCount,
                bindIndex: state.bindIndex + 1
            }
        };
    }

    protected bindingSuccess(
        state: CommandBinderState<TContext>,
        next: ReadonlyArray<Binding<CommandBinderState<TContext>>>,
        argCount: number,
        value?: Exclude<CommandBinderParseResult, { success: false; }>,
        checkNext = true
    ): BindingSuccess<CommandBinderState<TContext>> {
        let args = state.arguments;
        if (value === undefined) {
            // NOOP
        } else {
            args = [...args, value];
        }
        return {
            success: true,
            next: next,
            checkNext,
            state: {
                ...state,
                argIndex: state.argIndex + argCount,
                bindIndex: state.bindIndex + 1,
                arguments: args
            }
        };
    }

    protected getBindingResult(
        state: CommandBinderState<TContext>,
        next: ReadonlyArray<Binding<CommandBinderState<TContext>>>,
        argCount: number,
        result: CommandBinderParseResult
    ): BindingResultValue<CommandBinderState<TContext>> {
        switch (result.success) {
            case false:
                return this.bindingError(state, result.error, argCount);
            case true:
            case 'deferred':
                return this.bindingSuccess(state, next, argCount, result);
            default: {
                const x: never = result;
                return x;
            }
        }
    }
}
