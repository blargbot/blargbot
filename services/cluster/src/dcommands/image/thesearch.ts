import { CommandContext, GlobalImageCommand } from '../../command/index.js';
import templates from '../../text.js';
import { CommandResult } from '../../types.js';

const cmd = templates.commands.theSearch;

export class TheSearchCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: 'thesearch',
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
        text = await context.util.resolveTags(context, text);
        return await this.renderImage(context, 'thesearch', { text });
    }
}
