import moment, { Duration } from 'moment-timezone';
import { Cluster } from '../Cluster';
import { BaseGlobalCommand, CommandContext, commandTypes, fafo, guard } from '../core';

export class TimerCommand extends BaseGlobalCommand {
    public constructor(cluster: Cluster) {
        super({
            name: 'remind',
            aliases: ['remindme'],
            category: commandTypes.GENERAL,
            flags: [
                { flag: 'c', word: 'channel', description: 'Sets the reminder to appear in the current channel rather than a DM' }
            ],
            definitions: [
                {
                    parameters: '{~message+} in {duration:duration+}',
                    description: 'Reminds you about something after a period of time in a DM.',
                    execute: (ctx, [message, duration], { c: channel }) => this.addTimer(ctx, duration, message, channel !== undefined)
                }
            ]
        });

        cluster.timeouts.on('remind', fafo(async event => {
            const duration = moment(event.starttime).fromNow();
            await cluster.util.send(event.channel, {
                content: `⏰ Hi, <@${event.user}>! You asked me to remind you about this ${duration}:\n${event.content}`,
                allowedMentions: { users: [event.user] }
            });
        }));
    }

    public async addTimer(context: CommandContext, duration: Duration, message: string, inChannel: boolean): Promise<string> {
        if (duration.asMilliseconds() <= 0)
            return this.error('I cant set a timer for 0 seconds!');

        if (message.length === 0)
            return this.error('You need to say what you need reminding of!');

        const channel = inChannel && guard.isGuildCommandContext(context) ? context.channel : await context.discord.getDMChannel(context.author.id);
        const source = inChannel && guard.isGuildCommandContext(context) ? context.channel.guild.id : context.author.id;

        await context.cluster.timeouts.insert('remind', {
            source: source,
            user: context.author.id,
            channel: channel.id,
            endtime: moment().add(duration).valueOf(),
            content: message
        });

        return this.success(`Ok, ill ping you ${channel === context.channel ? 'here' : 'in a DM'} ${duration.humanize(true)}`);
    }

}
