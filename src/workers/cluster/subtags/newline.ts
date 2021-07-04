import { BaseSubtag, SubtagType, parse } from '../core';

export class NewlineSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'newline',
            category: SubtagType.SIMPLE,
            definition: [
                {
                    parameters: ['count?:1'],
                    description: 'Will be replaced by `count` newline characters (\\n).',
                    exampleCode: 'Hello,{newline}world!',
                    exampleOut: 'Hello,\nworld!',
                    execute: (context, [{ value: countStr }], subtag) => {
                        let count = parse.int(countStr);
                        const fallback = parse.int(context.scope.fallback ?? '');

                        if (isNaN(count)) count = fallback;
                        if (isNaN(count)) return this.notANumber(context, subtag, 'Number and fallback are not numbers');

                        if (count < 0) count = 0;

                        return ''.padStart(count, '\n');
                    }
                }
            ]
        });
    }
}
