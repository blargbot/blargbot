import { BaseGlobalImageCommand, CommandContext } from '@cluster/command';
import { ImageResult } from '@image/types';

export class PCCheckCommand extends BaseGlobalImageCommand {
    public constructor() {
        super({
            name: 'pccheck',
            definitions: [
                {
                    parameters: '{text+}',
                    description: 'Tells everyone a reason why they should get their PC checked. Template credits go to Ghosty#8204.',
                    execute: (ctx, [text]) => this.render(ctx, text)
                }
            ]
        });
    }

    public async render(context: CommandContext, text: string): Promise<ImageResult | string> {
        text = await context.util.resolveTags(context, text);
        return await this.renderImage(context, 'pccheck', { text });
    }
}
