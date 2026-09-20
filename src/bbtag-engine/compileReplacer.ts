import type { BBTagAnyLocal } from './BBTagAnyLocal.js';
import type { AnySubtagSignatureOptions } from './compilation/AnySubtagSignatureOptions.js';
import { compileSignatures } from './compilation/compileSignatures.js';
import type { CompositeBBTagReplacer } from './compilation/CompositeBBTagReplacer.js';
import { parseDefinitions } from './compilation/parseDefinitions.js';

export function compileReplacer<Locals extends Record<string, unknown> = BBTagAnyLocal>(
    names: string | [string, ...string[]],
    ...definitions: ReadonlyArray<AnySubtagSignatureOptions<Locals>>
): CompositeBBTagReplacer<Locals> {
    const signatures = parseDefinitions(definitions);
    if (typeof names === 'string')
        names = [names];

    return compileSignatures(
        [...names, ...signatures.map(s => s.signature?.subtagName).filter(v => v !== undefined)],
        signatures.map(s => s.implementation).filter(v => v !== undefined)
    );
}
