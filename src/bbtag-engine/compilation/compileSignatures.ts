import type { BBTagContext } from '../BBTagContext.js';
import { BBTagRuntimeError, NotEnoughArgumentsError, TooManyArgumentsError } from '../BBTagRuntimeError.js';
import type { BBTagSubtag } from '../language/index.js';
import type { ArgumentResolver } from './ArgumentResolver.js';
import type { CompiledBBTagReplacer } from './CompiledBBTagReplacer.js';
import type { ConditionalBBTagReplacer } from './ConditionalBBTagReplacer.js';
import { createArgumentResolvers } from './createResolvers.js';
import type { SubtagSignatureCallable } from './SubtagSignatureCallable.js';

export function compileSignatures<Locals extends object>(names: string[], signatures: ReadonlyArray<SubtagSignatureCallable<Locals>>): CompiledBBTagReplacer<Locals> {
    const handlers: Array<ConditionalBBTagReplacer<Locals>> = [];
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

    const result: CompiledBBTagReplacer<Locals> = {
        name: names[0] ?? null,
        aliases: new Set(names.slice(1)),
        handlers: handlers,
        replace(context, subtagName, call) {
            const handler = handlers.find(handler => handler.canHandle(call, subtagName));

            if (handler !== undefined)
                return handler.replace(context, subtagName, call);
            if (call.args.length < min.minArgs)
                return resolveAndThrow(context, call, min, new NotEnoughArgumentsError(min.minArgs, call.args.length));
            if (call.args.length > max.maxArgs)
                return resolveAndThrow(context, call, max, new TooManyArgumentsError(max.maxArgs, call.args.length));

            throw new Error(`Missing handler for ${call.args.length} arguments!`);
        }
    };
    Object.defineProperty(result.replace, 'name', { value: names[0] });
    return result;
}

function createConditionalHandler<Locals extends object>(signature: SubtagSignatureCallable<Locals>, resolver: ArgumentResolver<Locals>): ConditionalBBTagReplacer<Locals> {
    const name = signature.subtagName?.toLowerCase();
    const implementation = signature.implementation;

    return {
        id: signature.id,
        name: name ?? null,
        aliases: new Set([name].filter(v => v !== undefined)),
        parameters: signature.parameters,
        canHandle:
            name === undefined
                ? subtag => resolver.isExactMatch(subtag)
                : (subtag, subtagName) => subtagName.toLowerCase() === name && resolver.isExactMatch(subtag)
        ,
        replace: async function* executeContionalHandler(context, subtagName, call) {
            const args = [];
            for (const arg of resolver.resolve(context, call)) {
                args.push(arg);
                if (arg.parameter.autoResolve)
                    await arg.execute();
            }
            try {
                yield* implementation(context, Object.assign(args, { subtagName }), call);
            } catch (error: unknown) {
                if (!(error instanceof BBTagRuntimeError))
                    throw error;
                yield await context.addError(error, call);
            }
        }
    };
}

const initialResolver: ArgumentResolver<object> = {
    minArgs: Infinity,
    maxArgs: -Infinity,
    isExactMatch() { return false; },
    resolve() {
        throw new Error('Unable to determine how to resolve this call!');
    }
};

// eslint-disable-next-line require-yield
async function* resolveAndThrow<Locals extends object>(
    context: BBTagContext<Locals>,
    call: BBTagSubtag,
    resolver: ArgumentResolver<Locals>,
    error: BBTagRuntimeError
): AsyncIterable<never> {
    for (const arg of resolver.resolve(context, call)) {
        if (arg.parameter.autoResolve) {
            await arg.execute();
        }
    }
    throw error;
}
