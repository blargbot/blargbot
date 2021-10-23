import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { parse, sleep, SubtagType } from '@cluster/utils';
import moment from 'moment';

const maxSleep = moment.duration(5, 'minutes');

export class SleepTag extends BaseSubtag {
    public constructor() {
        super({
            name: 'sleep',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['duration'],
                    description: 'Pauses the current tag for the specified amount of time. Maximum is 5 minutes',
                    exampleCode: '{sleep;10s}{send;{channelid};Hi!}',
                    exampleOut: '(After 10s) Hi!',
                    execute: (ctx, [duration], subtag) => this.sleep(ctx, duration.value, subtag)
                }
            ]
        });
    }
    public async sleep(context: BBTagContext, duration: string, subtag: SubtagCall): Promise<void | string> {
        let delay = parse.duration(duration);
        if (delay === undefined)
            return context.addError('Invalid duration', subtag);

        if (delay.asMilliseconds() > maxSleep.asMilliseconds())
            delay = maxSleep;

        await sleep(delay.asMilliseconds());
    }
}
