import type { BBTagAnyLocal } from '../BBTagAnyLocal.js';
import type { BBTagContext } from '../BBTagContext.js';
import type { BBTagReplacer } from '../BBTagReplacer.js';
import { BBTagRuntimeError, NotEnoughArgumentsError, TooManyArgumentsError } from '../BBTagRuntimeError.js';
import type { BBTagSubtag } from '../language/index.js';
import type { ArgumentResolver } from './ArgumentResolver.js';
import type { CompositeBBTagReplacer } from './CompositeBBTagReplacer.js';
import type { ConditionalBBTagReplacer } from './ConditionalBBTagReplacer.js';
import { createArgumentResolvers } from './createResolvers.js';
import type { SubtagSignatureCallable } from './SubtagSignatureCallable.js';

type PropsOnly<T> = { [P in keyof T]: T[P] }

export function compileSignatures<Locals extends Record<string, unknown>>(names: string[], signatures: ReadonlyArray<SubtagSignatureCallable<Locals>>): CompositeBBTagReplacer<Locals> {
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

    return Object.assign<BBTagReplacer<Locals>, PropsOnly<CompositeBBTagReplacer<Locals>>>(
        function execute(context, subtagName, call) {
            const handler = handlers.find(handler => handler.canHandle(call, subtagName));

            if (handler !== undefined)
                return handler(context, subtagName, call);
            if (call.args.length < min.minArgs)
                return resolveAndThrow(context, call, min, new NotEnoughArgumentsError(min.minArgs, call.args.length));
            if (call.args.length > max.maxArgs)
                return resolveAndThrow(context, call, max, new TooManyArgumentsError(max.maxArgs, call.args.length));

            throw new Error(`Missing handler for ${call.args.length} arguments!`);
        },
        { handlers, names: Object.freeze([...names]) }
    );
}

function createConditionalHandler<Locals extends Record<string, unknown>>(signature: SubtagSignatureCallable<Locals>, resolver: ArgumentResolver<Locals>): ConditionalBBTagReplacer<Locals> {
    const name = signature.subtagName?.toLowerCase();
    const implementation = signature.implementation;

    return Object.assign<BBTagReplacer<Locals>, { [P in keyof ConditionalBBTagReplacer<Locals>]: ConditionalBBTagReplacer<Locals>[P] }>(
        async function* executeContionalHandler(context, subtagName, call) {
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
                yield* await context.addError(error, call);
            }
        },
        {
            id: signature.id,
            parameters: signature.parameters,
            subtagName: signature.subtagName,
            canHandle: name === undefined
                ? subtag => resolver.isExactMatch(subtag)
                : (subtag, subtagName) => subtagName.toLowerCase() === name && resolver.isExactMatch(subtag)
        }
    );
}

const initialResolver: ArgumentResolver<BBTagAnyLocal> = {
    minArgs: Infinity,
    maxArgs: -Infinity,
    isExactMatch() { return false; },
    resolve() {
        throw new Error('Unable to determine how to resolve this call!');
    }
};

// eslint-disable-next-line require-yield
async function* resolveAndThrow<Locals extends Record<string, unknown>>(
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
