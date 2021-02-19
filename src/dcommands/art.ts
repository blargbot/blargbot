import { Message, TextableChannel } from 'eris';
import { Cluster } from '../cluster';
import { commandTypes, parse } from '../utils';
import { BaseCommand } from '../core/command';

export class ArtCommand extends BaseCommand {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'art',
            category: commandTypes.IMAGE,
            info: 'Shows everyone a work of art.',
            flags: [{ flag: 'I', word: 'image', desc: 'A custom image.' }],
            userRatelimit: true,
            channelRatelimit: true,
            cooldown: 5000
        });
    }

    public async execute(message: Message<TextableChannel>, words: string[]): Promise<void> {
        const input = parse.flags(this.flags, words);
        let url;
        if (message.attachments.length > 0) {
            url = message.attachments[0].url;
        } else if (input.I) {
            url = input.I.join(' ');
        } else if (input.undefined.length > 0) {
            const user = await this.util.getUser(message, input.undefined.join(' '));
            if (!user)
                return;
            url = user.avatarURL;
        } else {
            url = message.author.avatarURL;
        }

        void this.discord.sendChannelTyping(message.channel.id);

        const buffer = await this.cluster.images.render('art', { avatar: url });
        if (!buffer) {
            await this.send(message, 'Something went wrong while trying to render that!');
        } else {
            await this.send(message, {}, {
                file: buffer,
                name: 'sobeautifulstan.png'
            });
        }
    }
}