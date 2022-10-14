import { Cluster } from '@blargbot/cluster/Cluster';
import { TranslatableString } from '@blargbot/domain/messages/index';
import { IFormattable } from '@blargbot/domain/messages/types';
import { User } from 'eris';
import reloadFactory from 'require-reload';

import { literal } from '../text';

const reload = reloadFactory(require);

const unknownUser = TranslatableString.define<{ userId: string; }, string>(`contributor.notFound`, `A user I cant find! (ID: {userId})`);

export class ContributorManager {
    public patrons: Array<User | IFormattable<string>>;
    public donators: Array<User | IFormattable<string>>;
    public others: Array<{ user: User | IFormattable<string>; reason: string; decorator: string; }>;
    readonly #cluster: Cluster;

    public constructor(
        cluster: Cluster
    ) {
        this.patrons = [];
        this.donators = [];
        this.others = [];
        this.#cluster = cluster;
    }

    public async refresh(): Promise<void> {
        // eslint-disable-next-line quotes
        const config = reload(`@blargbot/res/contributors.json`) as typeof import('@blargbot/res/contributors.json');
        this.patrons = await Promise.all(config.patrons.map(p => this.#resolveUser(p)));
        this.donators = await Promise.all(config.donators.map(d => this.#resolveUser(d)));
        this.others = await Promise.all(config.other.map(async o => ({ ...o, user: await this.#resolveUser(o.user) })));
    }

    async #resolveUser(user: string): Promise<IFormattable<string> | User> {
        if (!/\d+/.test(user))
            return literal(user);
        return await this.#cluster.util.getUser(user) ?? unknownUser({ userId: user });
    }
}
