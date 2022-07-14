import { metrics } from '@blargbot/core/Metrics';
import { Guild } from 'eris';
import moment from 'moment-timezone';

import { Cluster } from '../Cluster';

export class GuildManager {
    #blacklist: Record<string, boolean | undefined> | undefined;

    public constructor(
        private readonly cluster: Cluster
    ) {
        setInterval(() => this.#blacklist = undefined, moment.duration(10, 'minutes').asMilliseconds());
    }

    async #getBlacklist(): Promise<Record<string, boolean | undefined>> {
        return this.#blacklist ??= { ...(await this.cluster.database.vars.get('guildBlacklist'))?.values };
    }

    public async setBlacklisted(guildId: string, blacklisted: boolean): Promise<void> {
        const blacklist = await this.#getBlacklist();
        if (blacklisted)
            blacklist[guildId] = true;
        else
            delete blacklist[guildId];
        await this.cluster.database.vars.set('guildBlacklist', { values: { ...blacklist } });
        this.#blacklist = undefined;

        if (blacklisted) {
            const guild = this.cluster.discord.guilds.get(guildId);
            if (guild !== undefined)
                await this.#guildBlacklisted(guild);
        }
    }

    async #guildBlacklisted(guild: Guild): Promise<void> {
        await this.cluster.util.sendDM(guild.ownerID, `Greetings! I regret to inform you that your guild, **${guild.name}** (${guild.id}), is on my blacklist. Sorry about that! I'll be leaving now. I hope you have a nice day.`);
        await guild.leave();
    }

    public async guildJoined(guild: Guild): Promise<void> {
        metrics.guildGauge.set(this.cluster.discord.guilds.size);
        const blacklist = await this.#getBlacklist();
        if (blacklist[guild.id] === true) {
            await this.#guildBlacklisted(guild);
            return;
        }

        if (await this.cluster.database.guilds.upsert(guild) === 'inserted') {
            await this.cluster.util.ensureMemberCache(guild);
            const users = guild.members.filter(m => !m.user.bot).length;
            const bots = guild.members.filter(m => m.user.bot).length;
            const percent = Math.floor(bots / guild.members.size * 10000) / 100;
            const message = `:ballot_box_with_check: Guild: \`${guild.name}\` (\`${guild.id}\`)! ${percent >= 80 ? '- ***BOT GUILD***' : ''}\n` +
                `    Total: **${guild.members.size}** | Users: **${users}** | Bots: **${bots}** | Percent: **${percent}**`;
            await this.cluster.util.send(this.cluster.config.discord.channels.joinlog, message);
        }
    }

    public async guildLeft(guildId: string): Promise<void> {
        metrics.guildGauge.set(this.cluster.discord.guilds.size);
        await this.cluster.util.postStats();
        await this.cluster.database.guilds.setActive(guildId, false);
    }
}
