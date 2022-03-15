import { CronService } from '@blargbot/core/serviceTypes';
import { randChoose } from '@blargbot/core/utils';
import { Master } from '@blargbot/master';
import { MasterOptions } from '@blargbot/master/types';
import { ActivityPartial, BotActivityType, Constants } from 'eris';
import moment from 'moment-timezone';

export class StatusInterval extends CronService {
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
            this.master.discord.editStatus(randChoose(games));
        else
            this.master.discord.editStatus({ type: Constants.ActivityTypes.GAME, name: holiday });
    }
}

const games: Array<ActivityPartial<BotActivityType>> = [
    { type: Constants.ActivityTypes.GAME, name: 'with tiny bits of string!' },
    { type: Constants.ActivityTypes.GAME, name: 'with a mouse!' },
    { type: Constants.ActivityTypes.GAME, name: 'with a laser pointer!' },
    { type: Constants.ActivityTypes.GAME, name: 'with a ball of yarn!' },
    { type: Constants.ActivityTypes.GAME, name: 'in a box!' },
    { type: Constants.ActivityTypes.LISTENING, name: 'to the pitter-patter of tiny feet.' }
];
