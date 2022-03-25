import { BBTagContext } from '../BBTagContext';
import { BBTagRuntimeError, NotEnoughArgumentsError, TooManyArgumentsError } from '../errors';
import { SubtagCall } from '../language';
import { SubtagSignatureDetails } from '../types';
import { ArgumentResolver } from './ArgumentResolver';
import { CompositeSubtagHandler } from './CompositeSubtagHandler';
import { ConditionalSubtagHandler } from './ConditionalSubtagHandler';
import { createArgumentResolvers } from './createResolvers';
import { SubtagHandlerCallSignature } from './SubtagHandlerCallSignature';

export function compileSignatures(signatures: ReadonlyArray<SubtagHandlerCallSignature | SubtagSignatureDetails>): CompositeSubtagHandler {
    const handlers: ConditionalSubtagHandler[] = [];
    let min = initialResolver;
    let max = initialResolver;

    for (const signature of signatures) {
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
            const handler = handlers.find(handler => handler.canHandle(call));

            if (handler !== undefined)
                return handler.execute(context, subtagName, call);
            if (call.args.length < min.minArgs)
                return resolveAndThrow(context, subtagName, call, min, new NotEnoughArgumentsError(min.minArgs, call.args.length));
            if (call.args.length > max.maxArgs)
                return resolveAndThrow(context, subtagName, call, max, new TooManyArgumentsError(max.maxArgs, call.args.length));

            throw new Error(`Missing handler for ${call.args.length} arguments!`);
        }
    };
}

function createConditionalHandler(signature: SubtagHandlerCallSignature, resolver: ArgumentResolver): ConditionalSubtagHandler {
    return {
        canHandle(subtag) {
            return resolver.isExactMatch(subtag);
        },
        async * execute(context, subtagName, call) {
            const args = [];
            for (const arg of resolver.resolve(context, subtagName, call)) {
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

async function* resolveAndThrow(context: BBTagContext, subtagName: string, call: SubtagCall, resolver: ArgumentResolver, error: BBTagRuntimeError): AsyncIterable<undefined> {
    for (const arg of resolver.resolve(context, subtagName, call)) {
        if (arg.parameter.autoResolve) {
            await arg.execute();
            yield undefined;
        }
    }
    throw error;
}
