import { CronService } from '@core/serviceTypes';
import { randChoose } from '@core/utils';
import { Master } from '@master';
import { MasterOptions } from '@master/types';
import moment from 'moment';

export class StatusInterval extends CronService {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #holidays: Record<string, string | undefined>;
    public readonly type = 'discord';

    public constructor(
        public readonly master: Master,
        { holidays }: MasterOptions
    ) {
        super({ cronTime: '*/15 * * * *' }, master.logger);
        this.#holidays = holidays;
    }

    protected execute(): void {
        const date = moment().format('MM-DD');
        this.master.discord.user.setActivity({
            name: this.#holidays[date] ?? randChoose(games),
            type: 'CUSTOM'
        });
    }
}

const games: string[] = [
    'Playing with tiny bits of string!',
    'Playing with a mouse!',
    'Playing with a laser pointer!',
    'Playing with a ball of yarn!',
    'Playing in a box!',
    'Listening to the pitter-patter of tiny feet.'
];
