import { Cluster } from '@blargbot/cluster/Cluster';
import { User } from 'eris';
import reloadFactory from 'require-reload';

const reload = reloadFactory(require);

export class ContributorManager {
    public patrons: Array<User | string>;
    public donators: Array<User | string>;
    public others: Array<{ user: User | string; reason: string; decorator: string; }>;
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
        const config = reload('@blargbot/res/contributors.json') as typeof import('@blargbot/res/contributors.json');
        this.patrons = await Promise.all(config.patrons.map(p => this.#resolveUser(p)));
        this.donators = await Promise.all(config.donators.map(d => this.#resolveUser(d)));
        this.others = await Promise.all(config.other.map(async o => ({ ...o, user: await this.#resolveUser(o.user) })));
    }

    async #resolveUser(user: string): Promise<string | User> {
        if (!/\d+/.test(user))
            return user;
        return await this.#cluster.util.getUser(user) ?? `A user I cant find! (ID: ${user})`;
    }
}
