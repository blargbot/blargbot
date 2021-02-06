import { Cluster } from "../../cluster";
import { Sender } from "../../structures/Sender";
import { CommandHandler } from "./CommandHandler";
import { Options, ResultObject } from 'usage';

export class ClusterWorker {
    public readonly id: string;
    public readonly cluster: Cluster;
    public readonly commandHandler: CommandHandler;
    public readonly sender: Sender;
    constructor(
        public readonly process: NodeJS.Process,
        public readonly logger: CatLogger,
        public readonly config: Configuration
    ) {
        this.id = process.env.CLUSTER_ID!;

        this.process.on('unhandledRejection', (err, p) => {
            logger.error('Unhandled Promise Rejection: Promise', err);
        });

        this.logger.init(`CLUSTER ${this.id} (pid ${this.process.pid}) PROCESS INITIALIZED`);
        this.sender = new Sender(this.id, process, logger);

        this.cluster = new Cluster(logger, config, {
            id: this.id,
            sender: this.sender,
            shardCount: parseInt(process.env.SHARDS_MAX!),
            firstShardId: parseInt(process.env.SHARDS_FIRST!),
            lastShardId: parseInt(process.env.SHARDS_LAST!)
        });

        this.commandHandler = new CommandHandler(this.cluster);
    }

    start() {
        this.cluster.sender.send('threadReady', this.cluster.id);
        this.cluster.start();

        this.process.on('message', async message => {
            const { data, code } = JSON.parse(message);
            if (code.startsWith('await:')) {
                this.cluster.sender.emit(code, data);
            }

            const response = await this.commandHandler.execute(code, data);
            if (response === undefined || response === null)
                return;

            this.cluster.sender.send(`await:${data.key}`, response);
        });

        setInterval(async () => {
            let mem = this.process.memoryUsage();
            this.cluster.sender.send('shardStats', {
                ...this.cluster.stats.getCurrent(),
                rss: mem.rss,
                cpu: (await lookupAsync(this.process.pid, { keepHistory: true }))?.cpu
            });
        });
    }
}

async function lookupAsync(pid: number, options?: Options) {
    try {
        const usage = await import('usage');
        return await new Promise<ResultObject | null>(resolve =>
            usage.lookup(pid, options ?? { keepHistory: false }, (err, data) =>
                err ? resolve(null) : resolve(data)))
    } catch {
        return null;
    }
}