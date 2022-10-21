import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { bbtag, SubtagType } from '../../utils';

const tag = templates.subtags.isarray;

export class IsArraySubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'isarray',
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
    }

    public isArray(arrayStr: string): boolean {
        const array = bbtag.tagArray.deserialize(arrayStr);
        return array !== undefined;
    }
}
