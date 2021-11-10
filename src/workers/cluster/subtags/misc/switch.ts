import { BaseSubtag } from '@cluster/bbtag';
import { SubtagArgumentValue } from '@cluster/types';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';

export class SwitchSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'switch',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['value', { repeat: ['case', '~then'], minCount: 1 }, '~default?'],
                    execute: (_, [value, ...cases]) => this.switch(value.value, ...splitArgs(cases))
                }
            ]
        });
    }

    public async switch(
        value: string,
        cases: ReadonlyArray<readonly [string, SubtagArgumentValue]>,
        defaultCase?: SubtagArgumentValue
    ): Promise<string> {
        for (const [caseValue, then] of cases) {
            const { v: options = [caseValue] } = bbtagUtil.tagArray.deserialize(caseValue) ?? { v: undefined };
            for (const option of options)
                if (parse.string(option) === value)
                    return await then.execute();
        }
        return await defaultCase?.execute() ?? '';
    }
}

function splitArgs(args: SubtagArgumentValue[]): [cases: ReadonlyArray<readonly [string, SubtagArgumentValue]>, defaultCase?: SubtagArgumentValue] {
    let defaultCase = undefined;
    if (args.length % 2 === 1)
        defaultCase = args.pop();

    const cases = [];
    for (let i = 0; i < args.length; i += 2)
        cases.push([args[i].value, args[i + 1]] as const);
    return [cases, defaultCase];
}
