import { bbtag } from '@blargbot/bbtag';
import { Cluster } from '@blargbot/cluster';
import { WhitelistResponse } from '@blargbot/cluster/types';
import { codeBlock, guard, humanize } from '@blargbot/cluster/utils';
import { GuildTriggerTag } from '@blargbot/domain/models';
import { mapping } from '@blargbot/mapping';
import { KnownGuildTextableChannel, KnownMessage, Message, PartialEmoji, User } from 'eris';

export class AutoresponseManager {
    readonly #guilds: Set<string>;
    readonly #debugOutput: Record<string, { channelId: string; messageId: string; } | undefined>;
    #executionCounts?: Record<string, number | undefined>;
    readonly #cluster: Cluster;

    public get guilds(): ReadonlySet<string> { return this.#guilds; }

    public constructor(cluster: Cluster) {
        this.#guilds = new Set();
        this.#debugOutput = {};
        this.#executionCounts = {};
        this.#cluster = cluster;

        setInterval(() => {
            if (this.#executionCounts !== undefined) {
                cluster.logger.info('Autoresponse usage summary', this.#executionCounts);
                this.#executionCounts = undefined;
            }
        }, 60000);
    }

    #logAutoresponses(guildId: string, arId: `${number}` | 'everything'): void {
        const key = `${guildId}|${arId}`;
        this.#executionCounts ??= {};
        this.#executionCounts[key] = (this.#executionCounts[key] ?? 0) + 1;
    }

    public async refresh(): Promise<void> {
        const whitelist = await this.#cluster.database.vars.get('arwhitelist');
        this.#guilds.clear();
        for (const guildId of whitelist?.values ?? [])
            this.#guilds.add(guildId);
    }

    public async whitelist(guildId: string, channelId: string, userId: string, reason: string, whitelisted = true): Promise<WhitelistResponse> {
        await this.refresh();
        const isChange = whitelisted !== this.#guilds.has(guildId);
        if (isChange) {
            if (!this.#cluster.util.isBotStaff(userId)) {
                const user = await this.#cluster.util.getUser(userId);
                const guild = this.#cluster.discord.guilds.get(guildId);
                const code = Buffer.from(JSON.stringify(<ArData>{ channel: channelId, guild: guildId })).toString('base64');
                const message = await this.#cluster.util.send(
                    this.#cluster.config.discord.channels.autoresponse,
                    `
New AR request from **${humanize.fullName(user)}** (${userId}):
**Guild**: ${guild?.name ?? 'UNKNOWN'} (${guildId})
**Channel**: ${channelId}
**Members**: ${guild?.memberCount ?? '??'}

${reason.length === 0 ? '*No reason given*' : reason}

${codeBlock(code, 'js')}`
                );
                await Promise.all(Object.keys(emojiValues).map(emoji => message?.addReaction(emoji)));
                return 'requested';
            }

            if (whitelisted) this.#guilds.add(guildId);
            else this.#guilds.delete(guildId);

            await this.#cluster.database.vars.set('arwhitelist', { values: [...this.#guilds] });
        }

        if (isChange) {
            await this.#cluster.util.send(channelId, whitelisted
                ? '✅ Congratz, your guild has been whitelisted for autoresponses! 🎉'
                : '❌ Sorry, your guild has been rejected for autoresponses. 😿'
            );
        }
        return whitelisted
            ? isChange ? 'approved' : 'alreadyApproved'
            : isChange ? 'rejected' : 'alreadyRejected';
    }

    public setDebug(guildId: string, id: number | 'everything', userId: string, channelId: string, messageId: string): void {
        this.#debugOutput[`${guildId}|${id}|${userId}`] = { channelId, messageId };
    }

    public async execute(msg: KnownMessage, everything: boolean): Promise<void> {
        if (!guard.isGuildMessage(msg))
            return;

        if (!this.#guilds.has(msg.channel.guild.id))
            return;

        const promises = [];
        for await (const ar of this.#findAutoresponses(msg, everything))
            promises.push(this.#executeCore(msg, ar.id, ar.command, ar.args));

        await Promise.all(promises);
    }

    async #executeCore(msg: Message<KnownGuildTextableChannel>, id: `${number}` | 'everything', tag: GuildTriggerTag, args: string[]): Promise<void> {
        this.#logAutoresponses(msg.channel.guild.id, id);

        const result = await this.#cluster.bbtag.execute(tag.content, {
            message: msg,
            limit: id === 'everything' ? 'everythingAutoResponseLimit' : 'generalAutoResponseLimit',
            authorId: tag.author ?? undefined,
            authorizerId: tag.authorizer ?? undefined,
            inputRaw: args.length === 1 ? msg.content : humanize.smartSplit.inverse(args),
            isCC: true,
            rootTagName: `_autoresponse_${id}`,
            silent: id === 'everything'
        });

        const key = `${msg.channel.guild.id}|${id}|${msg.author.id}`;
        const debugCtx = this.#debugOutput[key];
        if (debugCtx === undefined)
            return;

        delete this.#debugOutput[key];
        await this.#cluster.util.sendDM(msg.author, bbtag.createDebugOutput(result));
    }

    public async handleWhitelistApproval(message: KnownMessage, emoji: PartialEmoji, user: User): Promise<void> {
        if (message.channel.id !== this.#cluster.config.discord.channels.autoresponse
            || !guard.hasProperty(emojiValues, emoji.name)
            || !this.#cluster.util.isBotStaff(user.id))
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
        for (const m of await message.channel.getMessages()) {
            if (m.author.id === this.#cluster.discord.user.id && m.content.includes(match[0])) {
                promises.push(m.edit(`${emoji.name} ${m.content.replace(match[0], reason)}`));
                promises.push(m.removeReactions());
            }
        }
        await Promise.all(promises);
    }

    async * #findAutoresponses(msg: Message<KnownGuildTextableChannel>, everything: boolean): AsyncGenerator<{ command: GuildTriggerTag; id: `${number}` | 'everything'; args: string[]; }> {
        const ars = await this.#cluster.database.guilds.getAutoresponses(msg.channel.guild.id) ?? {};
        if (everything) {
            if (ars.everything !== undefined && ars.everything !== null)
                yield { command: ars.everything, id: 'everything', args: [msg.content] };
            return;
        }

        if (ars.filtered === undefined)
            return;

        for (const [id, ar] of Object.entries(ars.filtered)) {
            if (ar !== undefined && ar !== null) {
                const args = guard.matchMessageFilter(ar, msg);
                if (args !== undefined)
                    yield { command: ar, id: <`${number}`>id, args };
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

const mapArData = mapping.base64(mapping.json(mapping.object<ArData>({
    channel: mapping.string,
    guild: mapping.string
})));
