import { Subtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class DebugSubtag extends Subtag {
    public constructor() {
        super({
            name: 'debug',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['text?+'],
                    description: 'Adds the specified text to the debug output. This output is only shown via ' +
                        '`tag debug`, `ccommand debug`, `tag test debug` and `ccommand test debug`.' +
                        'The line number is also included in the debug entry',
                    exampleCode: '{debug;current value;{get;~i}}',
                    exampleOut: '(in debug output)[10]current value 1',
                    returns: 'nothing',
                    execute: (ctx, text, subtag) => {
                        ctx.debug.push({
                            subtag,
                            text: text.map(arg => arg.value).join(' ')
                        });
                    }
                }
            ]
        });
    }
}
