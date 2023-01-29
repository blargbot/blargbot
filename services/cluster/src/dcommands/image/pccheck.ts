import type { CommandContext } from '../../command/index.js';
import { GlobalImageCommand } from '../../command/index.js';
import templates from '../../text.js';
import type { CommandResult } from '../../types.js';

const cmd = templates.commands.pcCheck;

export class PCCheckCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: 'pccheck',
            definitions: [
                {
                    parameters: '{text+}',
                    description: cmd.default.description,
                    execute: (ctx, [text]) => this.render(ctx, text.asString)
                }
            ]
        });
    }

    public async render(context: CommandContext, text: string): Promise<CommandResult> {
        text = await context.util.resolveTags(text, context.channel);
        return await this.renderImage(context, 'pccheck', { text });
    }
}
