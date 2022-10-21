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
                    description: 'Returns the smallest entry out of `numbers`. If an array is provided, it will be expanded to its individual values.',
                    exampleCode: '{min;50;2;65}',
                    exampleOut: '2',
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
