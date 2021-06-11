import { SubtagArgumentValue as ISubtagArgument, SubtagHandlerArgument, SubtagHandlerCallSignature } from '../types';

export type ArgumentResolver = (args: ISubtagArgument[]) => Promise<void>;

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

    for (const { beforeParams, afterParams } of bindingOrder.singles) {
        const args = [...beforeParams, ...afterParams];
        if (args.length in result.byNumber)
            throw new Error(`Multiple argument patterns accept ${args.length} values`);
        result.byNumber[args.length] = createResolver(args);
    }

    if (bindingOrder.params.length > 0) {
        const argLengths = bindingOrder.singles.map(p => p.beforeParams.length + p.afterParams.length).sort();
        if (Math.max(...argLengths) - Math.min(...argLengths) >= bindingOrder.params.length)
            throw new Error('There must be fewer optional parameters than the number of repeated arguments!');

        for (const { beforeParams, afterParams } of bindingOrder.singles) {
            result.byTest.push(createParamsResolver(beforeParams, bindingOrder.params, afterParams));
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
    if (arg.greedy) {
        if (result.params.length > 0) {
            throw new Error('Cannot have multiple greedy parameters!');
        }
        const repeatedArgs = arg.nestedArgs.length == 0 ? [arg] : [...flattenGreedyArgs(arg.nestedArgs)];
        result.params.push(...repeatedArgs);
        if (arg.required) {
            for (const signature of result.singles) {
                signature.beforeParams.push(...repeatedArgs);
            }
        }
        return;
    }
    const preserve = result.singles.map(x => ({ beforeParams: [...x.beforeParams], afterParams: [...x.afterParams] }));

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

    if (!arg.required) {
        result.singles.push(...preserve);
    }
}

function createResolver(args: SubtagHandlerArgument[]): ArgumentResolver {
    let i = 0;
    const awaits = args.map(arg => ({ autoResolve: arg.autoResolve, index: i++ }))
        .filter(x => x.autoResolve)
        .map(x => `await args[${x.index}].wait();`);

    return eval(`async args => {\n${awaits.join('\n')}\n}`);
}

function createParamsResolver(
    beforeParams: SubtagHandlerArgument[],
    params: SubtagHandlerArgument[],
    afterParams: SubtagHandlerArgument[])
    : ArgumentResolvers['byTest'][number] {
    const minCount = beforeParams.length + afterParams.length;
    return {
        minArgCount: minCount,
        maxArgCount: Number.MAX_SAFE_INTEGER,
        test: argCount => argCount >= minCount && (argCount - minCount) % params.length === 0,
        resolver: async (args) => {
            let i = 0, j;
            for (j = 0; i < beforeParams.length; i++, j++)
                if (beforeParams[j].autoResolve)
                    await args[i].wait();
            for (j = 0; i < args.length - afterParams.length; i++, j++)
                if (params[j % params.length].autoResolve)
                    await args[i].wait();
            for (j = 0; i < args.length; i++, j++)
                if (afterParams[j].autoResolve)
                    await args[i].wait();
        }
    };
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

