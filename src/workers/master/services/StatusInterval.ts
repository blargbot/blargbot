import { CronService } from '@core/serviceTypes';
import { randChoose } from '@core/utils';
import { Master } from '@master';
import { MasterOptions } from '@master/types';
import { BotActivityType } from 'eris';
import moment from 'moment';

export class StatusInterval extends CronService {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #holidays: Record<string, string>;
    public readonly type = 'discord';

    public constructor(
        public readonly master: Master,
        { holidays }: MasterOptions
    ) {
        super({ cronTime: '*/15 * * * *' }, master.logger);
        this.#holidays = holidays;
    }

    protected execute(): void {
        let type: BotActivityType = 0;

        const date = moment().format('MM-DD');
        let name = this.#holidays[date];
        if (name === undefined)
            ({ name, type = 0 } = randChoose(games));

        this.master.discord.editStatus('online', { name, type });
    }
}

const games: Array<{ name: string; type?: BotActivityType; }> = [
    { name: 'with tiny bits of string!' },
    { name: 'with a mouse!' },
    { name: 'with a laser pointer!', type: 3 },
    { name: 'with a ball of yarn!' },
    { name: 'in a box!' },
    { name: 'the pitter-patter of tiny feet.', type: 2 }
];
