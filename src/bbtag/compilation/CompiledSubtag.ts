import { guard, parse } from '@blargbot/core/utils';

import { BBTagContext } from '../BBTagContext';
import { BBTagRuntimeError } from '../errors';
import { SubtagCall } from '../language';
import { Subtag } from '../Subtag';
import { SubtagOptions } from '../types';
import { bbtag } from '../utils';
import { AnySubtagSignatureOptions } from './AnySubtagSignatureOptions';
import { compileSignatures } from './compileSignatures';
import { CompositeSubtagHandler } from './CompositeSubtagHandler';
import { parseDefinitions } from './parseDefinitions';

export interface DefinedSubtagOptions extends Omit<SubtagOptions, `signatures`> {
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
        if (source === ``)
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
