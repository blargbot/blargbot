import type { BBTagContext } from '../BBTagContext.js';
import type { BBTagRuntimeError} from '../errors/index.js';
import { NotEnoughArgumentsError, TooManyArgumentsError } from '../errors/index.js';
import type { SubtagCall } from '../language/index.js';
import type { ArgumentResolver } from './ArgumentResolver.js';
import type { CompositeSubtagHandler } from './CompositeSubtagHandler.js';
import type { ConditionalSubtagHandler } from './ConditionalSubtagHandler.js';
import { createArgumentResolvers } from './createResolvers.js';
import type { SubtagSignatureCallable } from './SubtagSignatureCallable.js';

export function compileSignatures(signatures: readonly SubtagSignatureCallable[]): CompositeSubtagHandler {
    const handlers: ConditionalSubtagHandler[] = [];
    let min = initialResolver;
    let max = initialResolver;

    // Named signatures first as they are more restrictive
    const orderedSignatures = [...signatures].sort((a, b) => a.subtagName === b.subtagName ? 0 : a.subtagName === undefined ? 1 : -1);

    for (const signature of orderedSignatures) {
        if (!('implementation' in signature))
            continue;
        for (const resolver of createArgumentResolvers(signature)) {
            if (resolver.minArgs < min.minArgs)
                min = resolver;
            if (resolver.maxArgs > max.maxArgs)
                max = resolver;
            const handler = createConditionalHandler(signature, resolver);
            handlers.push(handler);
        }
    }

    return {
        handlers,
        execute(context, subtagName, call) {
            const handler = handlers.find(handler => handler.canHandle(call, subtagName));

            if (handler !== undefined)
                return handler.execute(context, subtagName, call);
            if (call.args.length < min.minArgs)
                return resolveAndThrow(context, call, min, new NotEnoughArgumentsError(min.minArgs, call.args.length));
            if (call.args.length > max.maxArgs)
                return resolveAndThrow(context, call, max, new TooManyArgumentsError(max.maxArgs, call.args.length));

            throw new Error(`Missing handler for ${call.args.length} arguments!`);
        }
    };
}

function createConditionalHandler(signature: SubtagSignatureCallable, resolver: ArgumentResolver): ConditionalSubtagHandler {
    const name = signature.subtagName?.toLowerCase();

    return {
        canHandle: name === undefined
            ? subtag => resolver.isExactMatch(subtag)
            : (subtag, subtagName) => subtagName.toLowerCase() === name && resolver.isExactMatch(subtag),
        async * execute(context, subtagName, call) {
            const args = [];
            for (const arg of resolver.resolve(context, call)) {
                args.push(arg);
                if (arg.parameter.autoResolve)
                    await arg.execute();
            }
            yield* signature.implementation.execute(context, Object.assign(args, { subtagName }), call);
        }
    };
}

const initialResolver: ArgumentResolver = {
    minArgs: Infinity,
    maxArgs: -Infinity,
    isExactMatch() { return false; },
    resolve() {
        throw new Error('Unable to determine how to resolve this call!');
    }
};

async function* resolveAndThrow(context: BBTagContext, call: SubtagCall, resolver: ArgumentResolver, error: BBTagRuntimeError): AsyncIterable<undefined> {
    for (const arg of resolver.resolve(context, call)) {
        if (arg.parameter.autoResolve) {
            await arg.execute();
            yield undefined;
        }
    }
    throw error;
}
