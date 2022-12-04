import { CommandContext, GlobalImageCommand } from '../../command/index.js';
import templates from '../../text.js';
import { CommandResult } from '../../types.js';

const cmd = templates.commands.truth;

export class TruthCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: 'truth',
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
        return await this.renderImage(context, 'truth', { text });
    }
}
