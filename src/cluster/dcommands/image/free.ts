import type { CommandContext } from '@blargbot/cluster';
import { GlobalImageCommand } from '@blargbot/cluster';

import { templates } from '../../text.js';
import type { CommandResult } from '../../types.js';

const cmd = templates.commands.free;

export class FreeCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: 'free',
            flags: [
                { flag: 'b', word: 'bottom', description: cmd.flags.bottom }
            ],
            definitions: [
                {
                    parameters: '{caption+}',
                    description: cmd.default.description,
                    execute: (ctx, [caption], flags) => this.render(ctx, caption.asString, flags.b?.merge().value)
                }
            ]
        });
    }

    public async render(context: CommandContext, caption: string, bottomText: string | undefined): Promise<CommandResult> {
        return await this.renderImage(context, { type: 'free', top: caption, bottom: bottomText });
    }
}
