import type { CommandContext} from '../../command/index.js';
import { GlobalImageCommand } from '../../command/index.js';
import templates from '../../text.js';
import type { CommandResult } from '../../types.js';

const cmd = templates.commands.shit;

export class ShitCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: 'shit',
            aliases: ['heck'],
            flags: [
                { flag: 'p', word: 'plural', description: cmd.flags.plural }
            ],
            definitions: [
                {
                    parameters: '{text+=Your favourite anime}',
                    description: cmd.default.description,
                    execute: (ctx, [text], flags) => this.render(ctx, text.asString, flags.p !== undefined)
                }
            ]
        });
    }

    public async render(context: CommandContext, text: string, plural: boolean): Promise<CommandResult> {
        text = await context.util.resolveTags(context, text);
        return await this.renderImage(context, 'shit', { text, plural });
    }
}
