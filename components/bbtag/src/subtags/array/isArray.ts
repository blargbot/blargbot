import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.isArray;

@Subtag.id('isArray')
@Subtag.ctorArgs(Subtag.arrayTools())
export class IsArraySubtag extends CompiledSubtag {
    readonly #arrayTools: BBTagArrayTools;

    public constructor(arrayTools: BBTagArrayTools) {
        super({
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['text'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'boolean',
                    execute: (_, [array]) => this.isArray(array.value)
                }
            ]
        });

        this.#arrayTools = arrayTools;
    }

    public isArray(arrayStr: string): boolean {
        const array = this.#arrayTools.deserialize(arrayStr);
        return array !== undefined;
    }
}
