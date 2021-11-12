import { ArgumentResolver, ArgumentResolverPermutations, ArgumentResolvers, Statement, SubtagArgument, SubtagHandlerCallSignature, SubtagHandlerParameter, SubtagHandlerValueParameter } from '@cluster/types';

import { DefaultSubtagArgumentValue, ExecutingSubtagArgumentValue } from '../arguments';

export function createArgumentResolvers(signature: SubtagHandlerCallSignature): ArgumentResolvers {
    const flatParams = [...flatParameters(signature.parameters)];
    const defaultArgs = flatParams.map(p => new DefaultSubtagArgumentValue(p));
    const bindingOrder = createResolverOrder(signature.parameters, flatParams);
    const result: ArgumentResolvers = { byTest: [], byNumber: {} };

    for (const { beforeGreedy, afterGreedy } of bindingOrder.permutations) {
        const parameterCount = beforeGreedy.length + afterGreedy.length;
        if (parameterCount in result.byNumber)
            throw new Error(`Multiple parameter patterns accept ${parameterCount} values`);
        result.byNumber[parameterCount] = createResolver(parameterCount, defaultArgs, beforeGreedy, [], afterGreedy);
    }

    if (bindingOrder.greedy.length > 0) {
        const parameterLengths = bindingOrder.permutations.map(p => p.beforeGreedy.length + p.afterGreedy.length).sort();
        if (Math.max(...parameterLengths) - Math.min(...parameterLengths) >= bindingOrder.greedy.length)
            throw new Error('There must be fewer optional parameters than the number of repeated parameters!');

        for (const { beforeGreedy, afterGreedy } of bindingOrder.permutations) {
            result.byTest.push(createVariableResolver(defaultArgs, beforeGreedy, bindingOrder.greedy, afterGreedy));
        }
    }

    return result;
}

function* flatParameters(parameters: Iterable<SubtagHandlerParameter>): Generator<SubtagHandlerValueParameter> {
    for (const parameter of parameters) {
        if ('nested' in parameter)
            yield* flatParameters(parameter.nested);
        else
            yield parameter;
    }
}

function createResolverOrder(parameters: readonly SubtagHandlerParameter[], flatParameters: readonly SubtagHandlerValueParameter[]): ArgumentResolverPermutations {
    const result: ArgumentResolverPermutations = {
        greedy: [],
        permutations: [{ beforeGreedy: [], afterGreedy: [] }]
    };

    for (const parameter of parameters) {
        addParameter(result, parameter, flatParameters);
    }

    return result;
}

function addParameter(result: ArgumentResolverPermutations, parameter: SubtagHandlerParameter, flatParameters: readonly SubtagHandlerValueParameter[]): void {
    if ('nested' in parameter) {
        if (result.greedy.length > 0) {
            throw new Error('Cannot have multiple greedy parameters!');
        }
        const nestedIndexes = parameter.nested.map(p => flatParameters.indexOf(p));
        result.greedy.push(...nestedIndexes);
        for (let i = 0; i < parameter.minRepeats; i++) {
            for (const signature of result.permutations) {
                signature.beforeGreedy.push(...nestedIndexes);
            }
        }
        return;
    }

    const preserve = parameter.required ? [] : result.permutations.map(x => ({
        beforeGreedy: [...x.beforeGreedy],
        afterGreedy: [...x.afterGreedy]
    }));

    if (result.greedy.length > 0) {
        for (const { afterGreedy: afterParams } of result.permutations) {
            afterParams.push(flatParameters.indexOf(parameter));
        }
    } else {
        for (const { beforeGreedy: beforeParams } of result.permutations) {
            beforeParams.push(flatParameters.indexOf(parameter));
        }
    }

    result.permutations.push(...preserve);
}

function createResolver(
    argCount: number,
    defaultArgs: readonly SubtagArgument[],
    beforeGreedy: readonly number[],
    greedy: readonly number[],
    afterGreedy: readonly number[])
    : ArgumentResolver {
    const parameterMap = [...getParameterMap(argCount, defaultArgs, beforeGreedy, greedy, afterGreedy)];

    return {
        * resolve(context, subtagName, call) {
            for (const item of parameterMap) {
                const arg = call.args[item.argIndex] as Statement | undefined;
                if (arg === undefined)
                    yield item.default;
                else
                    yield new ExecutingSubtagArgumentValue(item.default.parameter, context, subtagName, call, arg);
            }
        }
    };
}

function createVariableResolver(
    parameters: readonly SubtagArgument[],
    beforeGreedy: readonly number[],
    greedy: readonly number[],
    afterGreedy: readonly number[])
    : ArgumentResolvers['byTest'][number] {
    const minCount = beforeGreedy.length + afterGreedy.length;
    const resolverCache = {} as Record<number, ArgumentResolver | undefined>;

    return {
        minArgCount: minCount,
        maxArgCount: Number.MAX_SAFE_INTEGER,
        test(argCount) {
            return argCount >= minCount && (argCount - minCount) % greedy.length === 0;
        },
        resolve(context, subtagName, call) {
            const resolver = resolverCache[call.args.length] ??= createResolver(call.args.length, parameters, beforeGreedy, greedy, afterGreedy);
            return resolver.resolve(context, subtagName, call);
        }
    };
}

function* getParameterMap(
    argCount: number,
    defaultArgs: readonly SubtagArgument[],
    beforeGreedy: readonly number[],
    greedy: readonly number[],
    afterGreedy: readonly number[]
): Generator<{ readonly argIndex: number; readonly default: SubtagArgument; }> {
    let param = 0;
    let arg = 0;
    for (const next of getParameterOrder(argCount, beforeGreedy, greedy, afterGreedy)) {
        for (; param < next - 1; param++)
            yield { argIndex: -1, default: defaultArgs[param] };
        yield { argIndex: arg++, default: defaultArgs[param = next] };
    }

    for (param++; param < defaultArgs.length; param++)
        yield { argIndex: -1, default: defaultArgs[param] };
}

function* getParameterOrder(
    argCount: number,
    beforeGreedy: readonly number[],
    greedy: readonly number[],
    afterGreedy: readonly number[]
): Generator<number, void, undefined> {
    if (greedy.length === 0) {
        if (argCount !== beforeGreedy.length + afterGreedy.length)
            throw new Error('Invalid argument count');
        yield* beforeGreedy;
        yield* afterGreedy;
    } else {
        const greedyRepeats = (argCount - beforeGreedy.length - afterGreedy.length) / greedy.length;
        if (greedyRepeats % 1 !== 0)
            throw new Error('Invalid argument count');
        yield* beforeGreedy;
        for (let i = 0; i < greedyRepeats; i++)
            yield* greedy;
        yield* afterGreedy;
    }
}
