import { parse } from '@blargbot/core/utils';

import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.parsefloat;

export class ParseFloatSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'parsefloat',
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: ['number'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (_, [number]) => this.parseFloat(number.value)
                }
            ]
        });
    }

    public parseFloat(number: string): number {
        return parse.float(number) ?? NaN;
    }
}
