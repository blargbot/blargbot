import { Cluster } from '@blargbot/cluster/Cluster';
import { IFormattable, util } from '@blargbot/formatting';
import Eris from 'eris';
import reloadFactory from 'require-reload';

import templates from '../text';

const reload = reloadFactory(require);

export class ContributorManager {
    public patrons: Array<Eris.User | IFormattable<string>>;
    public donators: Array<Eris.User | IFormattable<string>>;
    public others: Array<{ user: Eris.User | IFormattable<string>; reason: string; decorator: string; }>;
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

    async #resolveUser(user: string): Promise<IFormattable<string> | Eris.User> {
        if (!/\d+/.test(user))
            return util.literal(user);
        return await this.#cluster.util.getUser(user) ?? templates.contributors.notFound({ userId: user });
    }
}
