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
import type * as eris from 'eris';

export class CommandContext<TChannel extends eris.KnownTextableChannel = eris.KnownTextableChannel> {
    public get logger(): Logger { return this.cluster.logger; }
    public get bbtag(): BBTagEngine { return this.cluster.bbtag; }
    public get util(): ClusterUtilities { return this.cluster.util; }
    public get config(): Configuration { return this.cluster.config; }
    public get discord(): eris.Client { return this.cluster.discord; }
    public get database(): Database { return this.cluster.database; }
    public get channel(): TChannel { return this.message.channel; }
    public get author(): eris.User { return this.message.author; }
    public get id(): string { return this.message.id; }
    public get timestamp(): number { return this.message.timestamp; }

    public constructor(
        public readonly cluster: Cluster,
        public readonly message: eris.Message<TChannel>,
        public readonly commandText: string,
        public readonly prefix: string,
        public readonly commandName: string,
        public readonly argsString: string,
        public readonly command: ICommand
    ) {
    }

    public async send(content: CommandResult): Promise<eris.Message | undefined>
    public async send(context: SendContext, content: CommandResult): Promise<eris.Message | undefined>
    public async send(...args: [CommandResult] | [SendContext, CommandResult]): Promise<eris.Message | undefined> {
        const [context, content] = args.length === 1 ? [this.message.channel, args[0]] : [args[0], args[1]];
        if (content === undefined)
            return undefined;
        return await this.cluster.util.send(context, toSendContent(content), this.author);
    }

    public async reply(content: CommandResult): Promise<eris.Message | undefined> {
        if (content === undefined)
            return undefined;
        return await this.cluster.util.reply(this.message, toSendContent(content), this.author);
    }

    public async edit(message: eris.Message, content: CommandResult): Promise<eris.Message | undefined> {
        const formatter = await this.util.getFormatter(this.channel);
        if (content === undefined)
            return undefined;
        return await message.edit(toSendContent(content)[format](formatter));
    }

    public async queryConfirm(options: SlimConfirmQueryOptions<IFormattable<string>>): Promise<boolean | undefined>
    public async queryConfirm(options: SlimConfirmQueryOptions<IFormattable<string>, boolean>): Promise<boolean>
    public async queryConfirm(options: SlimConfirmQueryOptions<IFormattable<string>, boolean | undefined>): Promise<boolean | undefined>
    public async queryConfirm(options: SlimConfirmQueryOptions<IFormattable<string>, boolean | undefined>): Promise<boolean | undefined> {
        return await this.util.queryConfirm({ ...options, context: this.message, actors: this.author });
    }

    public async createConfirmQuery(options: SlimConfirmQueryOptions<IFormattable<string>>): Promise<ConfirmQuery>
    public async createConfirmQuery(options: SlimConfirmQueryOptions<IFormattable<string>, boolean>): Promise<ConfirmQuery<boolean>>
    public async createConfirmQuery(options: SlimConfirmQueryOptions<IFormattable<string>, boolean | undefined>): Promise<ConfirmQuery<boolean | undefined>>
    public async createConfirmQuery(options: SlimConfirmQueryOptions<IFormattable<string>, boolean | undefined>): Promise<ConfirmQuery<boolean | undefined>> {
        return await this.util.createConfirmQuery({ ...options, context: this.message, actors: this.author });
    }

    public async queryChoice<T>(options: ChoiceQueryOptions<IFormattable<string>, T>): Promise<ChoiceQueryResult<T>> {
        return await this.util.queryChoice(options);
    }

    public async queryMultiple<T>(options: MultipleQueryOptions<IFormattable<string>, T>): Promise<MultipleQueryResult<T>> {
        return await this.util.queryMultiple({ ...options, context: this.message, actors: this.author });
    }

    public async queryChannel(options: SlimEntityFindQueryOptions<IFormattable<string>>): Promise<ChoiceQueryResult<eris.KnownGuildChannel>>;
    public async queryChannel(this: GuildCommandContext, options: Omit<SlimEntityFindQueryOptions<IFormattable<string>>, 'guild'>): Promise<ChoiceQueryResult<eris.KnownGuildChannel>>;
    public async queryChannel<T extends eris.KnownChannel>(options: SlimEntityPickQueryOptions<IFormattable<string>, T>): Promise<ChoiceQueryResult<T>>;
    public async queryChannel(options: SlimEntityQueryOptions<IFormattable<string>, eris.KnownChannel> | Omit<SlimEntityFindQueryOptions<IFormattable<string>>, 'guild'>): Promise<ChoiceQueryResult<eris.KnownChannel>> {
        if ('choices' in options)
            return await this.util.queryChannel({ ...options, context: this.message, actors: this.author });

        if ('guild' in options)
            return await this.util.queryChannel({ ...options, context: this.message, actors: this.author });

        if (guard.isGuildChannel(this.channel))
            return await this.util.queryChannel({ ...options, context: this.message, actors: this.author, guild: this.channel.guild });

        throw new Error('Cannot queryChannel without a guild!');
    }

    public async queryRole(options: SlimEntityFindQueryOptions<IFormattable<string>>): Promise<ChoiceQueryResult<eris.Role>>;
    public async queryRole(this: GuildCommandContext, options: Omit<SlimEntityFindQueryOptions<IFormattable<string>>, 'guild'>): Promise<ChoiceQueryResult<eris.Role>>;
    public async queryRole(options: SlimEntityPickQueryOptions<IFormattable<string>, eris.Role>): Promise<ChoiceQueryResult<eris.Role>>;
    public async queryRole(options: SlimEntityQueryOptions<IFormattable<string>, eris.Role> | Omit<SlimEntityFindQueryOptions<IFormattable<string>>, 'guild'>): Promise<ChoiceQueryResult<eris.Role>> {
        if ('choices' in options)
            return await this.util.queryRole({ ...options, context: this.message, actors: this.author });

        if ('guild' in options)
            return await this.util.queryRole({ ...options, context: this.message, actors: this.author });

        if (guard.isGuildChannel(this.channel))
            return await this.util.queryRole({ ...options, context: this.message, actors: this.author, guild: this.channel.guild });

        throw new Error('Cannot queryRole without a guild!');
    }

    public async queryMember(options: SlimEntityFindQueryOptions<IFormattable<string>>): Promise<ChoiceQueryResult<eris.Member>>;
    public async queryMember(this: GuildCommandContext, options: Omit<SlimEntityFindQueryOptions<IFormattable<string>>, 'guild'>): Promise<ChoiceQueryResult<eris.Member>>;
    public async queryMember(options: SlimEntityPickQueryOptions<IFormattable<string>, eris.Member>): Promise<ChoiceQueryResult<eris.Member>>;
    public async queryMember(options: SlimEntityQueryOptions<IFormattable<string>, eris.Member> | Omit<SlimEntityFindQueryOptions<IFormattable<string>>, 'guild'>): Promise<ChoiceQueryResult<eris.Member>> {
        if ('choices' in options)
            return await this.util.queryMember({ ...options, context: this.message, actors: this.author });

        if ('guild' in options)
            return await this.util.queryMember({ ...options, context: this.message, actors: this.author });

        if (guard.isGuildChannel(this.channel))
            return await this.util.queryMember({ ...options, context: this.message, actors: this.author, guild: this.channel.guild });

        throw new Error('Cannot queryMember without a guild!');
    }

    public async queryUser(options: SlimEntityFindQueryOptions<IFormattable<string>>): Promise<ChoiceQueryResult<eris.User>>;
    public async queryUser(this: GuildCommandContext, options: Omit<SlimEntityFindQueryOptions<IFormattable<string>>, 'guild'>): Promise<ChoiceQueryResult<eris.User>>;
    public async queryUser(options: SlimEntityPickQueryOptions<IFormattable<string>, eris.User>): Promise<ChoiceQueryResult<eris.User>>;
    public async queryUser(options: SlimEntityQueryOptions<IFormattable<string>, eris.User> | Omit<SlimEntityFindQueryOptions<IFormattable<string>>, 'guild'>): Promise<ChoiceQueryResult<eris.User>> {
        if ('choices' in options)
            return await this.util.queryUser({ ...options, context: this.message, actors: this.author });

        if ('guild' in options)
            return await this.util.queryUser({ ...options, context: this.message, actors: this.author });

        if (guard.isGuildChannel(this.channel))
            return await this.util.queryUser({ ...options, context: this.message, actors: this.author, guild: this.channel.guild });

        throw new Error('Cannot queryUser without a guild!');
    }

    public async querySender(options: SlimEntityPickQueryOptions<IFormattable<string>, eris.User | eris.Webhook>): Promise<ChoiceQueryResult<eris.User | eris.Webhook>> {
        return await this.util.querySender({ ...options, context: this.message, actors: this.author });
    }

    public async queryText<T>(options: SlimTextQueryOptionsParsed<IFormattable<string>, T>): Promise<TextQueryResult<T>>
    public async queryText(options: SlimTextQueryOptions<IFormattable<string>>): Promise<TextQueryResult<string>>
    public async queryText<T>(options: SlimTextQueryOptionsParsed<IFormattable<string>, T> | SlimTextQueryOptions<IFormattable<string>>): Promise<TextQueryResult<T | string>>
    public async queryText<T>(options: SlimTextQueryOptionsParsed<IFormattable<string>, T> | SlimTextQueryOptions<IFormattable<string>>): Promise<TextQueryResult<T | string>> {
        return await this.util.queryText({ ...options, context: this.message, actors: this.author });
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
