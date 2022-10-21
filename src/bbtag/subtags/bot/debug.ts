import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { SubtagCall } from '../../language';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.debug;

export class DebugSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'debug',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['text*'],
                    description: 'Adds the specified text to the debug output. This output is only shown via `tag debug`, `ccommand debug`, `tag test debug` and `ccommand test debug`.The line number is also included in the debug entry',
                    exampleCode: '{debug;current value;{get;~i}}',
                    exampleOut: '(in debug output)[10]current value 1',
                    returns: 'nothing',
                    execute: (ctx, text, subtag) => this.addDebug(ctx, text.map(x => x.value).join(' '), subtag)
                }
            ]
        });
    }

    public addDebug(context: BBTagContext, text: string, subtag: SubtagCall): void {
        context.debug.push({ subtag, text });
    }
}
