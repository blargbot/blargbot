import { parse } from '@blargbot/core/utils';

import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.parseInt;

export class ParseIntSubtag extends CompiledSubtag {
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
