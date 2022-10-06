import { guard, parse } from '@blargbot/core/utils';

import { CompiledSubtag } from '../../compilation';
import { bbtag, SubtagType } from '../../utils';

export class MaxSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: `max`,
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: [`numbers+`],
                    description: `Returns the largest entry out of \`numbers\`. If an array is provided, it will be expanded to its individual values.`,
                    exampleCode: `{max;50;2;65}`,
                    exampleOut: `65`,
                    returns: `number`,
                    execute: (_, values) => this.max(values.map(arg => arg.value))
                }
            ]
        });
    }

    public max(values: string[]): number {
        const flattenedArgs = bbtag.tagArray.flattenArray(values);
        const parsedArgs = flattenedArgs.map(arg => parse.float(arg?.toString() ?? ``));
        const filteredArgs = parsedArgs.filter(guard.hasValue);

        if (filteredArgs.length < parsedArgs.length)
            return NaN;

        return Math.max(...filteredArgs);
    }
}
