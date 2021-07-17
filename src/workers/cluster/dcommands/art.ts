import { BaseGlobalCommand, CommandContext, RatelimitMiddleware, SingleThreadMiddleware } from '@cluster/command';
import { FlagResult } from '@cluster/types';
import { CommandType } from '@cluster/utils';
import { MessageFile } from 'eris';
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
                    parameters: '{user+?}',
                    execute: (ctx, [user], flags) => this.art(ctx, user, flags),
                    description: 'Shows everyone a work of art.'
                }
            ]
        });

        this.middleware.push(new SingleThreadMiddleware(c => c.channel.id));
        this.middleware.push(new RatelimitMiddleware(duration(5, 'seconds'), c => c.author.id));
    }

    private async art(context: CommandContext, user: string, flags: FlagResult): Promise<void | string | MessageFile> {
        let url;
        if (context.message.attachments.length > 0) {
            url = context.message.attachments[0].url;
        } else if (flags.I !== undefined) {
            url = flags.I.merge().value;
        } else if (user.length > 0) {
            const u = await context.util.getUser(context, user);
            if (u === undefined)
                return this.error('I cant find that user!');
            url = u.avatarURL;
        } else {
            url = context.author.avatarURL;
        }

        void context.discord.sendChannelTyping(context.channel.id);

        const buffer = await context.cluster.images.render('art', { avatar: url });
        if (buffer === undefined || buffer.length === 0)
            return this.error('Something went wrong while trying to render that!');

        return {
            file: buffer,
            name: 'sobeautifulstan.png'
        };

    }
}
