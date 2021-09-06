import { BaseGlobalCommand, CommandContext } from '@cluster/command';
import { CommandType, guard } from '@cluster/utils';
import moment, { Duration } from 'moment-timezone';

export class TimerCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'remind',
            aliases: ['remindme'],
            category: CommandType.GENERAL,
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
    }

    public async addTimer(context: CommandContext, duration: Duration, message: string, inChannel: boolean): Promise<string> {
        if (duration.asMilliseconds() <= 0)
            return this.error('I cant set a timer for 0 seconds!');

        if (message.length === 0)
            return this.error('You need to say what you need reminding of!');

        const channel = inChannel && guard.isGuildCommandContext(context) ? context.channel : context.author.dmChannel ?? await context.author.createDM();
        const source = inChannel && guard.isGuildCommandContext(context) ? context.channel.guild.id : context.author.id;

        await context.cluster.timeouts.insert('remind', {
            source: source,
            user: context.author.id,
            channel: channel.id,
            endtime: moment().add(duration).valueOf(),
            content: message
        });

        return this.success(`Ok, ill ping you ${channel === context.channel ? 'here' : 'in a DM'} <t:${moment().add(duration).unix()}:R>`);
    }

}
