import { CommandContext, GlobalImageCommand } from '@blargbot/cluster/command';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.pcCheck;

export class PCCheckCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: `pccheck`,
            definitions: [
                {
                    parameters: `{text+}`,
                    description: cmd.default.description,
                    execute: (ctx, [text]) => this.render(ctx, text.asString)
                }
            ]
        });
    }

    public async render(context: CommandContext, text: string): Promise<CommandResult> {
        text = await context.util.resolveTags(context, text);
        return await this.renderImage(context, `pccheck`, { text });
    }
}
