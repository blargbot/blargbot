import { CompiledSubtag } from '../../compilation/index';
import templates from '../../text';
import { bbtag, SubtagType } from '../../utils/index';

const tag = templates.subtags.isArray;

export class IsArraySubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'isArray',
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
