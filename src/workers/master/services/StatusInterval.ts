import { CronService } from '@core/serviceTypes';
import { randChoose } from '@core/utils';
import { Master } from '@master';
import { MasterOptions } from '@master/types';
import { ActivityOptions } from 'discord.js';
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

    public execute(): void {
        const date = moment().format('MM-DD');
        const holiday = this.#holidays[date];
        if (holiday === undefined)
            this.master.discord.user.setActivity(randChoose(games));
        else
            this.master.discord.user.setActivity(holiday);
    }
}

const games: ActivityOptions[] = [
    { type: 'PLAYING', name: 'with tiny bits of string!' },
    { type: 'PLAYING', name: 'with a mouse!' },
    { type: 'PLAYING', name: 'with a laser pointer!' },
    { type: 'PLAYING', name: 'with a ball of yarn!' },
    { type: 'PLAYING', name: 'in a box!' },
    { type: 'LISTENING', name: 'to the pitter-patter of tiny feet.' }
];
