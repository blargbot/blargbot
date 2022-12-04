import { guard, parse } from '@blargbot/core/utils/index.js';
import type { IFormattable } from '@blargbot/formatting';

import type { BBTagContext } from '../BBTagContext.js';
import type { BBTagRuntimeError } from '../errors/index.js';
import type { SubtagCall } from '../language/index.js';
import { Subtag } from '../Subtag.js';
import type { SubtagOptions } from '../types.js';
import { bbtag } from '../utils/index.js';
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
        super({ ...options, signatures: signatures.map(s => s.signature).filter(guard.hasValue) });

        this.#handler = compileSignatures(signatures.map(s => s.implementation).filter(guard.hasValue));
    }

    protected executeCore(context: BBTagContext, subtagName: string, subtag: SubtagCall): AsyncIterable<string | undefined> {
        return this.#handler.execute(context, subtagName, subtag);
    }

    public async bulkLookup<T>(source: string, lookup: (value: string) => Awaitable<T | undefined>, error: new (term: string) => BBTagRuntimeError): Promise<T[] | undefined> {
        if (source === '')
            return undefined;

        const flatSource = bbtag.tagArray.flattenArray([source]).map(i => parse.string(i));
        return await Promise.all(flatSource.map(async input => {
            const element = await lookup(input);
            if (element === undefined)
                throw new error(input);
            return element;
        }));
    }

}
