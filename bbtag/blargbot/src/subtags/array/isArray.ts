import { Subtag } from '@bbtag/subtag';

import { bbtag, SubtagType } from '../../utils/index.js';
import { p } from '../p.js';

export class IsArraySubtag extends Subtag {
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
