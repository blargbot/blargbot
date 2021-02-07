import { Client as ErisClient, Message, TextableChannel } from 'eris';
import { Cluster } from '../cluster';
import { ClusterUtilities } from '../cluster/ClusterUtilities';
import { CommandType, FlagDefinition } from '../newbu';

export interface DCommandOptions {
    aliases?: string[];
    category?: CommandType;
    hidden?: boolean;
    usage?: string;
    info?: string;
    longinfo?: string | null;
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
    public readonly longinfo: string | null;
    public readonly flags: FlagDefinition[];
    public readonly onlyOn: string | null;
    public readonly cannotDisable: boolean;
    public readonly userRatelimit: boolean;
    public readonly channelRatelimit: boolean;
    public readonly cooldown: number;

    protected get util(): ClusterUtilities { return this.cluster.util; }
    protected get discord(): ErisClient { return this.cluster.discord; }
    protected get logger(): CatLogger { return this.cluster.logger; }

    protected constructor(
        public readonly cluster: Cluster,
        public readonly name: string,
        options: DCommandOptions
    ) {
        this.aliases = options.aliases ?? [];
        this.category = options.category ?? CommandType.GENERAL;
        this.isCommand = true;
        this.hidden = options.hidden ?? false;
        this.usage = `${this.name} ${options.usage ?? ''}`.trimEnd();
        this.info = options.info ?? '';
        this.longinfo = options.longinfo ?? null;
        this.flags = options.flags ?? [];
        this.onlyOn = options.onlyOn ?? null;
        this.cannotDisable = options.cannotDisable ?? true;
        this.userRatelimit = options.userRatelimit ?? false;
        this.channelRatelimit = options.channelRatelimit ?? false;
        this.cooldown = options.cooldown ?? 0;
    }

    public event(message: unknown): Promise<void> {
        this.logger.event(message);
        return Promise.resolve();
    }

    abstract execute(message: Message<TextableChannel>, words: string[], text: string): Promise<void>;
}