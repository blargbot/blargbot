import { Cluster } from "../../cluster";
import { CommandHandler } from "./CommandHandler";
import { BaseWorker } from "../../core/BaseWorker";
import { cpuLoad, snowflake } from "../../newbu";

export class ClusterWorker extends BaseWorker {
    public readonly cluster: Cluster;
    public readonly commandHandler: CommandHandler;

    constructor(
        logger: CatLogger,
        public readonly config: Configuration
    ) {
        super(logger);
        const clusterId = this.env.CLUSTER_ID ?? '??';

        this.logger.init(`CLUSTER ${clusterId} (pid ${this.id}) PROCESS INITIALIZED`);

        this.commandHandler = new CommandHandler(this);
        this.cluster = new Cluster(logger, config, {
            id: clusterId,
            worker: this,
            shardCount: parseInt(process.env.SHARDS_MAX!),
            firstShardId: parseInt(process.env.SHARDS_FIRST!),
            lastShardId: parseInt(process.env.SHARDS_LAST!)
        });
    }

    async handle(type: string, id: Snowflake, data: JObject) {
        const response = await this.commandHandler.execute(type, data);
        this.send(type, id, response);
    }

    start() {
        this.cluster.start();
        super.start();

        setInterval(async () => {
            this.send('shardStats', snowflake.create(), {
                ...this.cluster.stats.getCurrent(),
                ...cpuLoad(),
                rss: this.memoryUsage.rss,
            });
        }, 10000);
    }
}