import moment from 'moment';
import { CronService, MasterOptions } from '@master/core';
import { Master } from '../Master';

export class AvatarInterval extends CronService {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #avatars: readonly string[];
    public readonly type = 'discord';

    public constructor(
        public readonly master: Master,
        { avatars }: MasterOptions
    ) {
        super({ cronTime: '*/15 * * * *' }, master.logger);
        this.#avatars = avatars;
    }

    protected async execute(): Promise<void> {
        this.logger.info('!=! Performing the avatar interval !=!');
        if (this.master.config.general.isbeta)
            return;
        const time = moment();
        const h = parseInt(time.format('H'));
        // account for any number of possible avatars
        const m = Math.floor(parseInt(time.format('m')) / 15);
        const c = h * 4 + m;
        const id = c % this.#avatars.length;
        await this.master.discord.editSelf({
            avatar: this.#avatars[id]
        });
    }
}
