import { parse } from '@blargbot/core/utils/index.js';

import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

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
