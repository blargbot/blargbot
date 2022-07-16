import { Cluster } from '@blargbot/cluster';
import { guard } from '@blargbot/cluster/utils';
import { metrics } from '@blargbot/core/Metrics';
import { DiscordEventService } from '@blargbot/core/serviceTypes';
import { Guild } from 'eris';

export class DiscordGuildCreateHandler extends DiscordEventService<'guildCreate'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.discord, 'guildCreate', cluster.logger, (guild) => this.execute(guild));
    }

    public async execute(guild: Guild): Promise<void> {
        metrics.guildGauge.inc();
        const blacklisted = await this.cluster.database.vars.get('guildBlacklist');
        if (blacklisted?.values[guild.id] === true) {
            try {
                await this.cluster.util.sendDM(guild.ownerID, `Greetings! I regret to inform you that your guild, **${guild.name}** (${guild.id}), is on my blacklist. Sorry about that! I'll be leaving now. I hope you have a nice day.`);
            } catch (err: unknown) {
                this.cluster.logger.error(err);
                // NOOP
            }
            await guild.leave();
            return;
        }

        await this.cluster.util.postStats();
        if (await this.cluster.database.guilds.isActive(guild.id))
            return;

        await this.cluster.database.guilds.upsert(guild);

        const prefix = this.cluster.config.discord.defaultPrefix;
        const welcomeMessage = `Hi! My name is blargbot, a multifunctional discord bot here to serve you!
- 💻 For command information, please do \`${prefix}help\`!
- 🛠 For Admin commands, please make sure you have a role titled \`Admin\`.
If you are the owner of this server, here are a few things to know.
- 🗨 To enable modlogging, please create a channel for me to log in and do \`${prefix}modlog\`
- ❗ To change my command prefix for your guild, please do \`${prefix}prefix add <anything>\`. I also have a personnal prefix feature! Check it out with \`${prefix}help personalprefix\`.
- 🗄 To enable chatlogs, please do \`${prefix}settings makelogs true\`.
- ⚙ To receive messages whenever there's an update, do \`${prefix}changelog\` in the desired channel. I need the \`embed links\` permission for this.

❓ If you have any questions, comments, or concerns, please do \`${prefix}feedback <feedback>\`. Thanks!
👍 I hope you enjoy my services! 👍`;

        const member = await this.cluster.util.getMember(guild, this.discord.user.id);
        if (member !== undefined) {
            for (const channel of guild.channels.filter(guard.isTextableChannel).values()) {
                if (channel.permissionsOf(member).has('sendMessages') && await this.cluster.util.send(channel, welcomeMessage) !== undefined) {
                    break;
                }
            }
        }
    }

}
