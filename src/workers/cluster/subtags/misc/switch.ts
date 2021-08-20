import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagArgumentValue, SubtagCall } from '@cluster/types';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';

export class SwitchSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'switch',
            category: SubtagType.COMPLEX,
            definition: [//! Docs overidden
                {
                    parameters: ['value', 'default'],
                    execute: (_, [, {value}]) => value
                },
                {
                    parameters: ['value', 'case', 'then+'],
                    execute: (ctx, [{value}, ...args], subtag) => this.switch(ctx, subtag, value, ...args)
                }
            ]
        });
    }

    public async switch(
        _context: BBTagContext,
        _subtag: SubtagCall,
        value: string,
        ...args: SubtagArgumentValue[]
    ): Promise<string> {
        let elseDo: SubtagArgumentValue | undefined;

        if (args.length % 2 === 1) elseDo = <SubtagArgumentValue>args.pop();

        for (let i = 0; i < args.length; i += 2) {
            const caseValue = await args[i].execute();
            const caseArray = bbtagUtil.tagArray.deserialize(caseValue) ?? {v: undefined};
            const cases = Array.isArray(caseArray.v) ? caseArray.v : [caseValue];
            for (const key of cases)
                if (parse.string(key) === value)
                    return args[i + 1].execute();
        }
        return elseDo !== undefined ? await elseDo.execute() : '';
    }
}
