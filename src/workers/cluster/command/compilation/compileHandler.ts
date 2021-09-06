import { CommandBinderState, CommandGreedyParameter, CommandHandler, CommandLiteralParameter, CommandParameter, CommandSignatureHandler, CommandSingleParameter, CommandVariableTypeName } from '@cluster/types';
import { parse } from '@cluster/utils';
import { Binder } from '@core/Binder';
import { Binding } from '@core/types';

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
            const result = await binder.bind({
                argIndex: 0,
                arguments: [],
                bindIndex: 0,
                result: undefined,
                flags: parse.flags(command.flags, context.argsString, true),
                context,
                command,
                lookupCache: getLookupCache(context, command)
            });
            switch (result.success) {
                case true:
                    return result.state.result;
                case false:
                    return result.state.result ?? command.error('I wasnt able to understand those arguments!');
            }
        }
    };
}

interface BindingBuilder<TContext extends CommandContext> {
    create(): Iterable<{ binding: Binding<CommandBinderState<TContext>>; sort: string; }>;
    add(parameter: CommandParameter | undefined, signature: CommandSignatureHandler<TContext>): void;
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
            yield { binding: new bindings.ExecuteCommandBinding(signature), sort: getSortKey(undefined) };
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
            const options = mapKeys(signatureMap, (value) => buildBindings(value, depth + 1));
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
