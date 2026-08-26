import { parse } from '@blargbot/core/utils/index.js';

import type { SubtagArgument } from '../../arguments/index.js';
import { CompiledSubtag } from '../../compilation/index.js';
import templates from '../../text.js';
import { bbtag, SubtagType } from '../../utils/index.js';

const tag = templates.subtags.switch;

export class SwitchSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'switch',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['value', { repeat: ['case', '~then'], minCount: 1 }, '~default?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleIn: tag.default.exampleIn,
                    exampleOut: tag.default.exampleOut,
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
