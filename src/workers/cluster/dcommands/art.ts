import { BaseGlobalCommand, CommandContext, RatelimitMiddleware, SingleThreadMiddleware } from '@cluster/command';
import { FlagResult } from '@cluster/types';
import { CommandType } from '@cluster/utils';
import { FileOptions } from 'discord.js';
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

    private async art(context: CommandContext, user: string, flags: FlagResult): Promise<void | string | FileOptions> {
        let url = context.message.attachments.first()?.url;
        if (url !== undefined) {
            // NOOP
        } else if (flags.I !== undefined) {
            url = flags.I.merge().value;
        } else if (user.length > 0) {
            const u = await context.util.getUser(context, user);
            if (u === undefined)
                return this.error('I cant find that user!');
            url = u.avatarURL({ dynamic: true }) ?? u.defaultAvatarURL;
        } else {
            url = context.author.avatarURL({ dynamic: true }) ?? context.author.defaultAvatarURL;
        }

        void context.channel.sendTyping();

        const buffer = await context.cluster.images.render('art', { avatar: url });
        if (buffer === undefined || buffer.length === 0)
            return this.error('Something went wrong while trying to render that!');

        return {
            attachment: buffer,
            name: 'sobeautifulstan.png'
        };

    }
}
