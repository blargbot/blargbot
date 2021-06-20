import { BBTagContext } from '../BBTagContext';
import { SubtagCall, SubtagHandler, SubtagHandlerCallSignature, SubtagResult } from '../types';
import { ArgumentResolver, createArgumentResolver } from './createResolvers';
import { SubtagArgumentValue } from './SubtagArgumentValue';

type SubHandler = (context: BBTagContext, subtagName: string, call: SubtagCall) => Promise<SubtagResult>;

interface SubHandlerCollection {
    byNumber: { [argLength: number]: SubHandler };
    byTest: Array<{ execute: SubHandler, test: (argCount: number) => boolean }>;
}

export function compileSignatures(signatures: readonly SubtagHandlerCallSignature[]): SubtagHandler {
    const binding: SubHandlerCollection = { byNumber: {}, byTest: [] };
    let minArgs = Number.MAX_SAFE_INTEGER;
    let maxArgs = 0;

    for (const signature of signatures) {
        const { byTest, byNumber } = createArgumentResolver(signature);
        for (const entry of byTest) {
            minArgs = Math.min(minArgs, entry.minArgCount);
            maxArgs = Math.max(maxArgs, entry.maxArgCount);
            binding.byTest.push({ test: entry.test, execute: createSubHandler(signature, entry.resolver) });
        }

        for (const argLength of Object.keys(byNumber).map(i => parseInt(i))) {
            if (argLength in binding.byNumber)
                throw new Error(`arglength ${argLength} has more than 1 matching pattern!`);
            binding.byNumber[argLength] = createSubHandler(signature, byNumber[argLength]);
            minArgs = Math.min(minArgs, argLength);
            maxArgs = Math.max(maxArgs, argLength);
        }
    }

    return {
        async execute(context, subtagName, call) {
            const execute = binding.byNumber[call.args.length]
                ?? binding.byTest.find(({ test }) => test(call.args.length))?.execute;

            if (execute !== undefined)
                return await execute(context, subtagName, call);

            if (call.args.length < minArgs)
                return context.addError('Not enough arguments', call, `Expected at least ${minArgs} arguments but got ${call.args.length}`);
            else if (call.args.length > maxArgs)
                return context.addError('Too many arguments', call, `Expected ${maxArgs} arguments or fewer but got ${call.args.length}`);

            else
                throw new Error(`Missing handler for ${call.args.length} arguments!`);
        }
    };
}

function createSubHandler(signature: SubtagHandlerCallSignature, resolver: ArgumentResolver): SubHandler {
    return async (context, subtagName, call) => {
        const rawArgs = call.args.map(arg => new SubtagArgumentValue(context, arg));
        const args = [];
        for await (const arg of resolver(rawArgs))
            args.push(arg);

        return await signature.execute(context, Object.assign(args, { subtagName }), call);
    };
}