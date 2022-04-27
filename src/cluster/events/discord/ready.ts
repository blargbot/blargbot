import { Cluster } from '@blargbot/cluster';
import { metrics } from '@blargbot/core/Metrics';
import { DiscordEventService } from '@blargbot/core/serviceTypes';

export class DiscordReadyHandler extends DiscordEventService<'ready'> {
    public constructor(
        public readonly cluster: Cluster
    ) {
        super(cluster.discord, 'ready', cluster.logger, () => this.execute());
    }

    public async execute(): Promise<void> {
        this.logger.init(`Ready! Logged in as ${this.cluster.discord.user.username}#${this.cluster.discord.user.discriminator}`);

        metrics.guildGauge.set(this.cluster.discord.guilds.size);

        for (const guild of this.cluster.discord.guilds.values()) {
            if (await this.cluster.database.guilds.upsert(guild) !== 'inserted')
                continue;

            const members = guild.memberCount;
            await this.cluster.util.ensureMemberCache(guild);
            const users = guild.members.filter(m => !m.user.bot).length;
            const bots = guild.members.filter(m => m.user.bot).length;
            const percent = Math.floor(bots / members * 10000) / 100;
            const message = `:ballot_box_with_check: Guild: \`${guild.name}\` (\`${guild.id}\`)! ${percent >= 80 ? '- ***BOT GUILD***' : ''}\n` +
                `    Total: **${members}** | Users: **${users}** | Bots: **${bots}** | Percent: **${percent}**`;
            void this.cluster.util.send(this.cluster.config.discord.channels.joinlog, message);
        }

        void this.cluster.util.postStats();

        const blacklist = await this.cluster.database.vars.get('guildBlacklist');
        if (blacklist !== undefined) {
            for (const g of Object.keys(blacklist.values)) {
                if (blacklist.values[g] === true && this.cluster.discord.guilds.get(g) !== undefined) {
                    const guild = this.cluster.discord.guilds.get(g);
                    if (guild !== undefined) {
                        await this.cluster.util.sendDM(guild.ownerID, `Greetings! I regret to inform you that your guild, **${guild.name}** (${guild.id}), is on my blacklist. Sorry about that! I'll be leaving now. I hope you have a nice day.`);
                        await guild.leave();
                    }
                }
            }
        }
    }
}
