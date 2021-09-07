import { CommandBinderParseResult, CommandBinderState, CommandBinderValue, CommandGreedyParameter, CommandVariableTypeMap, CommandVariableTypeName } from '@cluster/types';
import { humanize } from '@cluster/utils';
import { Binder } from '@core/Binder';
import { Binding, BindingResultAsyncIterator } from '@core/types';

import { CommandContext } from '../../CommandContext';
import { CommandBindingBase } from './CommandBindingBase';

export class GreedyBinding<TContext extends CommandContext, Name extends CommandVariableTypeName> extends CommandBindingBase<TContext, Array<CommandVariableTypeMap[Name]>> {
    public readonly name: string;

    public constructor(
        protected readonly parameter: CommandGreedyParameter<Name>,
        protected readonly next: Readonly<Record<number, ReadonlyArray<Binding<CommandBinderState<TContext>>> | undefined>>
    ) {
        super();
        this.name = parameter.name;
    }

    public * debugView(): Generator<string> {
        yield `Greedy ${this.parameter.raw ? 'raw ' : ''}values into array variable '${this.name}'`;
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

    public async *[Binder.binder](state: CommandBinderState<TContext>): BindingResultAsyncIterator<CommandBinderState<TContext>> {

        const results = [];
        const next = [...this.next[0] ?? []];
        const optional = next.length > 0;
        let i = 0;
        let arg;
        let parsed = undefined;
        let aggregated = undefined;

        if (optional && this.parameter.type.priority === -Infinity)
            yield this.getBindingResult(state, next, 0, { success: true, value: [] });

        while ((arg = state.flags._.get(state.argIndex + i++)) !== undefined) {
            parsed = memoize(await this.parameter.type.parse(this.parameter.raw ? arg.raw : arg.value, state));
            if (parsed.success === false)
                break;
            results.push(parsed);
            next.push(...this.next[results.length] ?? []);
            if (next.length > 0) {
                yield this.getBindingResult(state, next, results.length, aggregateResults(results));
                aggregated = aggregateResults(results);
                if (aggregated.success === false)
                    break;
            }
        }

        if (optional && this.parameter.type.priority !== -Infinity)
            yield this.getBindingResult(state, next, 0, { success: true, value: [] });

        if (parsed?.success === false)
            yield this.bindingError(state, parsed.error);
        else if (aggregated?.success === false)
            yield this.bindingError(state, aggregated.error);
        else if (next.length === 0)
            yield this.bindingError(state, { notEnoughArgs: [humanize.commandParameter(this.parameter)] });
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
                get success() {
                    return resolved?.success ?? 'deferred';
                },
                async getValue() {
                    return resolved = await result.getValue();
                },
                get value() {
                    if (resolved === undefined)
                        throw new Error('Value hasnt been resolved yet');
                    if (resolved.success)
                        return resolved.value;
                    throw new Error('Value was not resolved successfully');
                },
                get error() {
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

    if (deferred.length === successful.length)
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
