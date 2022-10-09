import { CommandContext, GlobalImageCommand } from '@blargbot/cluster/command';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.free;

export class FreeCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: `free`,
            flags: [
                { flag: `b`, word: `bottom`, description: cmd.flags.bottom }
            ],
            definitions: [
                {
                    parameters: `{caption+}`,
                    description: cmd.default.description,
                    execute: (ctx, [caption], flags) => this.render(ctx, caption.asString, flags.b?.merge().value)
                }
            ]
        });
    }

    public async render(context: CommandContext, caption: string, bottomText: string | undefined): Promise<CommandResult> {
        return await this.renderImage(context, `free`, { top: caption, bottom: bottomText });
    }
}
