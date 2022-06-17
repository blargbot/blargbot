import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType, guard } from '@blargbot/cluster/utils';
import { parse } from '@blargbot/core/utils';
import moment from 'moment-timezone';

export class TimerCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'remind',
            aliases: ['remindme'],
            category: CommandType.GENERAL,
            flags: [
                { flag: 'c', word: 'channel', description: 'Sets the reminder to appear in the current channel rather than a DM' },
                { flag: 't', word: 'time', description: 'The time before the user is to be reminded, formatted as \'1 day 2 hours 3 minutes and 4 seconds\', \'1d 2h 3m 4s\', or some other combination' }
            ],
            definitions: [
                {
                    parameters: '{~message+}',
                    description: 'Reminds you about something after a period of time in a DM.',
                    execute: (ctx, [message], { c: channel, t: time }) => this.addTimer(ctx, time?.merge().value ?? '0s', message.asString, channel !== undefined)
                }
            ]
        });
    }

    public async addTimer(context: CommandContext, durationStr: string, message: string, inChannel: boolean): Promise<string> {
        const duration = parse.duration(durationStr);
        if (duration === undefined || duration.asMilliseconds() <= 0)
            return this.error('I cant set a timer for 0 seconds!');

        if (message.length === 0)
            return this.error('You need to say what you need reminding of!');

        const channel = inChannel && guard.isGuildCommandContext(context) ? context.channel : await context.author.getDMChannel();
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
