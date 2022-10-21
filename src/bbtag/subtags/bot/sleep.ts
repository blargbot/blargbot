import { parse, sleep } from '@blargbot/core/utils';
import moment from 'moment-timezone';

import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.sleep;

const maxSleep = moment.duration(5, 'minutes');

export class SleepSubtag extends CompiledSubtag {
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
                    returns: 'nothing',
                    execute: (_, [duration]) => this.sleep(duration.value)
                }
            ]
        });
    }

    public async sleep(duration: string): Promise<void> {
        let delay = parse.duration(duration);
        if (delay === undefined)
            throw new BBTagRuntimeError('Invalid duration');

        if (delay.asMilliseconds() > maxSleep.asMilliseconds())
            delay = maxSleep;

        await sleep(delay.asMilliseconds());
    }
}
