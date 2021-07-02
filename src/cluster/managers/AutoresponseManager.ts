import { AnyMessage, Emoji, GuildMessage, User } from 'eris';
import { RuntimeLimit, limits } from '../../core/bbtag';
import { codeBlock, guard, humanize, mapping } from '../../utils';
import { Cluster } from '../Cluster';

type WhitelistResponse = 'approved' | 'rejected' | 'requested' | 'alreadyApproved' | 'alreadyRejected';

export class AutoresponseManager {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #guilds: Set<string>;
    public get guilds(): ReadonlySet<string> { return this.#guilds; }

    public constructor(private readonly cluster: Cluster) {
        this.#guilds = new Set();
        cluster.util.reactionAwaiter.onAny((message, emoji, user) => void this.handleWhitelistApproval(message, emoji, user));
    }

    public async refresh(): Promise<void> {
        const whitelist = await this.cluster.database.vars.get('arwhitelist');
        this.#guilds.clear();
        for (const guildId of whitelist?.values ?? [])
            this.#guilds.add(guildId);
    }

    public async whitelist(guildId: string, channelId: string, userId: string, reason: string, whitelisted = true): Promise<WhitelistResponse> {
        await this.refresh();
        const isChange = whitelisted !== this.#guilds.has(guildId);
        if (isChange) {
            if (!this.cluster.util.isStaff(userId)) {
                const user = await this.cluster.util.getUserById(userId);
                const guild = this.cluster.discord.guilds.get(guildId);
                const code = Buffer.from(JSON.stringify(<ArData>{ channel: channelId, guild: guildId })).toString('base64');
                const message = await this.cluster.util.send(
                    this.cluster.config.discord.channels.autoresponse,
                    `
New AR request from **${humanize.fullName(user)}** (${userId}):
**Guild**: ${guild?.name ?? 'UNKNOWN'} (${guildId})
**Channel**: ${channelId}
**Members**: ${guild?.memberCount ?? '??'}

${reason.length == 0 ? '*No reason given*' : reason}

${codeBlock(code, 'js')}`
                );
                await Promise.all(Object.keys(emojiValues).map(emoji => message?.addReaction(emoji)));
                return 'requested';
            }

            if (whitelisted) this.#guilds.add(guildId);
            else this.#guilds.delete(guildId);

            await this.cluster.database.vars.set({
                varname: 'arwhitelist',
                values: [...this.#guilds]
            });
        }


        if (isChange) {
            await this.cluster.util.send(channelId, whitelisted
                ? '✅ Congratz, your guild has been whitelisted for autoresponses! 🎉'
                : '❌ Sorry, your guild has been rejected for autoresponses. 😿'
            );
        }
        return whitelisted
            ? isChange ? 'approved' : 'alreadyApproved'
            : isChange ? 'rejected' : 'alreadyRejected';
    }

    public async execute(cluster: Cluster, msg: AnyMessage, everything: boolean): Promise<void> {
        if (msg.author.discriminator === '0000' || !guard.isGuildMessage(msg))
            return;

        if (!this.#guilds.has(msg.channel.guild.id))
            return;

        for await (const { commandName, limit, silent = false } of this.findAutoresponses(cluster, msg, everything)) {
            const command = await cluster.database.guilds.getCommand(msg.channel.guild.id, commandName);
            if (command !== undefined && !guard.isAliasedCustomCommand(command)) {
                await cluster.bbtag.execute(command.content, {
                    message: msg,
                    limit,
                    author: command.author,
                    input: humanize.smartSplit(msg.content),
                    isCC: true,
                    tagName: commandName,
                    silent
                });
            }
        }
    }

    private async handleWhitelistApproval(message: AnyMessage, emoji: Emoji, user: User): Promise<void> {
        if (message.channel.id !== this.cluster.config.discord.channels.autoresponse
            || !emojiValues.hasOwnProperty(emoji.name)
            || !this.cluster.util.isStaff(user.id))
            return;

        const match = /```js\n(.+)\n```/.exec(message.content);
        if (!match)
            return;

        const mapped = mapArData(match[1]);
        if (!mapped.valid)
            return;

        const whitelist = emojiValues[emoji.name];
        const reason = `${whitelist ? 'Approved' : 'Rejected'} by ${humanize.fullName(user)}`;

        const promises: Promise<unknown>[] = [];
        promises.push(this.whitelist(mapped.value.guild, mapped.value.channel, user.id, reason, whitelist));
        for (const m of await message.channel.getMessages()) {
            if (m.author.id === this.cluster.discord.user.id && m.content.includes(match[0])) {
                promises.push(m.edit(`${emoji.name} ${m.content.replace(match[0], reason)}`));
                promises.push(m.removeReactions());
            }
        }
        await Promise.all(promises);
    }

    private async * findAutoresponses(cluster: Cluster, msg: GuildMessage, everything: boolean): AsyncGenerator<{ commandName: string, limit: RuntimeLimit, silent?: boolean }> {
        const ars = await cluster.database.guilds.getAutoresponses(msg.channel.guild.id);
        if (everything) {
            if (ars.everything)
                yield { commandName: ars.everything.executes, limit: new limits.EverythingAutoResponseLimit(), silent: true };
            return;
        }

        if (ars.list === undefined)
            return;

        for (const ar of ars.list) {
            if (guard.testMessageFilter(ar, msg)) {
                yield { commandName: ar.executes, limit: new limits.GeneralAutoResponseLimit() };
            }
        }
    }
}

const emojiValues = {
    '✅': true,
    '❌': false
};

type ArData = { guild: string, channel: string };

const mapArData = mapping.base64(mapping.json(mapping.object<ArData>({
    channel: mapping.string,
    guild: mapping.string
})));