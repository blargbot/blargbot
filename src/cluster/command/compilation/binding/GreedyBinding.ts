import { CommandArgument, CommandArrayArgument, CommandBinderParseResult, CommandBinderState, CommandBinderValue, CommandGreedyParameter, CommandVariableTypeName } from '@blargbot/cluster/types';
import { humanize } from '@blargbot/cluster/utils';
import { Binder } from '@blargbot/core/Binder';
import { Binding, BindingResultAsyncIterator } from '@blargbot/core/types';

import { CommandContext } from '../../CommandContext';
import { createCommandArgument, populateMissingArgumentAccessors } from '../commandArgument';
import { CommandBindingBase } from './CommandBindingBase';

export class GreedyBinding<TContext extends CommandContext, Name extends CommandVariableTypeName> extends CommandBindingBase<TContext> {
    public readonly name: string;

    public constructor(
        protected readonly parameter: CommandGreedyParameter<Name>,
        protected readonly next: Readonly<Record<number, ReadonlyArray<Binding<CommandBinderState<TContext>>> | undefined>>
    ) {
        super();
        this.name = parameter.name;
    }

    public * debugView(): Generator<string> {
        yield `Greedy ${this.parameter.raw ? `raw ` : ``}values into array variable '${this.name}'`;
        for (const [key, next] of Object.entries(this.next)) {
            yield `    When ${<string>key} or more values:`;
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
            yield this.getBindingResult(state, next, 0, { success: true, value: createCommandArgument(this.parameter.type.name, []) });

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
            yield this.getBindingResult(state, next, 0, { success: true, value: createCommandArgument(this.parameter.type.name, []) });

        if (parsed?.success === false)
            yield this.bindingError(state, parsed.error);
        else if (aggregated?.success === false)
            yield this.bindingError(state, aggregated.error);
        else if (next.length === 0)
            yield this.bindingError(state, { notEnoughArgs: [humanize.commandParameter(this.parameter)] });
    }
}

function memoize(
    result: CommandBinderParseResult
): CommandBinderParseResult {
    switch (result.success) {
        case true:
        case false:
            return result;
        case `deferred`: {
            let resolved: CommandBinderValue | undefined;
            return {
                get success() {
                    return resolved?.success ?? `deferred`;
                },
                async getValue() {
                    return resolved = await result.getValue();
                },
                get value() {
                    if (resolved === undefined)
                        throw new Error(`Value hasnt been resolved yet`);
                    if (resolved.success)
                        return resolved.value;
                    throw new Error(`Value was not resolved successfully`);
                },
                get error() {
                    if (resolved === undefined)
                        throw new Error(`Value hasnt been resolved yet`);
                    if (resolved.success)
                        throw new Error(`Value was resolved successfully`);
                    return resolved.error;
                }
            };
        }
    }
}

function aggregateResults(
    results: CommandBinderParseResult[]
): CommandBinderParseResult {
    const deferred: Array<{ result: Exclude<CommandBinderParseResult, { success: false; }>; i: number; }> = [];
    const successful: Array<{ i: number; result: CommandArgument; }> = [];

    const indexed = results.map((result, i) => ({ result, i }));

    for (const { result, i } of indexed) {
        switch (result.success) {
            case false: return result;
            case true: successful.push({ i, result: result.value });
            // fallthrough
            case `deferred`: deferred.push({ i, result });
        }
    }

    if (deferred.length === successful.length)
        return { success: true, value: populateMissingArgumentAccessors(createAggregated(successful.sort((a, b) => a.i - b.i).map(x => x.result))) };

    return {
        success: `deferred`,
        async getValue() {
            const results: Array<{ i: number; result: CommandArgument; }> = [];
            for (const { result, i } of deferred) {
                switch (result.success) {
                    case true:
                        results.push({ i, result: result.value });
                        break;
                    case `deferred`: {
                        const value = await result.getValue();
                        switch (value.success) {
                            case false: return { success: false, error: value.error };
                            case true: results.push({ i, result: value.value });
                        }
                    }
                }
            }
            return { success: true, value: populateMissingArgumentAccessors(createAggregated([...successful, ...results].sort((a, b) => a.i - b.i).map(x => x.result))) };
        }
    };
}

function createAggregated(results: CommandArgument[]): CommandArrayArgument {
    return {
        get asBigints() { return results.map(r => r.asBigint); },
        get asBooleans() { return results.map(r => r.asBoolean); },
        get asChannels() { return results.map(r => r.asChannel); },
        get asDurations() { return results.map(r => r.asDuration); },
        get asIntegers() { return results.map(r => r.asInteger); },
        get asLiterals() { return results.map(r => r.asLiteral); },
        get asMembers() { return results.map(r => r.asMember); },
        get asNumbers() { return results.map(r => r.asNumber); },
        get asRoles() { return results.map(r => r.asRole); },
        get asSenders() { return results.map(r => r.asSender); },
        get asStrings() { return results.map(r => r.asString); },
        get asUsers() { return results.map(r => r.asUser); }
    };
}
