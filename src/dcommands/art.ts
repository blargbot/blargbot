import { Message, TextableChannel } from 'eris';
import { Cluster } from '../cluster';
import { commandTypes, parse } from '../newbu';
import { BaseDCommand } from '../structures/BaseDCommand';

export class ArtCommand extends BaseDCommand {
    public constructor(cluster: Cluster) {
        super(cluster, 'art', {
            category: commandTypes.IMAGE,
            usage: 'art [user]',
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
            await this.util.send(message, 'Something went wrong while trying to render that!');
        } else {
            await this.util.send(message, {}, {
                file: buffer,
                name: 'sobeautifulstan.png'
            });
        }
    }
}