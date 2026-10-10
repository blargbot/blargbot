import type { AnySubtagSignatureOptions } from './compilation/AnySubtagSignatureOptions.js';
import type { CompiledBBTagReplacer } from './compilation/CompiledBBTagReplacer.js';
import { compileSignatures } from './compilation/compileSignatures.js';
import { parseDefinitions } from './compilation/parseDefinitions.js';

export function defineReplacer<Locals extends object = object>(
    names: string | [string, ...string[]],
    ...definitions: ReadonlyArray<AnySubtagSignatureOptions<Locals>>
): CompiledBBTagReplacer<Locals> {
    const signatures = parseDefinitions(definitions);
    if (typeof names === 'string')
        names = [names];

    return compileSignatures(
        [...names, ...signatures.map(s => s.signature?.subtagName).filter(v => v !== undefined)],
        signatures.map(s => s.implementation).filter(v => v !== undefined)
    );
}
