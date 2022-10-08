import { CommandContext, GlobalImageCommand } from '@blargbot/cluster/command';

import { CommandResult } from '../../types';

export class SonicSaysCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: `sonicsays`,
            definitions: [
                {
                    parameters: `{text+}`,
                    description: `Sonic wants to share some words of wisdom.`,
                    execute: (ctx, [text]) => this.render(ctx, text.asString)
                }
            ]
        });
    }

    public async render(context: CommandContext, text: string): Promise<CommandResult> {
        text = await context.util.resolveTags(context, text);
        return await this.renderImage(context, `sonicsays`, { text });
    }
}
