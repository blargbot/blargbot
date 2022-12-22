import { parse } from '@blargbot/core/utils/index.js';

import { } from '@bbtag/subtag'
import { p } from '../p.js';
import { Subtag } from '@bbtag/subtag';

export class ParseIntSubtag extends Subtag {
    public constructor() {
        super({
            name: 'parseInt',
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: ['number'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (_, [number]) => this.parseInt(number.value)
                }
            ]
        });
    }

    public parseInt(number: string): number {
        return parse.int(number) ?? NaN;
    }
}
