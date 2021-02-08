import { metric } from 'prom-client';
import { snowflake } from '../newbu';
import { WorkerConnection } from './core/WorkerConnection';
import { ClusterStats, CommandListResult, GetStaffGuildsRequest, LookupChannelResult, TagListResult } from './ClusterWorker';
import { User } from 'eris';

export class ClusterConnection extends WorkerConnection {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #stats?: ClusterStats;

    public get stats(): ClusterStats | undefined { return this.#stats; }

    public constructor(
        id: number,
        public readonly shardRange: [number, number],
        shardCount: number,
        logger: CatLogger
    ) {
        super(id, 'cluster', logger);
        this.args.push('--max-old-space-size=4096');
        this.env.CLUSTER_ID = id.toString();
        this.env.SHARDS_MAX = shardCount.toString();
        this.env.SHARDS_FIRST = shardRange[0].toString();
        this.env.SHARDS_LAST = shardRange[1].toString();

        this.on('shardStats', (stats: ClusterStats) => this.#stats = stats);
    }

    public killShard(id: number): void {
        this.send('killshard', snowflake.create(), id);
    }

    public async metrics(timeoutMS?: number): Promise<metric[]> {
        return await this.request<metric[]>('metrics', null, timeoutMS);
    }

    public async lookupChannel(id: string, timeoutMS?: number): Promise<LookupChannelResult | null> {
        return await this.request<LookupChannelResult | null>('lookupChannel', id, timeoutMS);
    }

    public async retrieveUser(id: string, timeoutMS?: number): Promise<User | null> {
        return await this.request<User | null>('retrieveUser', id, timeoutMS);
    }

    public async getStaffGuilds(request: GetStaffGuildsRequest, timeoutMS?: number): Promise<string[]> {
        return await this.request<string[]>('getStaffGuilds', request, timeoutMS);
    }

    public async tagList(timeoutMS?: number): Promise<TagListResult> {
        return await this.request<TagListResult>('tagList', null, timeoutMS);
    }

    public async commandList(timeoutMS?: number): Promise<CommandListResult> {
        return await this.request<CommandListResult>('commandList', null, timeoutMS);
    }
}