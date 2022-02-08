import { AnySubtagHandlerDefinition, CompositeSubtagHandler, SubtagCall, SubtagOptions, SubtagResult } from '@cluster/types';

import { BBTagContext } from './BBTagContext';
import { compileSignatures, parseDefinitions } from './compilation';
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
}
