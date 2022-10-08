import { CommandContext, GlobalImageCommand } from '@blargbot/cluster/command';

import { CommandResult } from '../../types';

export class DeleteCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: `delete`,
            definitions: [
                {
                    parameters: `{text+}`,
                    description: `Shows that you're about to delete something.`,
                    execute: (ctx, [text]) => this.render(ctx, text.asString)
                }
            ]
        });
    }

    public async render(context: CommandContext, text: string): Promise<CommandResult> {
        text = await context.util.resolveTags(context, text);
        return await this.renderImage(context, `delete`, { text });
    }
}
