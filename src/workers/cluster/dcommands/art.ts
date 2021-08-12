import { BaseGlobalCommand, CommandContext, RatelimitMiddleware, SingleThreadMiddleware } from '@cluster/command';
import { FlagResult } from '@cluster/types';
import { CommandType } from '@cluster/utils';
import { ImageResult } from '@image/types';
import { User } from 'discord.js';
import { duration } from 'moment-timezone';

export class ArtCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'art',
            category: CommandType.IMAGE,
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

        this.middleware.push(new SingleThreadMiddleware(c => c.channel.id));
        this.middleware.push(new RatelimitMiddleware(duration(5, 'seconds'), c => c.author.id));
    }

    private async render(context: CommandContext, user: User | undefined, flags: FlagResult): Promise<void | string | ImageResult> {
        let url = context.message.attachments.first()?.url;
        if (url !== undefined) {
            // NOOP
        } else if (flags.I !== undefined)
            url = flags.I.merge().value;
        else if (user !== undefined)
            url = user.avatarURL({ dynamic: true }) ?? user.defaultAvatarURL;
        else
            url = context.author.avatarURL({ dynamic: true }) ?? context.author.defaultAvatarURL;

        void context.channel.sendTyping();

        const result = await context.cluster.images.render('art', { avatar: url });
        if (result === undefined || result.data.length === 0)
            return this.error('Something went wrong while trying to render that!');
        return result;
    }
}
