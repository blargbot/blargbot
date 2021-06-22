import { SubtagHandlerParameter, SubtagHandlerCallSignature, Statement } from '../types';
import { ExecutingSubtagArgumentValue, LiteralSubtagArgumentValue } from '../arguments';
import { ArgumentResolver, ArgumentResolverPermutations, ArgumentResolvers } from './types';


export function createArgumentResolvers(signature: SubtagHandlerCallSignature): ArgumentResolvers {
    const bindingOrder = createResolverOrder(signature.parameters);
    const result: ArgumentResolvers = { byTest: [], byNumber: {} };

    for (const { beforeGreedy, afterGreedy } of bindingOrder.permutations) {
        const parameterCount = beforeGreedy.length + afterGreedy.length;
        if (parameterCount in result.byNumber)
            throw new Error(`Multiple parameter patterns accept ${parameterCount} values`);
        result.byNumber[parameterCount] = createResolver(signature.parameters, beforeGreedy, [], afterGreedy);
    }

    if (bindingOrder.greedy.length > 0) {
        const parameterLengths = bindingOrder.permutations.map(p => p.beforeGreedy.length + p.afterGreedy.length).sort();
        if (Math.max(...parameterLengths) - Math.min(...parameterLengths) >= bindingOrder.greedy.length)
            throw new Error('There must be fewer optional parameters than the number of repeated parameters!');

        for (const { beforeGreedy, afterGreedy } of bindingOrder.permutations) {
            result.byTest.push(createGreedyResolver(signature.parameters, beforeGreedy, bindingOrder.greedy, afterGreedy));
        }
    }

    return result;
}

function createResolverOrder(parameters: readonly SubtagHandlerParameter[]): ArgumentResolverPermutations {
    const result: ArgumentResolverPermutations = {
        greedy: [],
        permutations: [{ beforeGreedy: [], afterGreedy: [] }]
    };

    for (const parameter of parameters) {
        addParameter(result, parameter);
    }

    return result;
}

function addParameter(result: ArgumentResolverPermutations, parameter: SubtagHandlerParameter): void {
    if (parameter.greedy !== null) {
        if (result.greedy.length > 0) {
            throw new Error('Cannot have multiple greedy parameters!');
        }
        const nestedParameters = parameter.nested.length == 0 ? [parameter] : [...flattenGreedyArgs(parameter.nested)];
        result.greedy.push(...nestedParameters);
        for (let i = 0; i < parameter.greedy; i++) {
            for (const signature of result.permutations) {
                signature.beforeGreedy.push(...nestedParameters);
            }
        }
        return;
    }
    const preserve = parameter.required ? [] : <ArgumentResolverPermutations['permutations']>result.permutations.map(x => ({
        beforeGreedy: [...x.beforeGreedy],
        afterGreedy: [...x.afterGreedy]
    }));

    if (parameter.nested.length > 0) {
        for (const nestedArg of parameter.nested) {
            addParameter(result, nestedArg);
        }
    } else if (result.greedy.length > 0) {
        for (const { afterGreedy: afterParams } of result.permutations) {
            afterParams.push(parameter);
        }
    } else {
        for (const { beforeGreedy: beforeParams } of result.permutations) {
            beforeParams.push(parameter);
        }
    }

    result.permutations.push(...preserve);
}

function createResolver(
    parameters: readonly SubtagHandlerParameter[],
    beforeGreedy: readonly SubtagHandlerParameter[],
    greedy: readonly SubtagHandlerParameter[],
    afterGreedy: readonly SubtagHandlerParameter[])
    : ArgumentResolver {
    const defaultArgs = parameters.map(param => new LiteralSubtagArgumentValue(param.defaultValue ?? ''));
    return async function* resolve(context, args) {
        let i = 0;
        for (const { arg, param } of matchArgs(args, beforeGreedy, greedy, afterGreedy)) {
            const paramIndex = parameters.indexOf(param);
            for (; i < paramIndex; i++)
                yield defaultArgs[i];
            i = paramIndex + 1;

            const argValue = new ExecutingSubtagArgumentValue(context, arg, param.defaultValue);
            if (param.autoResolve)
                await argValue.wait();
            yield argValue;
        }

        for (; i < defaultArgs.length; i++)
            yield defaultArgs[i];
    };
}

function createGreedyResolver(
    parameters: readonly SubtagHandlerParameter[],
    beforeGreedy: readonly SubtagHandlerParameter[],
    greedy: readonly SubtagHandlerParameter[],
    afterGreedy: readonly SubtagHandlerParameter[])
    : ArgumentResolvers['byTest'][number] {
    const minCount = beforeGreedy.length + afterGreedy.length;
    return {
        minArgCount: minCount,
        maxArgCount: Number.MAX_SAFE_INTEGER,
        test: argCount => argCount >= minCount && (argCount - minCount) % greedy.length === 0,
        resolver: createResolver(parameters, beforeGreedy, greedy, afterGreedy)
    };
}

function* matchArgs(
    args: readonly Statement[],
    beforeGreedy: readonly SubtagHandlerParameter[],
    greedy: readonly SubtagHandlerParameter[],
    afterGreedy: readonly SubtagHandlerParameter[])
    : Generator<{ arg: Statement, param: SubtagHandlerParameter }> {
    let i, j;
    for (i = 0; i < beforeGreedy.length; i++)
        yield { arg: args[i], param: beforeGreedy[i] };
    for (j = 0; i < args.length - afterGreedy.length; i++, j++)
        yield { arg: args[i], param: greedy[j % greedy.length] };
    for (j = 0; i < args.length; i++, j++)
        yield { arg: args[i], param: afterGreedy[j] };
}

function* flattenGreedyArgs(parameters: readonly SubtagHandlerParameter[]): Generator<SubtagHandlerParameter> {
    for (const parameter of parameters) {
        if (!parameter.required)
            throw new Error('Cannot have optional parameters inside a greedy parameter');

        if (parameter.greedy)
            throw new Error('Cannot have greedy parameters inside a greedy parameter');

        if (parameter.nested)
            yield* flattenGreedyArgs(parameter.nested);
        else
            yield parameter;
    }
}