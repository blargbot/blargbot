import { BaseGlobalImageCommand, CommandContext } from '@cluster/command';
import { ImageResult } from '@image/types';

export class ClydeCommand extends BaseGlobalImageCommand {
    public constructor() {
        super({
            name: 'clyde',
            definitions: [
                {
                    parameters: '{text+}',
                    description: 'Give everyone a message from Clyde.',
                    execute: (ctx, [text]) => this.render(ctx, text.asString)
                }
            ]
        });
    }

    public async render(context: CommandContext, text: string): Promise<string | ImageResult> {
        text = await context.util.resolveTags(context, text);
        return await this.renderImage(context, 'clyde', { text });
    }
}
