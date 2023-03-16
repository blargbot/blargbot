import type { IFormattable } from '@blargbot/formatting';
import { hasValue } from '@blargbot/guards';

import type { BBTagCall } from '../BBTagCall.js';
import type { BBTagScript } from '../BBTagScript.js';
import { Subtag } from '../Subtag.js';
import type { SubtagOptions } from '../types.js';
import type { AnySubtagSignatureOptions } from './AnySubtagSignatureOptions.js';
import { compileSignatures } from './compileSignatures.js';
import type { CompositeSubtagHandler } from './CompositeSubtagHandler.js';
import { parseDefinitions } from './parseDefinitions.js';

export interface DefinedSubtagOptions extends Omit<SubtagOptions<IFormattable<string>>, 'signatures'> {
    readonly definition: readonly AnySubtagSignatureOptions[];
}

export abstract class CompiledSubtag extends Subtag {
    readonly #handler: CompositeSubtagHandler;

    public constructor(options: DefinedSubtagOptions) {
        const signatures = parseDefinitions(options.definition);
        super({ ...options, signatures: signatures.map(s => s.signature).filter(hasValue) });

        this.#handler = compileSignatures(signatures.map(s => s.implementation).filter(hasValue));
    }

    public override execute(context: BBTagScript, subtagName: string, subtag: BBTagCall): Awaitable<string> {
        return this.#handler.execute(context, subtagName, subtag);
    }
}
