import moment, { Duration } from 'moment-timezone';
import { Cluster } from '../Cluster';
import { BaseGlobalCommand, CommandContext, commandTypes, fafo, guard } from '../core';

export class TimerCommand extends BaseGlobalCommand {
    public constructor(cluster: Cluster) {
        super({
            name: 'timer',
            aliases: ['stopwatch'],
            category: commandTypes.GENERAL,
            flags: [
                { flag: 'c', word: 'channel', description: 'Sets the reminder to appear in the current channel rather than a DM' }
            ],
            definitions: [
                {
                    parameters: '{duration:duration+}',
                    description: 'Sets a timer for the provided duration, formatted as \'1 day 2 hours 3 minutes and 4 seconds\', \'1d2h3m4s\', or some other combination.',
                    execute: (ctx, [duration], { c: channel }) => this.addTimer(ctx, duration, channel !== undefined)
                }
            ]
        });

        cluster.timeouts.on('timer', fafo(async event => {
            const duration = moment(event.starttime).fromNow();
            await cluster.util.send(event.channel, {
                content: `⏰ *Bzzt!* <@${event.user}>, the timer you set ${duration} has gone off! *Bzzt!* ⏰`,
                allowedMentions: { users: [event.user] }
            });
        }));
    }

    public async addTimer(context: CommandContext, duration: Duration, inChannel: boolean): Promise<string> {
        if (duration.asMilliseconds() <= 0)
            return this.error('I cant set a timer for 0 seconds!');

        const channel = inChannel && guard.isGuildCommandContext(context) ? context.channel : await context.discord.getDMChannel(context.author.id);
        const source = inChannel && guard.isGuildCommandContext(context) ? context.channel.guild.id : context.author.id;

        await context.cluster.timeouts.insert('timer', {
            source: source,
            user: context.author.id,
            channel: channel.id,
            endtime: moment().add(duration).valueOf()
        });

        return this.success(`Ok, ill ping you ${channel === context.channel ? 'here' : 'in a DM'} ${duration.humanize(true)}`);
    }

}
