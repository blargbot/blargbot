import { CommandContext, GlobalImageCommand } from '@blargbot/cluster/command';
import { ImageResult } from '@blargbot/image/types';

export class SonicSaysCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: `sonicsays`,
            definitions: [
                {
                    parameters: `{text+}`,
                    description: `Sonic wants to share some words of wisdom.`,
                    execute: (ctx, [text]) => this.render(ctx, text.asString)
                }
            ]
        });
    }

    public async render(context: CommandContext, text: string): Promise<ImageResult | string> {
        text = await context.util.resolveTags(context, text);
        return await this.renderImage(context, `sonicsays`, { text });
    }
}
