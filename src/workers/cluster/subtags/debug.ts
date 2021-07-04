import { BaseSubtag, SubtagType } from '../core';

export class DebugSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'debug',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['text?'],
                    description: 'Adds the specified text to the debug output. This output is only shown via ' +
                        '`tag debug`, `ccommand debug`, `tag test debug` and `ccommand test debug`.' +
                        'The line number is also included in the debug entry',
                    exampleCode: '{debug;current value;{get;~i}}',
                    exampleOut: '(in debug output)[10]current value 1',
                    execute: (ctx, args, subtag) => {
                        ctx.addError('', subtag, args.map(arg => arg.value).join(' '));
                        return '';
                    }
                }
            ]
        });
    }
}
