import type { Cluster } from '@blargbot/cluster/Cluster.js';
import type { IFormattable} from '@blargbot/formatting';
import { util } from '@blargbot/formatting';
import res from '@blargbot/res';
import type * as Eris from 'eris';

import templates from '../text.js';

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
        const config = await res.contributors.reload();
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
