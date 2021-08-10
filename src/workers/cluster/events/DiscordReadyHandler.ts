import { Cluster } from '@cluster';
import { metrics } from '@core/Metrics';
import { DiscordEventService } from '@core/serviceTypes';

export class DiscordReadyHandler extends DiscordEventService<'ready'> {
    public constructor(
        public readonly cluster: Cluster
    ) {
        super(cluster.discord, 'ready', cluster.logger);
    }

    public async execute(): Promise<void> {
        this.logger.init(`Ready! Logged in as ${this.cluster.discord.user.username}#${this.cluster.discord.user.discriminator}`);

        metrics.guildGauge.set(this.cluster.discord.guilds.cache.size);

        for (const guild of this.cluster.discord.guilds.cache.values()) {
            if (await this.cluster.database.guilds.upsert(guild) !== 'inserted')
                continue;

            const members = guild.memberCount;
            const users = guild.members.cache.filter(m => !m.user.bot).size;
            const bots = guild.members.cache.filter(m => m.user.bot).size;
            const percent = Math.floor(bots / members * 10000) / 100;
            const message = `:ballot_box_with_check: Guild: \`${guild.name}\` (\`${guild.id}\`)! ${percent >= 80 ? '- ***BOT GUILD***' : ''}\n` +
                `    Total: **${members}** | Users: **${users}** | Bots: **${bots}** | Percent: **${percent}**`;
            void this.cluster.util.send(this.cluster.config.discord.channels.joinlog, message);
        }

        void this.cluster.util.postStats();

        const blacklist = await this.cluster.database.vars.get('guildBlacklist');
        if (blacklist !== undefined) {
            for (const g of Object.keys(blacklist.values)) {
                if (blacklist.values[g] !== undefined && this.cluster.discord.guilds.cache.get(g) !== undefined) {
                    const guild = this.cluster.discord.guilds.cache.get(g);
                    if (guild !== undefined) {
                        await this.cluster.util.sendDM(guild.ownerId, `Greetings! I regret to inform you that your guild, **${guild.name}** (${guild.id}), is on my blacklist. Sorry about that! I'll be leaving now. I hope you have a nice day.`);
                        await guild.leave();
                    }
                }
            }
        }
    }
}
