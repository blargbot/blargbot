import { Cluster, ClusterUtilities } from '@cluster';
import { BBTagEngine } from '@cluster/bbtag';
import { CommandResult, GuildCommandContext, ICommand } from '@cluster/types';
import { Database } from '@core/database';
import { Logger } from '@core/Logger';
import { ChoiceQueryResult, DMContext, SendContext, SendPayload, SlimEntityFindQueryOptions, SlimEntityPickQueryOptions, SlimEntityQueryOptions, SlimTextQueryOptions, SlimTextQueryOptionsParsed, TextQueryResult } from '@core/types';
import { guard } from '@core/utils';
import { Client as Discord, GuildChannels, GuildMember, KnownChannel, Message, Role, TextBasedChannels, User, Webhook } from 'discord.js';

export class CommandContext<TChannel extends TextBasedChannels = TextBasedChannels> {
    public get logger(): Logger { return this.cluster.logger; }
    public get bbtag(): BBTagEngine { return this.cluster.bbtag; }
    public get util(): ClusterUtilities { return this.cluster.util; }
    public get config(): Configuration { return this.cluster.config; }
    public get discord(): Discord<true> { return this.cluster.discord; }
    public get database(): Database { return this.cluster.database; }
    public get channel(): TChannel { return this.message.channel; }
    public get author(): User { return this.message.author; }
    public get id(): string { return this.message.id; }
    public get timestamp(): number { return this.message.createdTimestamp; }

    public constructor(
        public readonly cluster: Cluster,
        public readonly message: Message & { channel: TChannel; },
        public readonly commandText: string,
        public readonly prefix: string,
        public readonly commandName: string,
        public readonly argsString: string,
        public readonly command: ICommand
    ) {
    }

    public async send(content: CommandResult): Promise<Message | undefined>
    public async send(context: SendContext, content: CommandResult): Promise<Message | undefined>
    public async send(...args: [CommandResult] | [SendContext, CommandResult]): Promise<Message | undefined> {
        const [context, content] = args.length === 1 ? [this.message, toSendContent(args[0])] : [args[0], toSendContent(args[1])];
        if (content === undefined)
            return undefined;
        return await this.cluster.util.send(context, content);
    }

    public async reply(content: CommandResult): Promise<Message | undefined> {
        content = toSendContent(content);
        if (content === undefined)
            return undefined;
        return await this.cluster.util.send(this.message, content);
    }

    public async sendDM(content: CommandResult): Promise<Message | undefined>
    public async sendDM(context: DMContext, content: CommandResult): Promise<Message | undefined>
    public async sendDM(...args: [CommandResult] | [DMContext, CommandResult]): Promise<Message | undefined> {
        const [context, content] = args.length === 1 ? [this.author, toSendContent(args[0])] : [args[0], toSendContent(args[1])];
        if (content === undefined)
            return undefined;
        return await this.cluster.util.sendDM(context, content);
    }

    public async queryChannel(options: SlimEntityFindQueryOptions): Promise<ChoiceQueryResult<GuildChannels>>;
    public async queryChannel(this: GuildCommandContext, options: Omit<SlimEntityFindQueryOptions, 'guild'>): Promise<ChoiceQueryResult<GuildChannels>>;
    public async queryChannel<T extends KnownChannel>(options: SlimEntityPickQueryOptions<T>): Promise<ChoiceQueryResult<T>>;
    public async queryChannel(options: SlimEntityQueryOptions<KnownChannel> | Omit<SlimEntityFindQueryOptions, 'guild'>): Promise<ChoiceQueryResult<KnownChannel>> {
        if ('choices' in options)
            return await this.util.queryChannel({ ...options, context: this.message, actors: this.author });

        if ('guild' in options)
            return await this.util.queryChannel({ ...options, context: this.message, actors: this.author });

        if (guard.isGuildChannel(this.channel))
            return await this.util.queryChannel({ ...options, context: this.message, actors: this.author, guild: this.channel.guild });

        throw new Error('Cannot queryChannel without a guild!');
    }

    public async queryRole(options: SlimEntityFindQueryOptions): Promise<ChoiceQueryResult<Role>>;
    public async queryRole(this: GuildCommandContext, options: Omit<SlimEntityFindQueryOptions, 'guild'>): Promise<ChoiceQueryResult<Role>>;
    public async queryRole(options: SlimEntityPickQueryOptions<Role>): Promise<ChoiceQueryResult<Role>>;
    public async queryRole(options: SlimEntityQueryOptions<Role> | Omit<SlimEntityFindQueryOptions, 'guild'>): Promise<ChoiceQueryResult<Role>> {
        if ('choices' in options)
            return await this.util.queryRole({ ...options, context: this.message, actors: this.author });

        if ('guild' in options)
            return await this.util.queryRole({ ...options, context: this.message, actors: this.author });

        if (guard.isGuildChannel(this.channel))
            return await this.util.queryRole({ ...options, context: this.message, actors: this.author, guild: this.channel.guild });

        throw new Error('Cannot queryRole without a guild!');
    }

    public async queryMember(options: SlimEntityFindQueryOptions): Promise<ChoiceQueryResult<GuildMember>>;
    public async queryMember(this: GuildCommandContext, options: Omit<SlimEntityFindQueryOptions, 'guild'>): Promise<ChoiceQueryResult<GuildMember>>;
    public async queryMember(options: SlimEntityPickQueryOptions<GuildMember>): Promise<ChoiceQueryResult<GuildMember>>;
    public async queryMember(options: SlimEntityQueryOptions<GuildMember> | Omit<SlimEntityFindQueryOptions, 'guild'>): Promise<ChoiceQueryResult<GuildMember>> {
        if ('choices' in options)
            return await this.util.queryMember({ ...options, context: this.message, actors: this.author });

        if ('guild' in options)
            return await this.util.queryMember({ ...options, context: this.message, actors: this.author });

        if (guard.isGuildChannel(this.channel))
            return await this.util.queryMember({ ...options, context: this.message, actors: this.author, guild: this.channel.guild });

        throw new Error('Cannot queryMember without a guild!');
    }

    public async queryUser(options: SlimEntityPickQueryOptions<User>): Promise<ChoiceQueryResult<User>> {
        return await this.util.queryUser({ ...options, context: this.message, actors: this.author });
    }

    public async querySender(options: SlimEntityPickQueryOptions<User | Webhook>): Promise<ChoiceQueryResult<User | Webhook>> {
        return await this.util.querySender({ ...options, context: this.message, actors: this.author });
    }

    public async queryText<T>(options: SlimTextQueryOptionsParsed<T>): Promise<TextQueryResult<T>>
    public async queryText(options: SlimTextQueryOptions): Promise<TextQueryResult<string>>
    public async queryText<T>(options: SlimTextQueryOptionsParsed<T> | SlimTextQueryOptions): Promise<TextQueryResult<T | string>>
    public async queryText<T>(options: SlimTextQueryOptionsParsed<T> | SlimTextQueryOptions): Promise<TextQueryResult<T | string>> {
        return await this.util.queryText({ ...options, context: this.message, actors: this.author });
    }
}

function toSendContent(content: CommandResult): SendPayload | undefined {
    switch (typeof content) {
        case 'undefined':
            return undefined;
        case 'object':
            if ('data' in content)
                return { name: content.fileName, attachment: content.data };
        // fallthrough
        default:
            return content;
    }
}
