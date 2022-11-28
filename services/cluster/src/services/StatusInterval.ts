import { CronService } from '@blargbot/core/serviceTypes';
import { createHash } from 'crypto';
import Eris from 'eris';
import moment from 'moment-timezone';

import { Cluster } from '../Cluster';
import { ClusterOptions } from '../types';

export class StatusInterval extends CronService {
    public readonly holidays: Record<string, string | undefined>;
    public readonly type = 'discord';

    public constructor(
        public readonly cluster: Cluster,
        { holidays }: ClusterOptions
    ) {
        super({ cronTime: '*/15 * * * *' }, cluster.logger);
        this.holidays = holidays;
    }

    public execute(): void {
        this.logger.info('!=! Performing the status interval !=!');
        const date = moment().format('MM-DD');
        const cronId = Math.round(moment().valueOf() / moment.duration(15, 'minutes').asMilliseconds());
        const holiday = this.holidays[date];
        const status = holiday === undefined ? games[parseInt(createHash('md5').update(cronId.toString()).digest('hex'), 16) % games.length] : { type: Eris.Constants.ActivityTypes.GAME, name: holiday };
        this.cluster.discord.editStatus('online', [status]);
    }

    public start(): void {
        super.start();
        this.execute();
    }
}

const games: Array<Eris.ActivityPartial<Eris.BotActivityType>> = [
    { type: Eris.Constants.ActivityTypes.GAME, name: 'with tiny bits of string!' },
    { type: Eris.Constants.ActivityTypes.GAME, name: 'with a mouse!' },
    { type: Eris.Constants.ActivityTypes.GAME, name: 'with a laser pointer!' },
    { type: Eris.Constants.ActivityTypes.GAME, name: 'with a ball of yarn!' },
    { type: Eris.Constants.ActivityTypes.GAME, name: 'in a box!' },
    { type: Eris.Constants.ActivityTypes.LISTENING, name: 'to the pitter-patter of tiny feet.' }
];
