import { BaseGlobalImageCommand, CommandContext } from '@cluster/command';
import { ImageResult } from '@image/types';

export class SonicSaysCommand extends BaseGlobalImageCommand {
    public constructor() {
        super({
            name: 'sonicsays',
            definitions: [
                {
                    parameters: '{text+}',
                    description: 'Sonic wants to share some words of wisdom.',
                    execute: (ctx, [text]) => this.render(ctx, text)
                }
            ]
        });
    }

    public async render(context: CommandContext, text: string): Promise<ImageResult | string> {
        text = await context.util.resolveTags(context, text);
        return await this.renderImage(context, 'sonicsays', { text });
    }
}
