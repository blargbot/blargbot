import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';
import { TimePlugin } from '../../plugins/TimePlugin.js';

export class TimeSubtag extends Subtag {
    public constructor() {
        super({
            name: 'time'
        });
    }

    @Subtag.signature(
        p.plugin(TimePlugin),
        p.string('format').optional('YYYY-MM-DDTHH:mm:ssZ'),
        p.string('time').optional('now'),
        p.string('parseFormat').optional(''),
        p.string('fromTimezone').optional('Etc/UTC'),
        p.string('toTimezone').optional('Etc/UTC')
    ).returns('string')
    public changeTimezone(time: TimePlugin, outputFormat: string, timestampStr: string, inputFormat: string, inputTimezone: string, outputTimezone: string): string {
        return time.parseTime(timestampStr, inputFormat, inputTimezone)
            .toTimezone(outputTimezone)
            .format(outputFormat);
    }
}
