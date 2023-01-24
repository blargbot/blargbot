import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.length;

@Subtag.id('length')
@Subtag.factory(Subtag.arrayTools())
export class LengthSubtag extends CompiledSubtag {
    readonly #arrayTools: BBTagArrayTools;

    public constructor(arrayTools: BBTagArrayTools) {
        super({
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['value'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleIn: tag.default.exampleIn,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (_, [value]) => this.getLength(value.value)
                }
            ]
        });

        this.#arrayTools = arrayTools;
    }

    public getLength(value: string): number {
        const deserializedArray = this.#arrayTools.deserialize(value);
        if (deserializedArray !== undefined)
            return deserializedArray.v.length;
        return value.length;
    }
}
