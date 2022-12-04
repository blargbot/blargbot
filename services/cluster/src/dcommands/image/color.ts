import type { CommandContext} from '../../command/index.js';
import { GlobalImageCommand } from '../../command/index.js';
import templates from '../../text.js';
import type { CommandResult } from '../../types.js';

const cmd = templates.commands.color;

export class ColorCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: 'color',
            definitions: [
                {
                    parameters: '{colors[]}',
                    description: cmd.default.description,
                    execute: (ctx, [text]) => this.render(ctx, text.asStrings)
                }
            ]
        });
    }

    public async render(context: CommandContext, colors: readonly string[]): Promise<CommandResult> {
        return await this.renderImage(context, 'color', { color: colors });
    }
}
