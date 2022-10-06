import { CommandContext, GlobalImageCommand } from '@blargbot/cluster/command';
import { ImageResult } from '@blargbot/image/types';

export class FreeCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: `free`,
            definitions: [
                {
                    parameters: `{caption+}`,
                    description: `Tells everyone what you got for free`,
                    execute: (ctx, [caption], flags) => this.render(ctx, caption.asString, flags.b?.merge().value)
                }
            ],
            flags: [
                { flag: `b`, word: `bottom`, description: `The bottom caption.` }
            ]
        });
    }

    public async render(context: CommandContext, caption: string, bottomText: string | undefined): Promise<string | ImageResult> {
        return await this.renderImage(context, `free`, { top: caption, bottom: bottomText });
    }
}
