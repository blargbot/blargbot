import { Subtag } from '@bbtag/subtag';

import { TimePlugin } from '../../plugins/TimePlugin.js';
import { p } from '../p.js';

export class TimeSubtag extends Subtag {
    public constructor() {
        super({
            name: 'time'
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.plugin(TimePlugin))
        .parameter(p.string('format').optional('YYYY-MM-DDTHH:mm:ssZ'))
        .parameter(p.string('time').optional('now'))
        .parameter(p.string('parseFormat').optional(''))
        .parameter(p.string('fromTimezone').optional('Etc/UTC'))
        .parameter(p.string('toTimezone').optional('Etc/UTC'))
    public changeTimezone(time: TimePlugin, outputFormat: string, timestampStr: string, inputFormat: string, inputTimezone: string, outputTimezone: string): string {
        return time.parseTime(timestampStr, inputFormat, inputTimezone)
            .toTimezone(outputTimezone)
            .format(outputFormat);
    }
}
