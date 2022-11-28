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
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
