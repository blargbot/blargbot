import { BaseGlobalImageCommand, CommandContext } from '@cluster/command';
import { ImageResult } from '@image/types';

export class TruthCommand extends BaseGlobalImageCommand {
    public constructor() {
        super({
            name: 'truth',
            definitions: [
                {
                    parameters: '{text+}',
                    description: 'Shows everyone what is written in the Scroll of Truth.',
                    execute: (ctx, [text]) => this.render(ctx, text.asString)
                }
            ]
        });
    }

    public async render(context: CommandContext, text: string): Promise<ImageResult | string> {
        text = await context.util.resolveTags(context, text);
        return await this.renderImage(context, 'truth', { text });
    }
}
