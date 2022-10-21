import { guard, parse } from '@blargbot/core/utils';

import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { bbtag, SubtagType } from '../../utils';

const tag = templates.subtags.min;

export class MinSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'min',
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: ['numbers+'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (_, values) => this.min(values.map(arg => arg.value))
                }
            ]
        });
    }

    public min(args: string[]): number {
        const flattenedArgs = bbtag.tagArray.flattenArray(args);
        const parsedArgs = flattenedArgs.map(arg => parse.float(arg?.toString() ?? ''));
        const filteredArgs = parsedArgs.filter(guard.hasValue);

        if (filteredArgs.length < parsedArgs.length)
            return NaN;

        return Math.min(...filteredArgs);
    }
}
