import { Client as ErisClient, Message } from 'eris';
import { Cluster } from '../cluster';
import { ClusterUtilities } from '../cluster/ClusterUtilities';
import { SendContext, SendPayload, SendFiles } from '../core/BaseUtilities';
import { Database, StoredEvent } from '../core/database';
import { CommandType, FlagDefinition } from '../utils';

export interface DCommandOptions {
    aliases?: string[];
    category?: CommandType;
    hidden?: boolean;
    usage?: string;
    info?: string;
    flags?: FlagDefinition[];
    onlyOn?: string | null;
    cannotDisable?: boolean;
    userRatelimit?: boolean;
    channelRatelimit?: boolean;
    cooldown?: number;
}

export abstract class BaseDCommand implements Required<DCommandOptions>{
    public readonly aliases: string[];
    public readonly category: CommandType;
    public readonly isCommand: true;
    public readonly hidden: boolean;
    public readonly usage: string;
    public readonly info: string;
    public readonly flags: FlagDefinition[];
    public readonly onlyOn: string | null;
    public readonly cannotDisable: boolean;
    public readonly userRatelimit: boolean;
    public readonly channelRatelimit: boolean;
    public readonly cooldown: number;

    protected get util(): ClusterUtilities { return this.cluster.util; }
    protected get discord(): ErisClient { return this.cluster.discord; }
    protected get logger(): CatLogger { return this.cluster.logger; }
    protected get config(): Configuration { return this.cluster.config; }
    protected get database(): Database { return this.cluster.database; }

    protected constructor(
        protected readonly cluster: Cluster,
        public readonly name: string,
        options: DCommandOptions
    ) {
        this.aliases = options.aliases ?? [];
        this.category = options.category ?? CommandType.GENERAL;
        this.isCommand = true;
        this.hidden = options.hidden ?? false;
        this.usage = `${this.name} ${options.usage ?? ''}`.trimEnd();
        this.info = options.info ?? '';
        this.flags = options.flags ?? [];
        this.onlyOn = options.onlyOn ?? null;
        this.cannotDisable = options.cannotDisable ?? true;
        this.userRatelimit = options.userRatelimit ?? false;
        this.channelRatelimit = options.channelRatelimit ?? false;
        this.cooldown = options.cooldown ?? 0;
    }

    public event(event: StoredEvent): Promise<void> {
        this.logger.event(event);
        return Promise.resolve();
    }

    protected send(context: SendContext, payload: SendPayload, files?: SendFiles): Promise<Message | null> {
        return this.cluster.util.send(context, payload, files);
    }

    public abstract execute(message: Message, words: string[], text: string): Promise<void>
}