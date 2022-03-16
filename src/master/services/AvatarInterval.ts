import { CronService } from '@blargbot/core/serviceTypes';
import { Master } from '@blargbot/master';
import { MasterOptions } from '@blargbot/master/types';
import moment from 'moment-timezone';

export class AvatarInterval extends CronService {
    readonly #avatars: readonly string[];
    public readonly type = 'discord';

    public constructor(
        public readonly master: Master,
        { avatars }: MasterOptions
    ) {
        super({ cronTime: '*/15 * * * *' }, master.logger);
        this.#avatars = avatars;
    }

    public async execute(): Promise<void> {
        this.logger.info('!=! Performing the avatar interval !=!');
        const time = moment();
        const h = parseInt(time.format('H'));
        // account for any number of possible avatars
        const m = Math.floor(parseInt(time.format('m')) / 15);
        const c = h * 4 + m;
        const id = c % this.#avatars.length;
        await this.master.discord.editSelf({ avatar: this.#avatars[id] });
    }
}
