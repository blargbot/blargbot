import { Message } from 'eris';
import { Cluster, ClusterUtilities } from '../../cluster';
import { CommandType, FlagDefinition } from '../../utils';
import { Database } from '../database';
import { compileHandlerTree } from './compileHandlerTree';
import { CommandHandler, CommandHandlerTree, CommandOptions } from './types';
import { Client as ErisClient } from 'eris';


export abstract class BaseCommand implements Required<CommandOptions> {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #getHandler?: (args: string[]) => CommandHandler<this>;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #concurrencyGuard: Record<string, number | undefined>;

    public readonly name: string;
    public abstract handlers: CommandHandlerTree<this>;
    public readonly aliases: string[];
    public readonly category: CommandType;
    public readonly cannotDisable: boolean;
    public readonly hidden: boolean;
    public readonly usage: string;
    public readonly info: string;
    public readonly flags: FlagDefinition[];
    public readonly onlyOn: string | null;

    protected get util(): ClusterUtilities { return this.cluster.util; }
    protected get logger(): CatLogger { return this.cluster.logger; }
    protected get database(): Database { return this.cluster.database; }
    protected get discord(): ErisClient { return this.cluster.discord; }

    protected constructor(
        protected readonly cluster: Cluster,
        options: CommandOptions
    ) {
        this.name = options.name;
        this.aliases = options.aliases ?? [];
        this.category = options.category;
        this.cannotDisable = options.cannotDisable ?? true;
        this.hidden = options.hidden ?? false;
        this.usage = 'WIP';
        this.info = options.info;
        this.flags = options.flags ?? [];
        this.onlyOn = options.onlyOn ?? null;
        this.#concurrencyGuard = {};
    }

    private getHandler(args: string[]): CommandHandler<this> {
        this.#getHandler ??= compileHandlerTree(this.handlers, this.name);
        return this.#getHandler(args);
    }

    public async execute(message: Message, args: string[], raw: string): Promise<void> {
        const handler = this.getHandler(args);
        const result = await handler.call(this, message, args, raw);
        if (result !== undefined)
            await this.util.send(message, result);
    }
}