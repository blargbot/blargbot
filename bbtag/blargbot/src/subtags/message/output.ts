import { } from '@bbtag/subtag'
import { p } from '../p.js';
import { Subtag } from '@bbtag/subtag';
import { BBTagRuntimeError } from '../../errors/BBTagRuntimeError.js';

export class OutputSubtag extends Subtag {
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
