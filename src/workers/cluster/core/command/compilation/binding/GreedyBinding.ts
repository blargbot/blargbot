import { Binder, Binding, BindingResultIterator } from '../../../globalCore';
import { CommandBinderParseResult, CommandBinderState, CommandBinderValue, CommandResult } from '../../../types';
import { CommandContext } from '../../CommandContext';
import { CommandBindingBase } from './CommandBindingBase';

export class GreedyBinding<TContext extends CommandContext, TResult> extends CommandBindingBase<TContext, TResult[]> {
    public constructor(
        public readonly name: string,
        protected readonly raw: boolean,
        protected readonly next: Readonly<Record<number, ReadonlyArray<Binding<CommandBinderState<TContext>>> | undefined>>,
        protected readonly parse: (value: string, state: CommandBinderState<TContext>) => CommandBinderParseResult<TResult>
    ) {
        super();
    }

    public * debugView(): Generator<string> {
        yield `Greedy ${this.raw ? 'raw ' : ''}values into array variable '${this.name}'`;
        for (const key of Object.keys(this.next) as number[]) {
            yield `    When ${key} or more values:`;
            const next = this.next[key];
            if (next !== undefined) {
                for (const binding of next) {
                    for (const line of binding.debugView()) {
                        yield `        ${line}`;
                    }
                }
            }
        }
    }

    public *[Binder.binder](state: CommandBinderState<TContext>): BindingResultIterator<CommandBinderState<TContext>> {
        const next = [...this.next[0] ?? []];
        if (next.length > 0)
            yield this.getBindingResult(state, next, 0, { success: true, value: [] });

        const results = [];
        let i = 0;
        let arg;
        while ((arg = state.flags._.get(state.argIndex + i++)) !== undefined) {
            const result = this.parse(this.raw ? arg.raw : arg.value, state);
            if (result.success === false) {
                yield this.bindingError(state, result.error);
                return;
            }
            results.push(memoize(result));
            next.push(...this.next[results.length] ?? []);
            if (next.length > 0)
                yield this.getBindingResult(state, next, results.length, aggregateResults(results));
        }

        if (next.length === 0)
            yield this.bindingError(state, state.command.error(`Not enough arguments! \`${this.name}\` is required`));
    }
}

function memoize<TResult>(
    result: CommandBinderParseResult<TResult>
): CommandBinderParseResult<TResult> {
    switch (result.success) {
        case true:
        case false:
            return result;
        case 'deferred': {
            let resolved: CommandBinderValue<TResult> | undefined;
            return {
                get success(): 'deferred' | true | false {
                    return resolved?.success ?? 'deferred';
                },
                async getValue() {
                    return resolved = await result.getValue();
                },
                get value(): TResult {
                    if (resolved === undefined)
                        throw new Error('Value hasnt been resolved yet');
                    if (resolved.success)
                        return resolved.value;
                    throw new Error('Value was not resolved successfully');
                },
                get error(): CommandResult {
                    if (resolved === undefined)
                        throw new Error('Value hasnt been resolved yet');
                    if (resolved.success)
                        throw new Error('Value was resolved successfully');
                    return resolved.error;

                }
            };
        }
    }
}

function aggregateResults<TResult>(
    results: Array<CommandBinderParseResult<TResult>>
): CommandBinderParseResult<TResult[]> {
    const deferred: Array<Exclude<CommandBinderParseResult<TResult>, { success: false; }>> = [];
    const successful: TResult[] = [];

    for (const result of results) {
        switch (result.success) {
            case false: return result;
            case true: successful.push(result.value);
            // fallthrough
            case 'deferred': deferred.push(result);
        }
    }

    if (deferred.length === 0)
        return { success: true, value: successful };

    return {
        success: 'deferred',
        async getValue() {
            const results: TResult[] = [];
            for (const result of deferred) {
                switch (result.success) {
                    case true:
                        results.push(result.value);
                        break;
                    case 'deferred': {
                        const value = await result.getValue();
                        switch (value.success) {
                            case false: return { success: false, error: value.error };
                            case true: results.push(value.value);
                        }
                    }
                }
            }
            return { success: true, value: results };
        }
    };
}
