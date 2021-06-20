import { SubtagArgumentValue as ISubtagArgument, SubtagHandlerArgument, SubtagHandlerCallSignature } from '../types';
import { DefaultingSubtagArgumentValue } from './SubtagArgumentValue';

export type ArgumentResolver = (args: readonly ISubtagArgument[]) => AsyncGenerator<ISubtagArgument>;

interface ArgumentResolvers {
    byNumber: { [argLength: number]: ArgumentResolver };
    byTest: Array<{ resolver: ArgumentResolver, test: (argCount: number) => boolean, minArgCount: number, maxArgCount: number, }>;
}

interface ArgumentResolverOrder {
    params: SubtagHandlerArgument[];
    singles: Array<{
        beforeParams: SubtagHandlerArgument[],
        afterParams: SubtagHandlerArgument[]
    }>;
}

export function createArgumentResolver(signature: SubtagHandlerCallSignature): ArgumentResolvers {
    const bindingOrder = createResolverOrder(signature.args);
    const result: ArgumentResolvers = { byTest: [], byNumber: {} };
    const defaultArgMap = signature.args.map(param => ({
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

    for (const { beforeParams, afterParams } of bindingOrder.singles) {
        const args = [...beforeParams, ...afterParams];
        if (args.length in result.byNumber)
            throw new Error(`Multiple argument patterns accept ${args.length} values`);
        result.byNumber[args.length] = createResolver(defaultArgMap, beforeParams, [], afterParams);
    }

    if (bindingOrder.params.length > 0) {
        const argLengths = bindingOrder.singles.map(p => p.beforeParams.length + p.afterParams.length).sort();
        if (Math.max(...argLengths) - Math.min(...argLengths) >= bindingOrder.params.length)
            throw new Error('There must be fewer optional parameters than the number of repeated arguments!');

        for (const { beforeParams, afterParams } of bindingOrder.singles) {
            result.byTest.push(createParamsResolver(defaultArgMap, beforeParams, bindingOrder.params, afterParams));
        }
    }

    return result;
}

function createResolverOrder(args: readonly SubtagHandlerArgument[]): ArgumentResolverOrder {
    const result: ArgumentResolverOrder = {
        params: [],
        singles: [{ beforeParams: [], afterParams: [] }]
    };

    for (const arg of args) {
        addArg(result, arg);
    }

    return result;
}

function addArg(result: ArgumentResolverOrder, arg: SubtagHandlerArgument): void {
    if (arg.greedy !== null) {
        if (result.params.length > 0) {
            throw new Error('Cannot have multiple greedy parameters!');
        }
        const repeatedArgs = arg.nestedArgs.length == 0 ? [arg] : [...flattenGreedyArgs(arg.nestedArgs)];
        result.params.push(...repeatedArgs);
        for (let i = 0; i < arg.greedy; i++) {
            for (const signature of result.singles) {
                signature.beforeParams.push(...repeatedArgs);
            }
        }
        return;
    }
    const preserve = arg.required ? [] : result.singles.map(x => ({
        beforeParams: [...x.beforeParams],
        afterParams: [...x.afterParams]
    }));

    if (arg.nestedArgs.length > 0) {
        for (const nestedArg of arg.nestedArgs) {
            addArg(result, nestedArg);
        }
    } else if (result.params.length > 0) {
        for (const { afterParams } of result.singles) {
            afterParams.push(arg);
        }
    } else {
        for (const { beforeParams } of result.singles) {
            beforeParams.push(arg);
        }
    }

    result.singles.push(...preserve);
}

function createResolver(
    defaultArgs: ReadonlyArray<{ arg: ISubtagArgument, param: SubtagHandlerArgument }>,
    beforeParams: readonly SubtagHandlerArgument[],
    params: readonly SubtagHandlerArgument[] = [],
    afterParams: readonly SubtagHandlerArgument[] = [])
    : ArgumentResolver {
    return async function* resolve(args) {
        let i = 0;
        for (const { arg, param } of matchArgs(args, beforeParams, params, afterParams)) {
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

function createParamsResolver(
    defaultArgs: ReadonlyArray<{ arg: ISubtagArgument, param: SubtagHandlerArgument }>,
    beforeParams: readonly SubtagHandlerArgument[],
    params: readonly SubtagHandlerArgument[],
    afterParams: readonly SubtagHandlerArgument[])
    : ArgumentResolvers['byTest'][number] {
    const minCount = beforeParams.length + afterParams.length;
    return {
        minArgCount: minCount,
        maxArgCount: Number.MAX_SAFE_INTEGER,
        test: argCount => argCount >= minCount && (argCount - minCount) % params.length === 0,
        resolver: createResolver(defaultArgs, beforeParams, params, afterParams)
    };
}

function* matchArgs(
    args: readonly ISubtagArgument[],
    beforeParams: readonly SubtagHandlerArgument[],
    params: readonly SubtagHandlerArgument[],
    afterParams: readonly SubtagHandlerArgument[])
    : Generator<{ arg: ISubtagArgument, param: SubtagHandlerArgument }> {
    let i, j;
    for (i = 0; i < beforeParams.length; i++)
        yield { arg: args[i], param: beforeParams[i] };
    for (j = 0; i < args.length - afterParams.length; i++, j++)
        yield { arg: args[i], param: params[j % params.length] };
    for (j = 0; i < args.length; i++, j++)
        yield { arg: args[i], param: afterParams[j] };
}

function* flattenGreedyArgs(args: readonly SubtagHandlerArgument[]): Generator<SubtagHandlerArgument> {
    for (const arg of args) {
        if (!arg.required)
            throw new Error('Cannot have optional arguments inside a greedy argument');
        if (arg.greedy)
            throw new Error('Cannot have greedy arguments inside a greedy argument');

        if (arg.nestedArgs)
            yield* flattenGreedyArgs(arg.nestedArgs);
        else
            yield arg;
    }
}

