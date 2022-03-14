import { DefinedSubtag } from '@blargbot/cluster/bbtag';
import { SubtagArgument } from '@blargbot/cluster/types';
import { bbtag, parse, SubtagType } from '@blargbot/cluster/utils';

export class SwitchSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'switch',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['value', { repeat: ['case', '~then'], minCount: 1 }, '~default?'],
                    returns: 'string',
                    execute: (_, [value, ...cases]) => this.switch(value.value, ...splitArgs(cases))
                }
            ]
        });
    }

    public async switch(
        value: string,
        cases: ReadonlyArray<readonly [string, SubtagArgument]>,
        defaultCase?: SubtagArgument
    ): Promise<string> {
        for (const [caseValue, then] of cases) {
            const { v: options = [caseValue] } = bbtag.tagArray.deserialize(caseValue) ?? {};
            for (const option of options)
                if (parse.string(option) === value)
                    return await then.execute();
        }
        return await defaultCase?.execute() ?? '';
    }
}

function splitArgs(args: SubtagArgument[]): [cases: ReadonlyArray<readonly [string, SubtagArgument]>, defaultCase?: SubtagArgument] {
    let defaultCase = undefined;
    if (args.length % 2 === 1)
        defaultCase = args.pop();

    const cases = [];
    for (let i = 0; i < args.length; i += 2)
        cases.push([args[i].value, args[i + 1]] as const);
    return [cases, defaultCase];
}
