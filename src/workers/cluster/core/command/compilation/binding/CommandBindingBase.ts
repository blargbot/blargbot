import { Binder, Binding, BindingFailure, BindingResult, BindingResultValue, BindingSuccess } from '../../../globalCore';
import { CommandBinderParseResult, CommandBinderState, CommandResult } from '../../../types';
import { CommandContext } from '../../CommandContext';

export abstract class CommandBindingBase<TContext extends CommandContext, TResult> implements Binding<CommandBinderState<TContext>> {
    public abstract [Binder.binder](state: CommandBinderState<TContext>): BindingResult<CommandBinderState<TContext>>

    public abstract debugView(): Iterable<string>;

    protected bindingError(
        state: CommandBinderState<TContext>,
        error: CommandResult
    ): BindingFailure<CommandBinderState<TContext>> {
        return {
            success: false,
            state: {
                ...state,
                bindIndex: state.bindIndex + 1,
                result: error
            }
        };
    }

    protected bindingSuccess(
        state: CommandBinderState<TContext>,
        next: ReadonlyArray<Binding<CommandBinderState<TContext>>>,
        argCount: number,
        value?: Exclude<CommandBinderParseResult<unknown>, { success: false; }> | CommandResult,
        checkNext = true
    ): BindingSuccess<CommandBinderState<TContext>> {
        let args = state.arguments;
        let result = state.result;
        if (value === undefined) {
            // NOOP
        } else if (typeof value === 'object' && 'success' in value) {
            args = [...args, value];
        } else {
            result = value;
        }
        return {
            success: true,
            next: next,
            checkNext,
            state: {
                ...state,
                argIndex: state.argIndex + argCount,
                bindIndex: state.bindIndex + 1,
                arguments: args,
                result: result
            }
        };
    }

    protected getBindingResult(
        state: CommandBinderState<TContext>,
        next: ReadonlyArray<Binding<CommandBinderState<TContext>>>,
        argCount: number,
        result: CommandBinderParseResult<TResult>
    ): BindingResultValue<CommandBinderState<TContext>> {
        switch (result.success) {
            case false:
                return this.bindingError(state, result.error);
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
