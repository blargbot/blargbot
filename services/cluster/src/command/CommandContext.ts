import type { BBTagEngine } from '@blargbot/bbtag';
import type { Cluster, ClusterUtilities } from '@blargbot/cluster';
import type { CommandResult, GuildCommandContext, ICommand } from '@blargbot/cluster/types.js';
import type { Configuration } from '@blargbot/config';
import { FormattableMessageContent } from '@blargbot/core/FormattableMessageContent.js';
import type { ChoiceQueryOptions, ChoiceQueryResult, ConfirmQuery, MultipleQueryOptions, MultipleQueryResult, SendContent, SendContext, SlimConfirmQueryOptions, SlimEntityFindQueryOptions, SlimEntityPickQueryOptions, SlimEntityQueryOptions, SlimTextQueryOptions, SlimTextQueryOptionsParsed, TextQueryResult } from '@blargbot/core/types.js';
import { guard } from '@blargbot/core/utils/index.js';
import type { Database } from '@blargbot/database';
import type { IFormattable } from '@blargbot/formatting';
import { format, util } from '@blargbot/formatting';
import type { Logger } from '@blargbot/logger';
import type * as Eris from 'eris';

export class CommandContext<TChannel extends Eris.KnownTextableChannel = Eris.KnownTextableChannel> {
    public get logger(): Logger { return this.cluster.logger; }
    public get bbtag(): BBTagEngine { return this.cluster.bbtag; }
    public get util(): ClusterUtilities { return this.cluster.util; }
    public get config(): Configuration { return this.cluster.config; }
    public get discord(): Eris.Client { return this.cluster.discord; }
    public get database(): Database { return this.cluster.database; }
    public get channel(): TChannel { return this.message.channel; }
    public get author(): Eris.User { return this.message.author; }
    public get id(): string { return this.message.id; }
    public get timestamp(): number { return this.message.timestamp; }

    public constructor(
        public readonly cluster: Cluster,
        public readonly message: Eris.Message<TChannel>,
        public readonly commandText: string,
        public readonly prefix: string,
        public readonly commandName: string,
        public readonly argsString: string,
        public readonly command: ICommand
    ) {
    }

    public async send(content: CommandResult): Promise<Eris.Message | undefined>
    public async send(context: SendContext, content: CommandResult): Promise<Eris.Message | undefined>
    public async send(...args: [CommandResult] | [SendContext, CommandResult]): Promise<Eris.Message | undefined> {
        const [context, content] = args.length === 1 ? [this.message.channel, args[0]] : [args[0], args[1]];
        if (content === undefined)
            return undefined;
        return await this.cluster.util.send(context, toSendContent(content), this.author);
    }

    public async reply(content: CommandResult): Promise<Eris.Message<Eris.Textable & Eris.Channel> | undefined> {
        if (content === undefined)
            return undefined;
        return await this.cluster.util.reply(this.message, toSendContent(content), this.author);
    }

    public async edit<C extends Eris.Textable>(message: Eris.Message<C>, content: CommandResult): Promise<Eris.Message<C> | undefined> {
        const formatter = await this.util.getFormatter(this.channel);
        if (content === undefined)
            return undefined;
        return await message.edit(toSendContent(content)[format](formatter));
    }

    public async queryConfirm(options: SlimConfirmQueryOptions<IFormattable<string>>): Promise<boolean | undefined>
    public async queryConfirm(options: SlimConfirmQueryOptions<IFormattable<string>, boolean>): Promise<boolean>
    public async queryConfirm(options: SlimConfirmQueryOptions<IFormattable<string>, boolean | undefined>): Promise<boolean | undefined>
    public async queryConfirm(options: SlimConfirmQueryOptions<IFormattable<string>, boolean | undefined>): Promise<boolean | undefined> {
        return await this.util.queryConfirm({ ...options, context: this.message.channel, actors: this.author });
    }

    public async createConfirmQuery(options: SlimConfirmQueryOptions<IFormattable<string>>): Promise<ConfirmQuery>
    public async createConfirmQuery(options: SlimConfirmQueryOptions<IFormattable<string>, boolean>): Promise<ConfirmQuery<boolean>>
    public async createConfirmQuery(options: SlimConfirmQueryOptions<IFormattable<string>, boolean | undefined>): Promise<ConfirmQuery<boolean | undefined>>
    public async createConfirmQuery(options: SlimConfirmQueryOptions<IFormattable<string>, boolean | undefined>): Promise<ConfirmQuery<boolean | undefined>> {
        return await this.util.createConfirmQuery({ ...options, context: this.message.channel, actors: this.author });
    }

    public async queryChoice<T>(options: ChoiceQueryOptions<IFormattable<string>, T>): Promise<ChoiceQueryResult<T>> {
        return await this.util.queryChoice(options);
    }

    public async queryMultiple<T>(options: MultipleQueryOptions<IFormattable<string>, T>): Promise<MultipleQueryResult<T>> {
        return await this.util.queryMultiple({ ...options, context: this.message.channel, actors: this.author });
    }

    public async queryChannel(options: SlimEntityFindQueryOptions<IFormattable<string>>): Promise<ChoiceQueryResult<Eris.KnownGuildChannel>>;
    public async queryChannel(this: GuildCommandContext, options: Omit<SlimEntityFindQueryOptions<IFormattable<string>>, 'guild'>): Promise<ChoiceQueryResult<Eris.KnownGuildChannel>>;
    public async queryChannel<T extends Eris.KnownChannel>(options: SlimEntityPickQueryOptions<IFormattable<string>, T>): Promise<ChoiceQueryResult<T>>;
    public async queryChannel(options: SlimEntityQueryOptions<IFormattable<string>, Eris.KnownChannel> | Omit<SlimEntityFindQueryOptions<IFormattable<string>>, 'guild'>): Promise<ChoiceQueryResult<Eris.KnownChannel>> {
        if ('choices' in options)
            return await this.util.queryChannel({ ...options, context: this.message.channel, actors: this.author });

        if ('guild' in options)
            return await this.util.queryChannel({ ...options, context: this.message.channel, actors: this.author });

        if (guard.isGuildChannel(this.channel))
            return await this.util.queryChannel({ ...options, context: this.message.channel, actors: this.author, guild: this.channel.guild });

        throw new Error('Cannot queryChannel without a guild!');
    }

    public async queryRole(options: SlimEntityFindQueryOptions<IFormattable<string>>): Promise<ChoiceQueryResult<Eris.Role>>;
    public async queryRole(this: GuildCommandContext, options: Omit<SlimEntityFindQueryOptions<IFormattable<string>>, 'guild'>): Promise<ChoiceQueryResult<Eris.Role>>;
    public async queryRole(options: SlimEntityPickQueryOptions<IFormattable<string>, Eris.Role>): Promise<ChoiceQueryResult<Eris.Role>>;
    public async queryRole(options: SlimEntityQueryOptions<IFormattable<string>, Eris.Role> | Omit<SlimEntityFindQueryOptions<IFormattable<string>>, 'guild'>): Promise<ChoiceQueryResult<Eris.Role>> {
        if ('choices' in options)
            return await this.util.queryRole({ ...options, context: this.message.channel, actors: this.author });

        if ('guild' in options)
            return await this.util.queryRole({ ...options, context: this.message.channel, actors: this.author });

        if (guard.isGuildChannel(this.channel))
            return await this.util.queryRole({ ...options, context: this.message.channel, actors: this.author, guild: this.channel.guild });

        throw new Error('Cannot queryRole without a guild!');
    }

    public async queryMember(options: SlimEntityFindQueryOptions<IFormattable<string>>): Promise<ChoiceQueryResult<Eris.Member>>;
    public async queryMember(this: GuildCommandContext, options: Omit<SlimEntityFindQueryOptions<IFormattable<string>>, 'guild'>): Promise<ChoiceQueryResult<Eris.Member>>;
    public async queryMember(options: SlimEntityPickQueryOptions<IFormattable<string>, Eris.Member>): Promise<ChoiceQueryResult<Eris.Member>>;
    public async queryMember(options: SlimEntityQueryOptions<IFormattable<string>, Eris.Member> | Omit<SlimEntityFindQueryOptions<IFormattable<string>>, 'guild'>): Promise<ChoiceQueryResult<Eris.Member>> {
        if ('choices' in options)
            return await this.util.queryMember({ ...options, context: this.message.channel, actors: this.author });

        if ('guild' in options)
            return await this.util.queryMember({ ...options, context: this.message.channel, actors: this.author });

        if (guard.isGuildChannel(this.channel))
            return await this.util.queryMember({ ...options, context: this.message.channel, actors: this.author, guild: this.channel.guild });

        throw new Error('Cannot queryMember without a guild!');
    }

    public async queryUser(options: SlimEntityFindQueryOptions<IFormattable<string>>): Promise<ChoiceQueryResult<Eris.User>>;
    public async queryUser(this: GuildCommandContext, options: Omit<SlimEntityFindQueryOptions<IFormattable<string>>, 'guild'>): Promise<ChoiceQueryResult<Eris.User>>;
    public async queryUser(options: SlimEntityPickQueryOptions<IFormattable<string>, Eris.User>): Promise<ChoiceQueryResult<Eris.User>>;
    public async queryUser(options: SlimEntityQueryOptions<IFormattable<string>, Eris.User> | Omit<SlimEntityFindQueryOptions<IFormattable<string>>, 'guild'>): Promise<ChoiceQueryResult<Eris.User>> {
        if ('choices' in options)
            return await this.util.queryUser({ ...options, context: this.message.channel, actors: this.author });

        if ('guild' in options)
            return await this.util.queryUser({ ...options, context: this.message.channel, actors: this.author });

        if (guard.isGuildChannel(this.channel))
            return await this.util.queryUser({ ...options, context: this.message.channel, actors: this.author, guild: this.channel.guild });

        throw new Error('Cannot queryUser without a guild!');
    }

    public async querySender(options: SlimEntityPickQueryOptions<IFormattable<string>, Eris.User | Eris.Webhook>): Promise<ChoiceQueryResult<Eris.User | Eris.Webhook>> {
        return await this.util.querySender({ ...options, context: this.message.channel, actors: this.author });
    }

    public async queryText<T>(options: SlimTextQueryOptionsParsed<IFormattable<string>, T>): Promise<TextQueryResult<T>>
    public async queryText(options: SlimTextQueryOptions<IFormattable<string>>): Promise<TextQueryResult<string>>
    public async queryText<T>(options: SlimTextQueryOptionsParsed<IFormattable<string>, T> | SlimTextQueryOptions<IFormattable<string>>): Promise<TextQueryResult<T | string>>
    public async queryText<T>(options: SlimTextQueryOptionsParsed<IFormattable<string>, T> | SlimTextQueryOptions<IFormattable<string>>): Promise<TextQueryResult<T | string>> {
        return await this.util.queryText({ ...options, context: this.message.channel, actors: this.author });
    }
}

function toSendContent(content: Exclude<CommandResult, undefined>): IFormattable<SendContent<string>>;
function toSendContent(content: CommandResult): IFormattable<SendContent<string>> | undefined;
function toSendContent(content: CommandResult): IFormattable<SendContent<string>> | undefined {
    if (content === undefined)
        return undefined;
    if (util.isFormattable(content)) {
        return {
            [format](formatter) {
                const result = content[format](formatter);
                return typeof result === 'string'
                    ? { content: result }
                    : result;
            }
        };
    }
    return new FormattableMessageContent(content);
}
