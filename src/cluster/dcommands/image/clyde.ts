import { CommandContext, GlobalImageCommand } from '@blargbot/cluster/command';

import { CommandResult } from '../../types';

export class ClydeCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: `clyde`,
            definitions: [
                {
                    parameters: `{text+}`,
                    description: `Give everyone a message from Clyde.`,
                    execute: (ctx, [text]) => this.render(ctx, text.asString)
                }
            ]
        });
    }

    public async render(context: CommandContext, text: string): Promise<CommandResult> {
        text = await context.util.resolveTags(context, text);
        return await this.renderImage(context, `clyde`, { text });
    }
}
