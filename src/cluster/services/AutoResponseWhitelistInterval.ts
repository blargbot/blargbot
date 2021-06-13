import { IntervalService } from '../../structures/IntervalService';
import { Cluster } from '../Cluster';

export class AutoResponseWhitelistInterval extends IntervalService {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #whitelist: Set<string>;

    public readonly type: string = 'bbtag';
    public get guilds(): ReadonlySet<string> { return this.#whitelist; }

    public constructor(private readonly cluster: Cluster) {
        super(1000 * 60 * 15, cluster.logger);
        this.#whitelist = new Set();
    }

    protected async execute(): Promise<void> {
        const whitelist = await this.cluster.database.vars.get('arwhitelist');
        this.#whitelist = new Set(whitelist?.values);
    }
}