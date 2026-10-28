import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { convertToNumber } from '../../utils/converters.js';
import { bbtag, SubtagType } from '../../utils/index.js';

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
        const parsedArgs = [];
        for (const arg of flattenedArgs) {
            switch (typeof arg) {
                case 'number':
                    parsedArgs.push(arg);
                    break;
                case 'string': {
                    const parsed = convertToNumber(arg);
                    if (parsed === undefined)
                        return NaN;
                    parsedArgs.push(parsed);
                    break;
                }
                default:
                    return NaN;
            }
        }

        return Math.min(...parsedArgs);
    }
}
