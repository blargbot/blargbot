import { BaseGlobalImageCommand, CommandContext } from '@cluster/command';
import { FlagResult } from '@cluster/types';
import { ImageResult } from '@image/types';
import { User } from 'discord.js';

export class ArtCommand extends BaseGlobalImageCommand {
    public constructor() {
        super({
            name: 'art',
            description: 'Shows everyone a work of art.',
            flags: [{ flag: 'I', word: 'image', description: 'A custom image.' }],
            definitions: [
                {
                    parameters: '{user:user+?}',
                    execute: (ctx, [user], flags) => this.render(ctx, user, flags),
                    description: 'Shows everyone a work of art.'
                }
            ]
        });
    }

    private async render(context: CommandContext, user: User | undefined, flags: FlagResult): Promise<void | string | ImageResult> {
        let url = context.message.attachments.first()?.url;
        if (url !== undefined) {
            // NOOP
        } else if (flags.I !== undefined)
            url = flags.I.merge().value;
        else if (user !== undefined)
            url = user.displayAvatarURL({ dynamic: true });
        else
            url = context.author.displayAvatarURL({ dynamic: true, format: 'png' });

        return await this.renderImage(context, 'art', { avatar: url });
    }
}
