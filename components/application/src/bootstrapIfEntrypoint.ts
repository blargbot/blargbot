import getCallerImportMeta from './getCallerImportMeta.js';
import isEntrypoint from './isEntrypoint.js';

export default async function bootstrapIfEntrypoint(bootstrap: () => Awaitable<void>): Promise<void>;
export default async function bootstrapIfEntrypoint(context: ImportMeta, bootstrap: () => Awaitable<void>): Promise<void>;
export default async function bootstrapIfEntrypoint(...args: [bootstrap: () => Awaitable<void>] | [context: ImportMeta, bootstrap: () => Awaitable<void>]): Promise<void> {
    const [context, bootstrap] = args.length === 1
        ? [getCallerImportMeta(), ...args]
        : args;
    if (isEntrypoint(context))
        await bootstrap();
}
