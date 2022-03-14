import { AnySubtagHandlerDefinition, CompositeSubtagHandler, SubtagCall, SubtagOptions, SubtagResult } from '@cluster/types';
import { bbtag, parse } from '@cluster/utils';

import { BBTagContext } from './BBTagContext';
import { compileSignatures, parseDefinitions } from './compilation';
import { BBTagRuntimeError } from './errors';
import { Subtag } from './Subtag';

export interface DefinedSubtagOptions extends Omit<SubtagOptions, 'signatures'> {
    readonly definition: readonly AnySubtagHandlerDefinition[];
}

export abstract class DefinedSubtag extends Subtag {
    readonly #handler: CompositeSubtagHandler;

    public constructor(options: DefinedSubtagOptions) {
        const signatures = parseDefinitions(options.definition);
        super({ ...options, signatures });

        this.#handler = compileSignatures(signatures);
    }

    protected executeCore(context: BBTagContext, subtagName: string, subtag: SubtagCall): SubtagResult {
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
