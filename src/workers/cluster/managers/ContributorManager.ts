import { Cluster } from '@cluster/Cluster';
import { User } from 'discord.js';
import reloadFactory from 'require-reload';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const reload = reloadFactory(require);

export class ContributorManager {
    public patrons: Array<User | string>;
    public donators: Array<User | string>;
    public others: Array<{ user: User | string; reason: string; decorator: string; }>

    public constructor(
        private readonly cluster: Cluster
    ) {
        this.patrons = [];
        this.donators = [];
        this.others = [];
    }

    public async refresh(): Promise<void> {
        const config = reload('@res/contributors.json') as typeof import('@res/contributors.json');
        this.patrons = await Promise.all(config.patrons.map(p => this.resolveUser(p)));
        this.donators = await Promise.all(config.donators.map(d => this.resolveUser(d)));
        this.others = await Promise.all(config.other.map(async o => ({ ...o, user: await this.resolveUser(o.user) })));
    }

    private async resolveUser(user: string): Promise<string | User> {
        if (!/\d+/.test(user))
            return user;
        return await this.cluster.util.getUser(user) ?? `A user I cant find! (ID: ${user})`;

    }
}
