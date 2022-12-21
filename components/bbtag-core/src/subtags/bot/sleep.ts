import { parse, sleep } from '@blargbot/core/utils/index.js';
import moment from 'moment-timezone';

import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';
import { BBTagRuntimeError } from '../../errors/BBTagRuntimeError.js';

const maxSleep = moment.duration(5, 'minutes');

export class SleepSubtag extends Subtag {
    public constructor() {
        super({
            name: 'sleep',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['duration'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
