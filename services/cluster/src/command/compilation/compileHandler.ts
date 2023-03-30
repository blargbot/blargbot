import type { CommandBinderState, CommandBinderStateFailureReason, CommandGreedyParameter, CommandHandler, CommandLiteralParameter, CommandParameter, CommandResult, CommandSignatureHandler, CommandSingleParameter, CommandVariableTypeName } from '@blargbot/cluster/types.js';
import { parseInput } from '@blargbot/input';

import templates from '../../text.js';
import type { CommandContext } from '../CommandContext.js';
import type { ScopedCommand } from '../ScopedCommand.js';
import type { Binding } from './binding/Binder.js';
import { Binder } from './binding/Binder.js';
import * as bindings from './binding/index.js';
import { getLookupCache } from './lookupCache.js';

export function compileHandler<TContext extends CommandContext>(
    signatures: ReadonlyArray<CommandSignatureHandler<TContext>>,
    command: ScopedCommand<TContext>
): CommandHandler<TContext> {
    const binder = new Binder(buildBindings(signatures, 0), (current, next) => {
        if (current.bindIndex > next.bindIndex)
            return current;
        if (current.bindIndex < next.bindIndex)
            return next;
        if (current.argIndex > next.argIndex)
            return current;
        if (current.argIndex < next.argIndex)
            return next;
        return current;
    });
    return {
        get debugView() {
            return binder.debugView();
        },
        async execute(context: TContext) {
            let failure: CommandBinderStateFailureReason = {};
            let deepestError = 0;
            const { state } = await binder.bind({
                argIndex: 0,
                arguments: [],
                bindIndex: 0,
                flags: parseInput(command.flags, context.argsString, true).flags,
                context,
                command,
                lookupCache: getLookupCache(context),
                addFailure(index, reason) {
                    if (index < deepestError)
                        return;

                    if (index > deepestError) {
                        deepestError = index;
                        failure = {};
                    }

                    if (reason.parseFailed !== undefined) {
                        if (failure.parseFailed === undefined || failure.parseFailed.value.length < reason.parseFailed.value.length) {
                            failure.parseFailed = {
                                value: reason.parseFailed.value,
                                types: [...reason.parseFailed.types]
                            };
                        } else if (failure.parseFailed.value.length === reason.parseFailed.value.length) {
                            failure.parseFailed.types.push(...reason.parseFailed.types);
                        }
                    }

                    if (reason.notEnoughArgs !== undefined)
                        (failure.notEnoughArgs ??= []).push(...reason.notEnoughArgs);

                    if (reason.tooManyArgs === true)
                        failure.tooManyArgs = true;
                }
            });
            if (state.handler === undefined)
                return resolveFailure(state, failure, deepestError);
            const args = [];
            for (let i = 0; i < state.arguments.length; i++) {
                const arg = state.arguments[i];
                switch (arg.success) {
                    case true:
                        args.push(arg.value);
                        break;
                    case 'deferred': {
                        const result = await arg.getValue();
                        if (!result.success) {
                            state.addFailure(i, result.error);
                            return resolveFailure(state, failure, deepestError);
                        }
                        args.push(result.value);
                        break;
                    }

                }
            }
            return await state.handler.execute(context, args, state.flags);
        }
    };
}

interface BindingBuilder<TContext extends CommandContext> {
    create(): Iterable<{ binding: Binding<CommandBinderState<TContext>>; sort: string; }>;
    add(parameter: CommandParameter | undefined, signature: CommandSignatureHandler<TContext>): void;
}

function resolveFailure<TContext extends CommandContext>(state: CommandBinderState<TContext>, reason: CommandBinderStateFailureReason, depth: number): CommandResult {
    if (reason.parseFailed !== undefined)
        return templates.commands.$errors.arguments.invalid(reason.parseFailed);
    if (reason.notEnoughArgs !== undefined && reason.notEnoughArgs.length > 0)
        return templates.commands.$errors.arguments.missing({ missing: reason.notEnoughArgs });
    if (reason.tooManyArgs !== true)
        return templates.commands.$errors.arguments.unknown;
    if (depth === 0)
        return templates.commands.$errors.arguments.noneNeeded({ command: state.command });
    return templates.commands.$errors.arguments.tooMany({ max: depth, given: state.flags._.length });

}

function buildBindings<TContext extends CommandContext>(
    signatures: Iterable<CommandSignatureHandler<TContext>>,
    depth: number
): ReadonlyArray<Binding<CommandBinderState<TContext>>> {
    const results = new Map<CommandParameter['kind'] | 'execute', BindingBuilder<TContext>>();

    for (const signature of signatures) {
        const parameter = signature.parameters[depth] as CommandParameter | undefined;
        const key = parameter?.kind ?? 'execute';

        let builder = results.get(key);
        if (builder === undefined)
            results.set(key, builder = bindingBuilderMap[key](depth));

        builder.add(parameter, signature);
    }

    return [...results.values()]
        .flatMap(builder => [...builder.create()])
        .sort((a, b) => a.sort > b.sort ? 1 : a.sort === b.sort ? 0 : -1)
        .map(x => x.binding);
}

function getSortKey(parameter: CommandParameter | undefined): string {
    let kindOrder;
    switch (parameter?.kind) {
        case undefined: return '9';
        case 'literal': return '0';
        case 'singleVar':
            kindOrder = '1';
            break;
        case 'concatVar':
            kindOrder = '2';
            break;
        case 'greedyVar':
            kindOrder = `3(${parameter.minLength.toString().padStart(10, '0')})`;
            break;
    }

    return `1/${parameter.type.priority}/${kindOrder}/${parameter.raw ? 0 : 1}`;
}

const bindingBuilderMap: { [P in CommandParameter['kind'] | 'execute']: <TContext extends CommandContext>(depth: number) => BindingBuilder<TContext> } = {
    execute: createExecuteBindingBuilder,
    literal: createLiteralBindingBuilder,
    singleVar: createSingleVarBindingBuilder,
    concatVar: createConcatVarBindingBuilder,
    greedyVar: createGreedyVarBindingBuilder
};

function createExecuteBindingBuilder<TContext extends CommandContext>(): BindingBuilder<TContext> {
    let signature: CommandSignatureHandler<TContext> | undefined = undefined;

    return {
        * create() {
            if (signature === undefined)
                throw new Error('No signature has been set');
            yield { binding: new bindings.CommandHandlerBinding(signature), sort: getSortKey(undefined) };
        },
        add(_, s) {
            if (signature !== undefined)
                throw new Error('Duplicate handler found!');
            signature = s;
        }
    };
}

function createLiteralBindingBuilder<TContext extends CommandContext>(depth: number): BindingBuilder<TContext> {
    const signatureMap = {} as Record<string, Set<CommandSignatureHandler<TContext>> | undefined>;
    const aliasMap = {} as Record<string, Set<string> | undefined>;
    let aggregateParameter: CommandLiteralParameter | undefined;

    return {
        * create() {
            const options = mapKeys(signatureMap, (value) => ({ bindings: buildBindings(value, depth + 1), hidden: [...value].every(v => v.hidden) }));
            const aliases = mapKeys(aliasMap, value => [...value]);
            yield { binding: new bindings.SwitchBinding(options, aliases), sort: getSortKey(aggregateParameter) };
        },
        add(parameter, signature) {
            if (parameter === undefined)
                return;
            if (parameter.kind !== 'literal')
                throw new Error('Cannot merge a variable with a literal');

            (signatureMap[parameter.name] ??= new Set()).add(signature);
            for (const alias of parameter.alias)
                (aliasMap[alias] ??= new Set()).add(parameter.name);

            aggregateParameter ??= { kind: 'literal', alias: [], name: parameter.name };
            aggregateParameter.alias.push(parameter.name, ...parameter.alias);
        }
    };
}

function createSingleVarBindingBuilder<TContext extends CommandContext>(depth: number): BindingBuilder<TContext> {
    const parameters = new Map<string, {
        parameter: CommandSingleParameter<CommandVariableTypeName, false>;
        handlers: Array<CommandSignatureHandler<TContext>>;
    }>();

    return {
        * create() {
            for (const [sort, { parameter, handlers }] of parameters)
                yield { binding: new bindings.SingleBinding(parameter, buildBindings(handlers, depth + 1)), sort };
        },
        add(parameter, signature) {
            if (parameter === undefined)
                return;

            if (parameter.kind !== 'singleVar')
                throw new Error('Can only merge single variables');

            const key = getSortKey(parameter);
            let ref = parameters.get(key);
            if (ref === undefined)
                parameters.set(key, ref = { parameter, handlers: [] });
            ref.handlers.push(signature);
        }
    };
}

function createConcatVarBindingBuilder<TContext extends CommandContext>(depth: number): BindingBuilder<TContext> {
    const parameters = new Map<string, {
        parameter: CommandSingleParameter<CommandVariableTypeName, true>;
        handlers: Array<CommandSignatureHandler<TContext>>;
    }>();

    return {
        * create() {
            for (const [sort, { parameter, handlers }] of parameters)
                yield { binding: new bindings.ConcatBinding(parameter, buildBindings(handlers, depth + 1)), sort };
        },
        add(parameter, signature) {
            if (parameter === undefined)
                return;

            if (parameter.kind !== 'concatVar')
                throw new Error('Can only merge concat variables');

            const key = getSortKey(parameter);
            let ref = parameters.get(key);
            if (ref === undefined)
                parameters.set(key, ref = { parameter, handlers: [] });
            ref.handlers.push(signature);
        }
    };
}

function createGreedyVarBindingBuilder<TContext extends CommandContext>(depth: number): BindingBuilder<TContext> {
    const parameters = new Map<string, {
        parameter: CommandGreedyParameter<CommandVariableTypeName>;
        handlers: {
            [greedyMin: number]: Array<CommandSignatureHandler<TContext>> | undefined;
        };
    }>();

    return {
        * create() {
            for (const [sort, { parameter, handlers }] of parameters)
                yield { binding: new bindings.GreedyBinding(parameter, mapKeys(handlers, value => buildBindings(value, depth + 1))), sort };
        },
        add(parameter, signature) {
            if (parameter === undefined)
                return;

            if (parameter.kind !== 'greedyVar')
                throw new Error('Can only merge greedy variables');

            const key = getSortKey(parameter);
            let ref = parameters.get(key);
            if (ref === undefined)
                parameters.set(key, ref = { parameter, handlers: {} });
            const handlers = ref.handlers[parameter.minLength] ??= [];
            handlers.push(signature);
        }
    };
}

function mapKeys<TKey extends string, TValue, TResult>(
    source: { [P in TKey]?: TValue },
    map: (value: TValue, key: TKey) => TResult
): { [P in TKey]?: TResult } {
    return Object.entries(source)
        .reduce<{ [P in TKey]?: TResult }>((r, [key, value]) => {
            if (value !== undefined)
                r[key] = map(value, key);
            return r;
        }, {});
}
