import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType, guard } from '@blargbot/cluster/utils';
import moment, { Duration } from 'moment-timezone';

export class TimerCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `timer`,
            aliases: [`stopwatch`],
            category: CommandType.GENERAL,
            flags: [
                { flag: `c`, word: `channel`, description: `Sets the reminder to appear in the current channel rather than a DM` }
            ],
            definitions: [
                {
                    parameters: `{duration:duration+}`,
                    description: `Sets a timer for the provided duration, formatted as '1 day 2 hours 3 minutes and 4 seconds', '1d2h3m4s', or some other combination.`,
                    execute: (ctx, [duration], { c: channel }) => this.addTimer(ctx, duration.asDuration, channel !== undefined)
                }
            ]
        });
    }

    public async addTimer(context: CommandContext, duration: Duration, inChannel: boolean): Promise<string> {
        if (duration.asMilliseconds() <= 0)
            return this.error(`I cant set a timer for 0 seconds!`);

        const channel = inChannel && guard.isGuildCommandContext(context) ? context.channel : await context.author.getDMChannel();
        const source = inChannel && guard.isGuildCommandContext(context) ? context.channel.guild.id : context.author.id;

        await context.cluster.timeouts.insert(`timer`, {
            source: source,
            user: context.author.id,
            channel: channel.id,
            endtime: moment().add(duration).valueOf()
        });

        return this.success(`Ok, ill ping you ${channel === context.channel ? `here` : `in a DM`} <t:${moment().add(duration).unix()}:R>`);
    }

}
