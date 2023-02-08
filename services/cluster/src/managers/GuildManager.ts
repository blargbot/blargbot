import { FormattableMessageContent } from '@blargbot/core/FormattableMessageContent.js';
import { metrics } from '@blargbot/core/Metrics.js';
import type * as Eris from 'eris';
import moment from 'moment-timezone';

import type { Cluster } from '../Cluster.js';
import templates from '../text.js';

export class GuildManager {
    #blacklist: Record<string, boolean | undefined> | undefined;
    readonly #cluster: Cluster;

    public constructor(
        cluster: Cluster
    ) {
        this.#cluster = cluster;
        setInterval(() => this.#blacklist = undefined, moment.duration(10, 'minutes').asMilliseconds());
    }

    async #getBlacklist(): Promise<Record<string, boolean | undefined>> {
        return this.#blacklist ??= { ...(await this.#cluster.database.vars.get('guildBlacklist'))?.values };
    }

    public async setBlacklisted(guildId: string, blacklisted: boolean): Promise<void> {
        const blacklist = await this.#getBlacklist();
        if (blacklisted)
            blacklist[guildId] = true;
        else
            delete blacklist[guildId];
        await this.#cluster.database.vars.set('guildBlacklist', { values: { ...blacklist } });
        this.#blacklist = undefined;

        if (blacklisted) {
            const guild = this.#cluster.discord.guilds.get(guildId);
            if (guild !== undefined)
                await this.#guildBlacklisted(guild);
        }
    }

    async #guildBlacklisted(guild: Eris.Guild): Promise<void> {
        const user = await this.#cluster.util.getUser(guild.ownerID);
        if (user !== undefined)
            await this.#cluster.util.send(user, new FormattableMessageContent({ content: templates.guild.blacklisted({ guild }) }));
        await guild.leave();
    }

    public async guildLoaded(guild: Eris.Guild): Promise<void> {
        metrics.guildGauge.set(this.#cluster.discord.guilds.size);
        const blacklist = await this.#getBlacklist();
        if (blacklist[guild.id] === true) {
            await this.#guildBlacklisted(guild);
            return;
        }

        if (await this.#cluster.database.guilds.upsert(guild) === 'inserted') {
            await this.#cluster.util.ensureMemberCache(guild);
            const users = guild.members.filter(m => !m.user.bot).length;
            const bots = guild.members.size - users;
            const percent = Math.floor(bots / guild.members.size * 100) / 100;
            await this.#cluster.util.send(this.#cluster.config.discord.channels.joinlog, new FormattableMessageContent({
                content: templates.guild.joined({
                    guild,
                    botGuild: percent >= 0.8,
                    botCount: bots,
                    size: guild.members.size,
                    botFraction: percent,
                    userCount: users
                })
            }));
        }
    }

    public async guildLeft(guildId: string): Promise<void> {
        metrics.guildGauge.set(this.#cluster.discord.guilds.size);
        await this.#cluster.util.postStats();
        await this.#cluster.database.guilds.setActive(guildId, false);
    }
}
