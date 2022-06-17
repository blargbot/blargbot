import { CommandContext, GlobalImageCommand } from '@blargbot/cluster/command';
import { ImageResult } from '@blargbot/image/types';

export class DeleteCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: 'delete',
            definitions: [
                {
                    parameters: '{text+}',
                    description: 'Shows that you\'re about to delete something.',
                    execute: (ctx, [text]) => this.render(ctx, text.asString)
                }
            ]
        });
    }

    public async render(context: CommandContext, text: string): Promise<ImageResult | string> {
        text = await context.util.resolveTags(context, text);
        return await this.renderImage(context, 'delete', { text });
    }
}
