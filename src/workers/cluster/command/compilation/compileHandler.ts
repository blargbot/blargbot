import { CommandBinderParseResult, CommandBinderState, CommandConcatParameter, CommandGreedyParameter, CommandHandler, CommandParameter, CommandSignatureHandler, CommandSingleParameter } from '@cluster/types';
import { parse } from '@cluster/utils';
import { Binder } from '@core/Binder';
import { Binding } from '@core/types';

import { CommandContext } from '../CommandContext';
import { ScopedCommandBase } from '../ScopedCommandBase';
import * as bindings from './binding';
import { getLookupCache } from './lookupCache';
import { CommandVariableType, getSortOrder } from './parameterType';

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
    create(): Binding<CommandBinderState<TContext>>;
    add(parameter: CommandParameter | undefined, signature: CommandSignatureHandler<TContext>): void;
}

function buildBindings<TContext extends CommandContext>(
    signatures: Iterable<CommandSignatureHandler<TContext>>,
    depth: number
): ReadonlyArray<Binding<CommandBinderState<TContext>>> {
    const results = new Map<string, BindingBuilder<TContext>>();

    for (const signature of signatures) {
        const parameter = signature.parameters[depth] as CommandParameter | undefined;
        switch (parameter?.kind) {
            case undefined: {
                const key = sortKeys.execute();
                let builder = results.get(key);
                if (builder === undefined)
                    results.set(key, builder = createExecuteBindingBuilder());
                builder.add(undefined, signature);
                break;
            }
            case 'literal': {
                const key = sortKeys.literal();
                let builder = results.get(key);
                if (builder === undefined)
                    results.set(key, builder = createLiteralBindingBuilder(depth));
                builder.add(parameter, signature);
                break;
            }
            case 'singleVar': {
                const key = sortKeys.single(parameter);
                let builder = results.get(key);
                if (builder === undefined)
                    results.set(key, builder = createSingleVarBindingBuilder(parameter, depth));
                builder.add(parameter, signature);
                break;
            }
            case 'concatVar': {
                const key = sortKeys.concat(parameter);
                let builder = results.get(key);
                if (builder === undefined)
                    results.set(key, builder = createConcatVarBindingBuilder(parameter, depth));
                builder.add(parameter, signature);
                break;
            }
            case 'greedyVar': {
                const key = sortKeys.greedy(parameter);
                let builder = results.get(key);
                if (builder === undefined)
                    results.set(key, builder = createGreedyVarBindingBuilder(parameter, depth));
                builder.add(parameter, signature);
                break;
            }
        }
    }

    return [...results.entries()]
        .sort((a, b) => a[0] > b[0] ? 1 : -1)
        .map(x => x[1].create());

}

const sortKeys = {
    literal() {
        return '0';
    },
    single(parameter: CommandSingleParameter) {
        const typeOrder = getSortOrder(parameter.type);
        const fallbackOrder = parameter.fallback?.length.toString().padStart(10, '0') ?? ''.padStart(10, '-');
        const rawOrder = parameter.raw ? '0' : '1';
        return `1_${typeOrder}_0_${fallbackOrder}_${rawOrder}_${parameter.fallback ?? ''}`;
    },
    concat(parameter: CommandConcatParameter) {
        const typeOrder = getSortOrder(parameter.type);
        const fallbackOrder = parameter.fallback?.length.toString().padStart(10, '0') ?? ''.padStart(10, '-');
        const rawOrder = parameter.raw ? '0' : '1';
        return `1_${typeOrder}_1_${fallbackOrder}_${rawOrder}_${parameter.fallback ?? ''}`;
    },
    greedy(parameter: CommandGreedyParameter) {
        const typeOrder = getSortOrder(parameter.type);
        const minOrder = parameter.minLength.toString().padStart(10, '0');
        const rawOrder = parameter.raw ? '0' : '1';
        return `1_${typeOrder}_2_${minOrder}_${rawOrder}`;
    },
    execute() {
        return '9';
    }
};

function createExecuteBindingBuilder<TContext extends CommandContext>(): BindingBuilder<TContext> {
    let signature: CommandSignatureHandler<TContext> | undefined = undefined;

    return {
        create() {
            if (signature === undefined)
                throw new Error('No signature has been set');
            return new bindings.ExecuteCommandBinding(signature);
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
    return {
        create() {
            const options = mapKeys(signatureMap, (value) => buildBindings(value, depth + 1));
            const aliases = mapKeys(aliasMap, value => [...value]);
            return new bindings.SwitchBinding(options, aliases);
        },
        add(parameter, signature) {
            if (parameter === undefined)
                return;
            if (parameter.kind !== 'literal')
                throw new Error('Cannot merge a variable with a literal');
            (signatureMap[parameter.name] ??= new Set()).add(signature);
            for (const alias of parameter.alias)
                (aliasMap[alias] ??= new Set()).add(parameter.name);
        }
    };
}

function createSingleVarBindingBuilder<TContext extends CommandContext>(parameter: CommandSingleParameter, depth: number): BindingBuilder<TContext> {
    const next: Array<CommandSignatureHandler<TContext>> = [];

    return {
        create() {
            return new bindings.SingleBinding(
                parameter,
                buildBindings(next, depth + 1),
                typeParsers[parameter.type]
            );
        },
        add(parameter, signature) {
            if (parameter === undefined)
                return;
            if (parameter.kind !== 'singleVar')
                throw new Error('Can only merge single variables');
            next.push(signature);
        }
    };
}

function createConcatVarBindingBuilder<TContext extends CommandContext>(parameter: CommandConcatParameter, depth: number): BindingBuilder<TContext> {
    const next: Array<CommandSignatureHandler<TContext>> = [];

    return {
        create() {
            return new bindings.ConcatBinding(
                parameter,
                buildBindings(next, depth + 1),
                typeParsers[parameter.type]
            );
        },
        add(parameter, signature) {
            if (parameter === undefined)
                return;
            if (parameter.kind !== 'concatVar')
                throw new Error('Can only merge concat variables');
            next.push(signature);
        }
    };
}

function createGreedyVarBindingBuilder<TContext extends CommandContext>(parameter: CommandGreedyParameter, depth: number): BindingBuilder<TContext> {
    const nextMap: { [greedyMin: number]: Array<CommandSignatureHandler<TContext>>; } = {};

    return {
        create() {
            const next = mapKeys(nextMap, value => buildBindings(value, depth + 1));
            return new bindings.GreedyBinding(
                parameter.name,
                parameter.raw,
                next,
                typeParsers[parameter.type],
                parameter.type
            );
        },
        add(parameter, signature) {
            if (parameter === undefined)
                return;
            if (parameter.kind !== 'greedyVar')
                throw new Error('Can only merge greedy variables');

            (nextMap[parameter.minLength] ??= []).push(signature);
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

const typeParsers: {
    [P in CommandVariableType]: <TContext extends CommandContext>(value: string, state: CommandBinderState<TContext>) => Awaitable<CommandBinderParseResult<unknown>>
} = {
    string(value) {
        return { success: true, value };
    },
    bigint(value, state) {
        const result = parse.bigint(value);
        if (result === undefined)
            return { success: false, error: state.command.error(`\`${value}\` is not an integer`) };
        return { success: true, value: result };
    },
    integer(value, state) {
        const result = parse.int(value);
        if (isNaN(result))
            return { success: false, error: state.command.error(`\`${value}\` is not an integer`) };
        return { success: true, value: result };
    },
    number(value, state) {
        const result = parse.float(value);
        if (isNaN(result))
            return { success: false, error: state.command.error(`\`${value}\` is not a number`) };
        return { success: true, value: result };
    },
    boolean(value, state) {
        const result = parse.boolean(value);
        if (result === undefined)
            return { success: false, error: state.command.error(`\`${value}\` is not a boolean`) };
        return { success: true, value: result };
    },
    duration(value, state) {
        const result = parse.duration(value);
        if (result === undefined)
            return { success: false, error: state.command.error(`\`${value}\` is not a valid duration`) };
        return { success: true, value: result };
    },
    channel(value, state) {
        return state.lookupCache.findChannel(value);
    },
    user(value, state) {
        return state.lookupCache.findUser(value);
    },
    member(value, state) {
        return state.lookupCache.findMember(value);
    },
    role(value, state) {
        return state.lookupCache.findRole(value);
    }
};
