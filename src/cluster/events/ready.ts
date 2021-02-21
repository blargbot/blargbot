import moment from 'moment-timezone';
import { humanize } from '../../utils';
import { Cluster } from '..';
import { DiscordEventService } from '../../structures/DiscordEventService';
import { metrics } from '../../core/Metrics';

export class ReadyEventHandler extends DiscordEventService {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #obtainEventTimer?: NodeJS.Timeout;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #processEventTimer?: NodeJS.Timeout;

    public constructor(
        public readonly cluster: Cluster
    ) {
        super(cluster.discord, 'ready', cluster.logger);
    }

    public async execute(): Promise<void> {
        this.logger.init(`Ready! Logged in as ${this.cluster.discord.user.username}#${this.cluster.discord.user.discriminator}`);

        let home;
        if (home = this.cluster.discord.guilds.get(this.cluster.config.discord.guilds.home)) {
            const police = home.members.filter(m => m.roles.includes(this.cluster.config.discord.roles.police)).map(m => m.id);
            await this.cluster.database.vars.set('police', { value: police });

            const support = home.members.filter(m => m.roles.includes(this.cluster.config.discord.roles.support)).map(m => m.id);
            await this.cluster.database.vars.set('support', { value: support });
        }

        // TODO this should be something the master process does
        if (this.cluster.id === 0) {
            const restart = await this.cluster.database.vars.get('restart');

            if (restart?.varvalue) {
                void this.cluster.util.send(restart.varvalue.channel, 'Ok I\'m back. It took me ' + humanize.duration(moment(), moment(restart.varvalue.time)) + '.');
                void this.cluster.database.vars.delete('restart');
            }
        }

        metrics.guildGauge.set(this.cluster.discord.guilds.size);

        const guildIds = new Set(await this.cluster.database.guilds.getIds());
        for (const guild of this.cluster.discord.guilds.values()) {
            if (guildIds.has(guild.id))
                return;

            const members = guild.memberCount;
            const users = guild.members.filter(m => !m.user.bot).length;
            const bots = guild.members.filter(m => m.user.bot).length;
            const percent = Math.floor(bots / members * 10000) / 100;
            const message =
                `:ballot_box_with_check: Guild: \`${guild.name}\` (\`${guild.id}\`)! ${percent >= 80 ? '- ***BOT GUILD***' : ''}\n` +
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


        this.cluster.util.postStats();
        void this.initEvents();

        const blacklist = await this.cluster.database.vars.get('guildBlacklist');
        if (blacklist) {
            for (const g of Object.keys(blacklist.values)) {
                if (blacklist.values[g] && this.cluster.discord.guilds.get(g)) {
                    const guild = this.cluster.discord.guilds.get(g);
                    if (guild) {
                        await this.cluster.util.sendDM(guild.ownerID, `Greetings! I regret to inform you that your guild, **${guild.name}** (${guild.id}), is on my blacklist. Sorry about that! I'll be leaving now. I hope you have a nice day.`);
                        await guild.leave();
                    }
                }
            }
        }
    }

    private async initEvents(): Promise<void> {
        this.logger.init('Starting event interval!');
        if (this.#obtainEventTimer)
            clearInterval(this.#obtainEventTimer);

        this.#obtainEventTimer = setInterval(
            () => void this.cluster.triggers.obtain(),
            5 * 60 * 1000);

        if (this.#processEventTimer)
            clearInterval(this.#processEventTimer);

        this.#processEventTimer = setInterval(
            () => void this.cluster.triggers.process(),
            10 * 1000);

        await this.cluster.triggers.obtain();
        await this.cluster.triggers.process();
    }
}