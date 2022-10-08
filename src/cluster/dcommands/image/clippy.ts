import { CommandContext, GlobalImageCommand } from '@blargbot/cluster/command';

import { CommandResult } from '../../types';

export class ClippyCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: `clippy`,
            aliases: [`clippit`, `paperclip`],
            definitions: [
                {
                    parameters: `{text+}`,
                    description: `Clippy the paperclip is here to save the day!`,
                    execute: (ctx, [text]) => this.render(ctx, text.asString)
                }
            ]
        });
    }

    public async render(context: CommandContext, text: string): Promise<CommandResult> {
        text = await context.util.resolveTags(context, text);
        return await this.renderImage(context, `clippy`, { text });
    }
}
