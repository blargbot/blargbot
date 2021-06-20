import { SubtagArgumentValue as ISubtagArgument, SubtagHandlerParameter, SubtagHandlerCallSignature } from '../types';
import { DefaultingSubtagArgumentValue } from './DefaultingSubtagArgumentValue';

export type ArgumentResolver = (args: readonly ISubtagArgument[]) => AsyncGenerator<ISubtagArgument>;

interface ArgumentResolvers {
    byNumber: { [argLength: number]: ArgumentResolver };
    byTest: Array<{ resolver: ArgumentResolver, test: (argCount: number) => boolean, minArgCount: number, maxArgCount: number, }>;
}

interface ArgumentResolverOrder {
    greedy: SubtagHandlerParameter[];
    permutations: Array<{
        beforeGreedy: SubtagHandlerParameter[],
        afterGreedy: SubtagHandlerParameter[]
    }>;
}

export function createArgumentResolver(signature: SubtagHandlerCallSignature): ArgumentResolvers {
    const bindingOrder = createResolverOrder(signature.parameters);
    const result: ArgumentResolvers = { byTest: [], byNumber: {} };
    const defaultArgMap = signature.parameters.map(param => ({
        param,
        arg: Object.seal(<ISubtagArgument>{
            code: [],
            isCached: true,
            raw: '',
            value: param.defaultValue ?? '',
            wait() { return Promise.resolve(this.value); },
            execute() { return Promise.resolve(this.value); }
        })
    }));

    for (const { beforeGreedy, afterGreedy } of bindingOrder.permutations) {
        const parameterCount = beforeGreedy.length + afterGreedy.length;
        if (parameterCount in result.byNumber)
            throw new Error(`Multiple parameter patterns accept ${parameterCount} values`);
        result.byNumber[parameterCount] = createResolver(defaultArgMap, beforeGreedy, [], afterGreedy);
    }

    if (bindingOrder.greedy.length > 0) {
        const parameterLengths = bindingOrder.permutations.map(p => p.beforeGreedy.length + p.afterGreedy.length).sort();
        if (Math.max(...parameterLengths) - Math.min(...parameterLengths) >= bindingOrder.greedy.length)
            throw new Error('There must be fewer optional parameters than the number of repeated parameters!');

        for (const { beforeGreedy, afterGreedy } of bindingOrder.permutations) {
            result.byTest.push(createGreedyResolver(defaultArgMap, beforeGreedy, bindingOrder.greedy, afterGreedy));
        }
    }

    return result;
}

function createResolverOrder(parameters: readonly SubtagHandlerParameter[]): ArgumentResolverOrder {
    const result: ArgumentResolverOrder = {
        greedy: [],
        permutations: [{ beforeGreedy: [], afterGreedy: [] }]
    };

    for (const parameter of parameters) {
        addParameter(result, parameter);
    }

    return result;
}

function addParameter(result: ArgumentResolverOrder, parameter: SubtagHandlerParameter): void {
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
    const preserve = parameter.required ? [] : <ArgumentResolverOrder['permutations']>result.permutations.map(x => ({
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
    defaultArgs: ReadonlyArray<{ arg: ISubtagArgument, param: SubtagHandlerParameter }>,
    beforeGreedy: readonly SubtagHandlerParameter[],
    greedy: readonly SubtagHandlerParameter[],
    afterGreedy: readonly SubtagHandlerParameter[])
    : ArgumentResolver {
    return async function* resolve(args) {
        let i = 0;
        for (const { arg, param } of matchArgs(args, beforeGreedy, greedy, afterGreedy)) {
            if (param.autoResolve)
                await arg.wait();

            while (defaultArgs[i++].param !== param)
                yield defaultArgs[i - 1].arg;

            yield param.defaultValue !== null
                ? new DefaultingSubtagArgumentValue(arg, param.defaultValue)
                : arg;
        }
    };
}

function createGreedyResolver(
    defaultArgs: ReadonlyArray<{ arg: ISubtagArgument, param: SubtagHandlerParameter }>,
    beforeGreedy: readonly SubtagHandlerParameter[],
    greedy: readonly SubtagHandlerParameter[],
    afterGreedy: readonly SubtagHandlerParameter[])
    : ArgumentResolvers['byTest'][number] {
    const minCount = beforeGreedy.length + afterGreedy.length;
    return {
        minArgCount: minCount,
        maxArgCount: Number.MAX_SAFE_INTEGER,
        test: argCount => argCount >= minCount && (argCount - minCount) % greedy.length === 0,
        resolver: createResolver(defaultArgs, beforeGreedy, greedy, afterGreedy)
    };
}

function* matchArgs(
    args: readonly ISubtagArgument[],
    beforeGreedy: readonly SubtagHandlerParameter[],
    greedy: readonly SubtagHandlerParameter[],
    afterGreedy: readonly SubtagHandlerParameter[])
    : Generator<{ arg: ISubtagArgument, param: SubtagHandlerParameter }> {
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

