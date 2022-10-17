import { BBTagEngine } from '@blargbot/bbtag';
import { Cluster, ClusterUtilities } from '@blargbot/cluster';
import { CommandResult, GuildCommandContext, ICommand } from '@blargbot/cluster/types';
import { Configuration } from '@blargbot/config';
import { FormattableMessageContent } from '@blargbot/core/FormattableMessageContent';
import { ChoiceQueryOptions, ChoiceQueryResult, ConfirmQuery, MultipleQueryOptions, MultipleQueryResult, SendContent, SendContext, SlimConfirmQueryOptions, SlimEntityFindQueryOptions, SlimEntityPickQueryOptions, SlimEntityQueryOptions, SlimTextQueryOptions, SlimTextQueryOptionsParsed, TextQueryResult } from '@blargbot/core/types';
import { guard } from '@blargbot/core/utils';
import { Database } from '@blargbot/database';
import { IFormattable, IFormatter } from '@blargbot/domain/messages/types';
import { Logger } from '@blargbot/logger';
import { Client as Discord, KnownChannel, KnownGuildChannel, KnownTextableChannel, Member, Message, Role, User, Webhook } from 'eris';

export class CommandContext<TChannel extends KnownTextableChannel = KnownTextableChannel> {
    public get logger(): Logger { return this.cluster.logger; }
    public get bbtag(): BBTagEngine { return this.cluster.bbtag; }
    public get util(): ClusterUtilities { return this.cluster.util; }
    public get config(): Configuration { return this.cluster.config; }
    public get discord(): Discord { return this.cluster.discord; }
    public get database(): Database { return this.cluster.database; }
    public get channel(): TChannel { return this.message.channel; }
    public get author(): User { return this.message.author; }
    public get id(): string { return this.message.id; }
    public get timestamp(): number { return this.message.timestamp; }

    public constructor(
        public readonly cluster: Cluster,
        public readonly message: Message<TChannel>,
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
        const [context, content] = args.length === 1 ? [this.message.channel, args[0]] : [args[0], args[1]];
        if (content === undefined)
            return undefined;
        return await this.cluster.util.send(context, content, this.author);
    }

    public async reply(content: CommandResult): Promise<Message | undefined> {
        if (content === undefined)
            return undefined;
        return await this.cluster.util.reply(this.message, content, this.author);
    }

    public async edit(message: Message, content: CommandResult): Promise<Message | undefined> {
        const formatter = await this.util.getContentResolver(this.channel);
        const payload = toSendContent(content, formatter);
        if (payload === undefined)
            return undefined;
        return await message.edit(payload);
    }

    public async queryConfirm(options: SlimConfirmQueryOptions<IFormattable<string>>): Promise<boolean | undefined>
    public async queryConfirm(options: SlimConfirmQueryOptions<IFormattable<string>, boolean>): Promise<boolean>
    public async queryConfirm(options: SlimConfirmQueryOptions<IFormattable<string>, boolean | undefined>): Promise<boolean | undefined>
    public async queryConfirm(options: SlimConfirmQueryOptions<IFormattable<string>, boolean | undefined>): Promise<boolean | undefined> {
        if (`choices` in options)
            return await this.util.queryConfirm({ ...options, context: this.message, actors: this.author });

        if (`guild` in options)
            return await this.util.queryConfirm({ ...options, context: this.message, actors: this.author });

        if (guard.isGuildChannel(this.channel))
            return await this.util.queryConfirm({ ...options, context: this.message, actors: this.author, guild: this.channel.guild });

        throw new Error(`Cannot queryChannel without a guild!`);
    }

    public async createConfirmQuery(options: SlimConfirmQueryOptions<IFormattable<string>>): Promise<ConfirmQuery>
    public async createConfirmQuery(options: SlimConfirmQueryOptions<IFormattable<string>, boolean>): Promise<ConfirmQuery<boolean>>
    public async createConfirmQuery(options: SlimConfirmQueryOptions<IFormattable<string>, boolean | undefined>): Promise<ConfirmQuery<boolean | undefined>>
    public async createConfirmQuery(options: SlimConfirmQueryOptions<IFormattable<string>, boolean | undefined>): Promise<ConfirmQuery<boolean | undefined>> {
        if (`choices` in options)
            return await this.util.queryConfirm({ ...options, context: this.message, actors: this.author });

        if (`guild` in options)
            return await this.util.queryConfirm({ ...options, context: this.message, actors: this.author });

        if (guard.isGuildChannel(this.channel))
            return await this.util.queryConfirm({ ...options, context: this.message, actors: this.author, guild: this.channel.guild });

        throw new Error(`Cannot queryChannel without a guild!`);
    }

    public async queryChoice<T>(options: ChoiceQueryOptions<IFormattable<string>, T>): Promise<ChoiceQueryResult<T>> {
        return await this.util.queryChoice(options);
    }

    public async queryMultiple<T>(options: MultipleQueryOptions<IFormattable<T>, T>): Promise<MultipleQueryResult<T>> {
        return await this.util.queryMultiple(options);
    }

    public async queryChannel(options: SlimEntityFindQueryOptions<IFormattable<string>>): Promise<ChoiceQueryResult<KnownGuildChannel>>;
    public async queryChannel(this: GuildCommandContext, options: Omit<SlimEntityFindQueryOptions<IFormattable<string>>, `guild`>): Promise<ChoiceQueryResult<KnownGuildChannel>>;
    public async queryChannel<T extends KnownChannel>(options: SlimEntityPickQueryOptions<IFormattable<string>, T>): Promise<ChoiceQueryResult<T>>;
    public async queryChannel(options: SlimEntityQueryOptions<IFormattable<string>, KnownChannel> | Omit<SlimEntityFindQueryOptions<IFormattable<string>>, `guild`>): Promise<ChoiceQueryResult<KnownChannel>> {
        if (`choices` in options)
            return await this.util.queryChannel({ ...options, context: this.message, actors: this.author });

        if (`guild` in options)
            return await this.util.queryChannel({ ...options, context: this.message, actors: this.author });

        if (guard.isGuildChannel(this.channel))
            return await this.util.queryChannel({ ...options, context: this.message, actors: this.author, guild: this.channel.guild });

        throw new Error(`Cannot queryChannel without a guild!`);
    }

    public async queryRole(options: SlimEntityFindQueryOptions<IFormattable<string>>): Promise<ChoiceQueryResult<Role>>;
    public async queryRole(this: GuildCommandContext, options: Omit<SlimEntityFindQueryOptions<IFormattable<string>>, `guild`>): Promise<ChoiceQueryResult<Role>>;
    public async queryRole(options: SlimEntityPickQueryOptions<IFormattable<string>, Role>): Promise<ChoiceQueryResult<Role>>;
    public async queryRole(options: SlimEntityQueryOptions<IFormattable<string>, Role> | Omit<SlimEntityFindQueryOptions<IFormattable<string>>, `guild`>): Promise<ChoiceQueryResult<Role>> {
        if (`choices` in options)
            return await this.util.queryRole({ ...options, context: this.message, actors: this.author });

        if (`guild` in options)
            return await this.util.queryRole({ ...options, context: this.message, actors: this.author });

        if (guard.isGuildChannel(this.channel))
            return await this.util.queryRole({ ...options, context: this.message, actors: this.author, guild: this.channel.guild });

        throw new Error(`Cannot queryRole without a guild!`);
    }

    public async queryMember(options: SlimEntityFindQueryOptions<IFormattable<string>>): Promise<ChoiceQueryResult<Member>>;
    public async queryMember(this: GuildCommandContext, options: Omit<SlimEntityFindQueryOptions<IFormattable<string>>, `guild`>): Promise<ChoiceQueryResult<Member>>;
    public async queryMember(options: SlimEntityPickQueryOptions<IFormattable<string>, Member>): Promise<ChoiceQueryResult<Member>>;
    public async queryMember(options: SlimEntityQueryOptions<IFormattable<string>, Member> | Omit<SlimEntityFindQueryOptions<IFormattable<string>>, `guild`>): Promise<ChoiceQueryResult<Member>> {
        if (`choices` in options)
            return await this.util.queryMember({ ...options, context: this.message, actors: this.author });

        if (`guild` in options)
            return await this.util.queryMember({ ...options, context: this.message, actors: this.author });

        if (guard.isGuildChannel(this.channel))
            return await this.util.queryMember({ ...options, context: this.message, actors: this.author, guild: this.channel.guild });

        throw new Error(`Cannot queryMember without a guild!`);
    }

    public async queryUser(options: SlimEntityFindQueryOptions<IFormattable<string>>): Promise<ChoiceQueryResult<User>>;
    public async queryUser(this: GuildCommandContext, options: Omit<SlimEntityFindQueryOptions<IFormattable<string>>, `guild`>): Promise<ChoiceQueryResult<User>>;
    public async queryUser(options: SlimEntityPickQueryOptions<IFormattable<string>, User>): Promise<ChoiceQueryResult<User>>;
    public async queryUser(options: SlimEntityQueryOptions<IFormattable<string>, User> | Omit<SlimEntityFindQueryOptions<IFormattable<string>>, `guild`>): Promise<ChoiceQueryResult<User>> {
        if (`choices` in options)
            return await this.util.queryUser({ ...options, context: this.message, actors: this.author });

        if (`guild` in options)
            return await this.util.queryUser({ ...options, context: this.message, actors: this.author });

        if (guard.isGuildChannel(this.channel))
            return await this.util.queryUser({ ...options, context: this.message, actors: this.author, guild: this.channel.guild });

        throw new Error(`Cannot queryUser without a guild!`);
    }

    public async querySender(options: SlimEntityPickQueryOptions<IFormattable<string>, User | Webhook>): Promise<ChoiceQueryResult<User | Webhook>> {
        return await this.util.querySender({ ...options, context: this.message, actors: this.author });
    }

    public async queryText<T>(options: SlimTextQueryOptionsParsed<IFormattable<string>, T>): Promise<TextQueryResult<T>>
    public async queryText(options: SlimTextQueryOptions<IFormattable<string>>): Promise<TextQueryResult<string>>
    public async queryText<T>(options: SlimTextQueryOptionsParsed<IFormattable<string>, T> | SlimTextQueryOptions<IFormattable<string>>): Promise<TextQueryResult<T | string>>
    public async queryText<T>(options: SlimTextQueryOptionsParsed<IFormattable<string>, T> | SlimTextQueryOptions<IFormattable<string>>): Promise<TextQueryResult<T | string>> {
        return await this.util.queryText({ ...options, context: this.message, actors: this.author });
    }
}

function toSendContent(content: CommandResult, formatter: IFormatter): SendContent<string> | undefined {
    switch (typeof content) {
        case `undefined`:
            return undefined;
        case `object`: {
            if (!(`format` in content))
                return new FormattableMessageContent(content).format(formatter);
            const formatted = content.format(formatter);
            if (typeof formatted === `string`)
                return { content: formatted };
            return formatted;
        }
    }
}
