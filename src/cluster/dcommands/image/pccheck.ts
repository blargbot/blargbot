import { CommandContext, GlobalImageCommand } from '@blargbot/cluster/command';
import { ImageResult } from '@blargbot/image/types';

export class PCCheckCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: 'pccheck',
            definitions: [
                {
                    parameters: '{text+}',
                    description: 'Tells everyone a reason why they should get their PC checked. Template credits go to Ghosty#8204.',
                    execute: (ctx, [text]) => this.render(ctx, text.asString)
                }
            ]
        });
    }

    public async render(context: CommandContext, text: string): Promise<ImageResult | string> {
        text = await context.util.resolveTags(context, text);
        return await this.renderImage(context, 'pccheck', { text });
    }
}
