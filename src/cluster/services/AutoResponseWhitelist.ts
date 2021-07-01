import { AnyMessage, Emoji, User } from 'eris';
import { IntervalService } from '../../structures/IntervalService';
import { codeBlock, humanize, mapping } from '../../utils';
import { Cluster } from '../Cluster';

type ArData = { guild: string, channel: string };

export class AutoResponseWhitelist extends IntervalService {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #whitelist: Set<string>;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #handleReaction: (message: AnyMessage, emoji: Emoji, user: User) => void;

    public readonly type: string = 'bbtag';
    public get guilds(): ReadonlySet<string> { return this.#whitelist; }

    public constructor(private readonly cluster: Cluster) {
        super(15, 'minutes', cluster.logger, true);
        this.#whitelist = new Set();
        this.#handleReaction = (message, emoji, user) => void this.handleReaction(message, emoji, user);
    }

    protected async execute(): Promise<void> {
        const whitelist = await this.cluster.database.vars.get('arwhitelist');
        this.#whitelist = new Set(whitelist?.values);
    }

    public start(): void {
        super.start();
        this.cluster.util.reactionAwaiter.onAny(this.#handleReaction);
    }

    public stop(): void {
        this.cluster.util.reactionAwaiter.offAny(this.#handleReaction);
        super.stop();
    }

    public async whitelist(guildId: string, channelId: string, userId: string, reason: string, whitelisted = true): Promise<boolean> {
        await this.execute();
        if (whitelisted === this.#whitelist.has(guildId))
            return false;

        if (!await this.cluster.util.isPolice(userId)) {
            const user = await this.cluster.util.getUserById(userId);
            const guild = this.cluster.discord.guilds.get(guildId);
            const code = Buffer.from(JSON.stringify(<ArData>{ channel: channelId, guild: guildId })).toString('base64');
            const message = await this.cluster.util.send(channelId, `New AR request from **${humanize.fullName(user)}** (${userId}):
**Guild**: ${guild?.name ?? 'UNKNOWN'} (${guildId})
**Channel**: ${channelId}
**Members**: ${guild?.memberCount ?? '??'}

${reason ?? '*No reason given*'}

${codeBlock(code, 'js')}`);
            for (const emoji of Object.keys(emojiValues))
                await message?.addReaction(emoji);
            return true;
        }

        if (whitelisted) this.#whitelist.add(guildId);
        else this.#whitelist.delete(guildId);

        await this.cluster.database.vars.set({
            varname: 'arwhitelist',
            values: [...this.#whitelist]
        });
        await this.cluster.util.send(channelId, whitelisted
            ? `✅ Congratz <@${userId}>, your guild has been whitelisted for autoresponses! 🎉`
            : `❌ Sorry <@${userId}>, your guild has been rejected for autoresponses. 😿`
        );
        return true;
    }

    private async handleReaction(message: AnyMessage, emoji: Emoji, user: User): Promise<void> {
        if (message.channel.id !== this.cluster.config.discord.channels.autoresponse
            || !emojiValues.hasOwnProperty(emoji.name)
            || !await this.cluster.util.isPolice(user.id))
            return;

        const match = /```js\n(.+)\n```/.exec(message.content);
        if (!match)
            return;

        const mapped = mapArData(match[0]);
        if (!mapped.valid)
            return;

        await this.whitelist(mapped.value.guild, mapped.value.channel, user.id, 'Approved by a police member', emojiValues[emoji.name]);
        for (const m of await message.channel.getMessages()) {
            if (m.author.id === this.cluster.discord.user.id && m.content.includes(match[0])) {
                await m.edit(`${emoji.name} ${m.content.replace(match[0], '')}`);
                await m.removeReactions();
            }
        }
    }
}

const emojiValues = {
    '✅': true,
    '❌': false
};

const mapArData = mapping.json(mapping.object<ArData>({
    channel: mapping.string,
    guild: mapping.string
}));