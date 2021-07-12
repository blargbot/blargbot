import { DiscordEventService, metrics } from '../core';
import { Cluster } from '../Cluster';

export class DiscordReadyHandler extends DiscordEventService<'ready'> {
    public constructor(
        public readonly cluster: Cluster
    ) {
        super(cluster.discord, 'ready', cluster.logger);
    }

    public async execute(): Promise<void> {
        this.logger.init(`Ready! Logged in as ${this.cluster.discord.user.username}#${this.cluster.discord.user.discriminator}`);

        metrics.guildGauge.set(this.cluster.discord.guilds.size);

        const guildIds = new Set(await this.cluster.database.guilds.getIds());
        for (const guild of this.cluster.discord.guilds.values()) {
            if (guildIds.has(guild.id))
                return;

            const members = guild.memberCount;
            const users = guild.members.filter(m => !m.user.bot).length;
            const bots = guild.members.filter(m => m.user.bot).length;
            const percent = Math.floor(bots / members * 10000) / 100;
            const message = `:ballot_box_with_check: Guild: \`${guild.name}\` (\`${guild.id}\`)! ${percent >= 80 ? '- ***BOT GUILD***' : ''}\n` +
                `    Total: **${members}** | Users: **${users}** | Bots: **${bots}** | Percent: **${percent}**`;
            void this.cluster.util.send(this.cluster.config.discord.channels.joinlog, message);

            this.logger.log('Inserting a missing guild ' + guild.id);
            void this.cluster.database.guilds.add({
                guildid: guild.id,
                active: true,
                name: guild.name,
                settings: {},
                channels: {},
                commandperms: {},
                ccommands: {},
                modlog: []
            });
        }

        void this.cluster.util.postStats();

        const blacklist = await this.cluster.database.vars.get('guildBlacklist');
        if (blacklist !== undefined) {
            for (const g of Object.keys(blacklist.values)) {
                if (blacklist.values[g] !== undefined && this.cluster.discord.guilds.get(g) !== undefined) {
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
