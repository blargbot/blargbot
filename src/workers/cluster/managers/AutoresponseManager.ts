import { Cluster } from '@cluster';
import { EverythingAutoResponseLimit, GeneralAutoResponseLimit } from '@cluster/bbtag';
import { RuntimeLimit, WhitelistResponse } from '@cluster/types';
import { codeBlock, guard, humanize, mapping } from '@cluster/utils';
import { GuildTriggerTag } from '@core/types';
import { GuildEmoji, GuildMessage, Message, ReactionEmoji, User } from 'discord.js';

export class AutoresponseManager {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #guilds: Set<string>;
    public get guilds(): ReadonlySet<string> { return this.#guilds; }

    public constructor(private readonly cluster: Cluster) {
        this.#guilds = new Set();
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
            if (!this.cluster.util.isBotStaff(userId)) {
                const user = await this.cluster.util.getUser(userId);
                const guild = this.cluster.discord.guilds.cache.get(guildId);
                const code = Buffer.from(JSON.stringify(<ArData>{ channel: channelId, guild: guildId })).toString('base64');
                const message = await this.cluster.util.send(
                    this.cluster.config.discord.channels.autoresponse,
                    `
New AR request from **${humanize.fullName(user)}** (${userId}):
**Guild**: ${guild?.name ?? 'UNKNOWN'} (${guildId})
**Channel**: ${channelId}
**Members**: ${guild?.memberCount ?? '??'}

${reason.length === 0 ? '*No reason given*' : reason}

${codeBlock(code, 'js')}`
                );
                await Promise.all(Object.keys(emojiValues).map(emoji => message?.react(emoji)));
                return 'requested';
            }

            if (whitelisted) this.#guilds.add(guildId);
            else this.#guilds.delete(guildId);

            await this.cluster.database.vars.set('arwhitelist', { values: [...this.#guilds] });
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

    public async execute(cluster: Cluster, msg: Message, everything: boolean): Promise<void> {
        if (msg.author.discriminator === '0000' || !guard.isGuildMessage(msg))
            return;

        if (!this.#guilds.has(msg.channel.guild.id))
            return;

        for await (const { command, limit, silent = false } of this.findAutoresponses(cluster, msg, everything)) {
            await cluster.bbtag.execute(command.content, {
                message: msg,
                limit,
                author: command.author,
                inputRaw: msg.content,
                isCC: true,
                rootTagName: 'autoresponse',
                silent
            });
        }
    }

    public async handleWhitelistApproval(message: Message, emoji: GuildEmoji | ReactionEmoji, user: User): Promise<void> {
        if (message.channel.id !== this.cluster.config.discord.channels.autoresponse
            || emoji.name === null
            || !guard.hasProperty(emojiValues, emoji.name)
            || !this.cluster.util.isBotStaff(user.id))
            return;

        const match = /```js\n(.+)\n```/.exec(message.content);
        if (match === null)
            return;

        const mapped = mapArData(match[1]);
        if (!mapped.valid)
            return;

        const whitelist = emojiValues[emoji.name];
        const reason = `${whitelist ? 'Approved' : 'Rejected'} by ${humanize.fullName(user)}`;

        const promises: Array<Promise<unknown>> = [];
        promises.push(this.whitelist(mapped.value.guild, mapped.value.channel, user.id, reason, whitelist));
        for (const [, m] of await message.channel.messages.fetch()) {
            if (m.author.id === this.cluster.discord.user.id && m.content.includes(match[0])) {
                promises.push(m.edit(`${emoji.name} ${m.content.replace(match[0], reason)}`));
                promises.push(m.reactions.removeAll());
            }
        }
        await Promise.all(promises);
    }

    private async * findAutoresponses(cluster: Cluster, msg: GuildMessage, everything: boolean): AsyncGenerator<{ command: GuildTriggerTag; limit: RuntimeLimit; silent?: boolean; }> {
        const ars = await cluster.database.guilds.getAutoresponses(msg.channel.guild.id);
        if (everything) {
            if (ars.everything !== undefined)
                yield { command: ars.everything.executes, limit: new EverythingAutoResponseLimit(), silent: true };
            return;
        }

        if (ars.filtered === undefined)
            return;

        for (const ar of Object.values(ars.filtered)) {
            if (ar !== undefined && guard.testMessageFilter(ar, msg)) {
                yield { command: ar.executes, limit: new GeneralAutoResponseLimit() };
            }
        }
    }
}

const emojiValues = {
    '✅': true,
    '❌': false
};

interface ArData {
    guild: string;
    channel: string;
}

const mapArData = mapping.mapBase64(mapping.mapJson(mapping.mapObject<ArData>({
    channel: mapping.mapString,
    guild: mapping.mapString
})));
