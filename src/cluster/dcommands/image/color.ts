import { CommandContext, GlobalImageCommand } from '@blargbot/cluster/command';

import { CommandResult } from '../../types';

export class ColorCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: `color`,
            definitions: [
                {
                    parameters: `{colors[]}`,
                    description: `Returns the provided colors.`,
                    execute: (ctx, [text]) => this.render(ctx, text.asStrings)
                }
            ]
        });
    }

    public async render(context: CommandContext, colors: readonly string[]): Promise<CommandResult> {
        return await this.renderImage(context, `color`, { color: colors });
    }
}
