import { CommandBinderState, CommandBinderStateFailureReason, CommandGreedyParameter, CommandHandler, CommandLiteralParameter, CommandParameter, CommandSignatureHandler, CommandSingleParameter, CommandVariableTypeName } from '@cluster/types';
import { parse, pluralise as p } from '@cluster/utils';
import { Binder } from '@core/Binder';
import { Binding } from '@core/types';
import { humanize } from '@core/utils';

import { CommandContext } from '../CommandContext';
import { ScopedCommandBase } from '../ScopedCommandBase';
import * as bindings from './binding';
import { getLookupCache } from './lookupCache';

export function compileHandler<TContext extends CommandContext>(
    signatures: ReadonlyArray<CommandSignatureHandler<TContext>>,
    command: ScopedCommandBase<TContext>
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
                flags: parse.flags(command.flags, context.argsString, true),
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
                        if (failure.parseFailed === undefined || failure.parseFailed.attemptedValue.length < reason.parseFailed.attemptedValue.length) {
                            failure.parseFailed = {
                                attemptedValue: reason.parseFailed.attemptedValue,
                                types: [...reason.parseFailed.types]
                            };
                        } else if (failure.parseFailed.attemptedValue.length === reason.parseFailed.attemptedValue.length) {
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

function resolveFailure<TContext extends CommandContext>(state: CommandBinderState<TContext>, reason: CommandBinderStateFailureReason, depth: number): string {
    if (reason.parseFailed !== undefined) {
        const expectedTypes = humanize.smartJoin(reason.parseFailed.types.map(arg => `\`${arg}\``), ', ', ' or ');
        return state.command.error(`Invalid arguments! \`${reason.parseFailed.attemptedValue}\` isnt ${expectedTypes}`);
    }

    if (reason.notEnoughArgs !== undefined && reason.notEnoughArgs.length > 0) {
        const missingParameters = humanize.smartJoin(reason.notEnoughArgs.map(arg => `\`${arg}\``), ', ', ' or ');
        return state.command.error(`Not enough arguments! You need to provide ${missingParameters}`);
    }

    if (reason.tooManyArgs !== true)
        return state.command.error('I couldnt understand those arguments!');

    if (depth === 0)
        return state.command.error(`Too many arguments! \`${state.command.name}\` doesnt need any arguments`);

    return state.command.error(`Too many arguments! Expected at most ${depth} ${p(depth, 'argument')}, but you gave ${state.flags._.length}`);

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
    const parameters: Record<string, {
        parameter: CommandSingleParameter<CommandVariableTypeName, false>;
        handlers: Array<CommandSignatureHandler<TContext>>;
    }> = {};

    return {
        * create() {
            for (const [sort, { parameter, handlers }] of Object.entries(parameters))
                yield { binding: new bindings.SingleBinding(parameter, buildBindings(handlers, depth + 1)), sort };
        },
        add(parameter, signature) {
            if (parameter === undefined)
                return;

            if (parameter.kind !== 'singleVar')
                throw new Error('Can only merge single variables');

            (parameters[getSortKey(parameter)] ??= { parameter, handlers: [] })
                .handlers.push(signature);
        }
    };
}

function createConcatVarBindingBuilder<TContext extends CommandContext>(depth: number): BindingBuilder<TContext> {
    const parameters: Record<string, {
        parameter: CommandSingleParameter<CommandVariableTypeName, true>;
        handlers: Array<CommandSignatureHandler<TContext>>;
    }> = {};

    return {
        * create() {
            for (const [sort, { parameter, handlers }] of Object.entries(parameters))
                yield { binding: new bindings.ConcatBinding(parameter, buildBindings(handlers, depth + 1)), sort };
        },
        add(parameter, signature) {
            if (parameter === undefined)
                return;

            if (parameter.kind !== 'concatVar')
                throw new Error('Can only merge concat variables');

            (parameters[getSortKey(parameter)] ??= { parameter, handlers: [] })
                .handlers.push(signature);
        }
    };
}

function createGreedyVarBindingBuilder<TContext extends CommandContext>(depth: number): BindingBuilder<TContext> {
    const parameters: Record<string, {
        parameter: CommandGreedyParameter<CommandVariableTypeName>;
        handlers: {
            [greedyMin: number]: Array<CommandSignatureHandler<TContext>>;
        };
    }> = {};

    return {
        * create() {
            for (const [sort, { parameter, handlers }] of Object.entries(parameters))
                yield { binding: new bindings.GreedyBinding(parameter, mapKeys(handlers, value => buildBindings(value, depth + 1))), sort };
        },
        add(parameter, signature) {
            if (parameter === undefined)
                return;

            if (parameter.kind !== 'greedyVar')
                throw new Error('Can only merge greedy variables');

            const { handlers } = parameters[getSortKey(parameter)] ??= { parameter, handlers: {} };
            (handlers[parameter.minLength] ??= []).push(signature);
        }
    };
}

function mapKeys<TKey extends string | number, TValue, TResult>(
    source: { [P in TKey]?: TValue },
    map: (value: TValue, key: TKey) => TResult
): { [P in TKey]?: TResult } {
    return Object.keys(source)
        .reduce<{ [P in TKey]?: TResult }>((r, key) => {
            const value = source[key] as TValue | undefined;
            if (value !== undefined)
                r[key] = map(value, key);
            return r;
        }, {});
}
