import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.output;

export class OutputSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'output',
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: ['text?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'id',
                    execute: (ctx, [text]) => this.sendTagOutput(ctx, text.value)
                }
            ]
        });
    }

    public async sendTagOutput(context: BBTagContext, text: string): Promise<string> {
        if (context.data.outputMessage !== undefined && text.length > 0)
            throw new BBTagRuntimeError('Cannot send multiple outputs');
        return await context.sendOutput(text) ?? '';
    }
}
