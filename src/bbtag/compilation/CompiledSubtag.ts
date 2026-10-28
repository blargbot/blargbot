import type { IFormattable } from '@blargbot/formatting';

import type { BBTagContext } from '../BBTagContext.js';
import type { SubtagCall } from '../language/index.js';
import { Subtag } from '../Subtag.js';
import type { SubtagOptions, SubtagSignature } from '../types.js';
import type { SubtagType } from '../utils/index.js';
import type { AnySubtagSignatureOptions } from './AnySubtagSignatureOptions.js';
import { compileSignatures } from './compileSignatures.js';
import type { CompositeSubtagHandler } from './CompositeSubtagHandler.js';
import { parseDefinitions } from './parseDefinitions.js';

export interface DefinedSubtagOptions extends Omit<SubtagOptions<IFormattable<string>>, 'signatures'> {
    readonly definition: readonly AnySubtagSignatureOptions[];
}

export abstract class CompiledSubtag extends Subtag {
    public readonly name: string;
    public readonly aliases: readonly string[];
    public readonly category: SubtagType;
    public readonly description: IFormattable<string> | undefined;
    public readonly deprecated: string | boolean;
    public readonly staff: boolean;
    public readonly hidden: boolean;
    public readonly signatures: ReadonlyArray<SubtagSignature<IFormattable<string>>>;
    readonly #handler: CompositeSubtagHandler;

    public constructor(options: DefinedSubtagOptions) {
        super();
        const signatures = parseDefinitions(options.definition);

        this.name = options.name;
        this.category = options.category;
        this.description = options.description;
        this.deprecated = options.deprecated ?? false;
        this.staff = options.staff ?? false;
        this.hidden = options.hidden ?? false;
        this.signatures = signatures.map(s => s.signature).filter(x => x !== undefined);
        this.aliases = [
            ...options.aliases ?? [],
            ...this.signatures.map(s => s.subtagName).filter(x => x !== undefined)
        ];

        this.#handler = compileSignatures(signatures.map(s => s.implementation).filter(x => x !== undefined));
    }

    protected override executeCore(context: BBTagContext, subtagName: string, subtag: SubtagCall): AsyncIterable<string | undefined> {
        return this.#handler.execute(context, subtagName, subtag);
    }
}
