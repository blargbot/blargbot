import { BaseGlobalImageCommand, CommandContext } from '@cluster/command';
import { ImageResult } from '@image/types';

export class DeleteCommand extends BaseGlobalImageCommand {
    public constructor() {
        super({
            name: 'delete',
            definitions: [
                {
                    parameters: '{text+}',
                    description: 'Shows that you\'re about to delete something.',
                    execute: (ctx, [text]) => this.render(ctx, text)
                }
            ]
        });
    }

    public async render(context: CommandContext, text: string): Promise<ImageResult | string> {
        text = await context.util.resolveTags(context, text);
        return await this.renderImage(context, 'delete', { text });
    }
}
