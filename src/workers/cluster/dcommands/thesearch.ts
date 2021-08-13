import { BaseGlobalImageCommand, CommandContext } from '@cluster/command';
import { ImageResult } from '@image/types';

export class TheSearchCommand extends BaseGlobalImageCommand {
    public constructor() {
        super({
            name: 'thesearch',
            definitions: [
                {
                    parameters: '{text+}',
                    description: 'Tells everyone about the progress of the search for intelligent life.',
                    execute: (ctx, [text]) => this.render(ctx, text)
                }
            ]
        });
    }

    public async render(context: CommandContext, text: string): Promise<ImageResult | string> {
        text = await context.util.resolveTags(context, text);
        return await this.renderImage(context, 'thesearch', { text });
    }
}
