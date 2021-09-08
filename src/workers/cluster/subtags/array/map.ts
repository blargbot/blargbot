import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagArgumentValue, SubtagCall } from '@cluster/types';
import { bbtagUtil, SubtagType } from '@cluster/utils';

export class MapSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'map',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['variable', 'array', '~code'],
                    description: 'Provides a way to populate an array by executing a function on each of its elements,' +
                        ' more info [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)\n' +
                        'For every element in `array`, a variable called `variable` will be set to the current element. The output of `function`' +
                        ' will be the new value of the element. This will return the new array, and will not modify the original.',
                    exampleCode: '{map;~item;["apples","oranges","pears"];{upper;{get;~item}}}',
                    exampleOut: '["APPLES","ORANGES","PEARS"]',
                    execute: (context, [variable, array, code], subtag) => this.map(context, variable.value, array.value, code, subtag)
                }
            ]
        });
    }

    public async map(context: BBTagContext, varName: string, arrayString: string, code: SubtagArgumentValue, subtag: SubtagCall): Promise<string> {
        const bbArr = await bbtagUtil.tagArray.getArray(context, arrayString);
        let array: JArray;
        if (bbArr === undefined || !Array.isArray(bbArr.v))
            array = [];
        else
            array = bbArr.v;
        const result = [];

        for (const item of array) {
            const checked = await context.limit.check(context, subtag, 'map:loops');
            if (checked !== undefined) {
                result.push(checked);
                break;
            }
            await context.variables.set(varName, item);
            result.push(await code.execute());

            if (context.state.return !== 0)
                break;
        }

        await context.variables.reset(varName);
        return bbtagUtil.tagArray.serialize(result);
    }
}
