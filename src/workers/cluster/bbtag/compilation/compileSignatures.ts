import { ArgumentResolver, CompositeSubtagHandler, ConditionalSubtagHandler, SubtagHandlerCallSignature } from '@cluster/types';

import { NotEnoughArgumentsError, TooManyArgumentsError } from '../errors';
import { createArgumentResolvers } from './createResolvers';

export function compileSignatures(signatures: readonly SubtagHandlerCallSignature[]): CompositeSubtagHandler {
    const handlers: ConditionalSubtagHandler[] = [];
    let minArgs = Number.MAX_SAFE_INTEGER;
    let maxArgs = 0;

    for (const signature of signatures) {
        for (const resolver of createArgumentResolvers(signature)) {
            minArgs = Math.min(minArgs, resolver.argRange[0]);
            maxArgs = Math.max(maxArgs, resolver.argRange[1]);
            const handler = createConditionalHandler(signature, resolver);
            handlers.push(handler);
        }
    }

    const autoResolveOnFail = signatures.every(s => s.parameters.every(p => 'nested' in p ? p.nested.every(p => p.autoResolve) : p.autoResolve));

    return {
        handlers,
        execute(context, subtagName, call) {
            const handler = handlers.find(handler => handler.canHandle(call));

            if (handler !== undefined)
                return handler.execute(context, subtagName, call);

            return {
                async *[Symbol.asyncIterator]() {
                    if (autoResolveOnFail) {
                        for (const arg of call.args) {
                            await context.eval(arg);
                            yield undefined;
                        }
                    }

                    if (call.args.length < minArgs)
                        throw new NotEnoughArgumentsError(minArgs, call.args.length);
                    else if (call.args.length > maxArgs)
                        throw new TooManyArgumentsError(maxArgs, call.args.length);
                    throw new Error(`Missing handler for ${call.args.length} arguments!`);
                }
            };

        }
    };
}

function createConditionalHandler(signature: SubtagHandlerCallSignature, resolver: ArgumentResolver): ConditionalSubtagHandler {
    return {
        canHandle(subtag) {
            return resolver.canResolve(subtag);
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
