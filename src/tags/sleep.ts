/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:57:14
 * @Last Modified by: RagingLink
 * @Last Modified time: 2021-06-10 13:19:26
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

import moment from 'moment';
import { Cluster } from '../cluster';
import { BaseSubtag, RuntimeContext, SubtagCall } from '../core/bbtag';
import { parse, sleep } from '../utils';
import { Type } from '../utils/constants/subtagType';

const maxSleep = moment.duration(5, 'minutes');

export class SleepTag extends BaseSubtag {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'sleep',
            category: Type.COMPLEX,
            desc: 'Pauses the current tag for the specified amount of time. Maximum is 5 minutes',
            usage: '{sleep;<duration>}',
            exampleCode: '{sleep;10s}{send;{channelid};Hi!}',
            exampleOut: '(After 10s) Hi!',
            definition: {
                whenArgCount: {
                    '1': (ctx, [duration], subtag) => this.sleep(ctx, duration.value, subtag)
                }
            }
        });
    }
    public async sleep(context: RuntimeContext, duration: string, subtag: SubtagCall): Promise<void | string> {
        let delay = parse.duration(duration);
        if (delay === undefined)
            return context.addError('Invalid duration', subtag);

        if (delay.asMilliseconds() > maxSleep.asMilliseconds())
            delay = maxSleep;

        await sleep(delay.asMilliseconds());
    }
}