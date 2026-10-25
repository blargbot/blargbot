import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import { ClientRequest, IncomingMessage } from 'node:http';
import * as inspector from 'node:inspector';
import path from 'node:path';
import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import type { BaseRuntimeLimit, BBTagExpression, BBTagRuntimeInput, BBTagUtilities, InjectionContext, LocatedRuntimeError, SourceMarker, SubtagCall } from '@blargbot/bbtag';
import { bbtag, BBTagContext, BBTagEngine, BBTagRuntimeError, NotEnoughArgumentsError, Subtag, SubtagType, TooManyArgumentsError } from '@blargbot/bbtag';
import { pluralise as p, repeat, snowflake } from '@blargbot/core';
import type { GuildStore, TagStore, TagVariableStore, UserStore } from '@blargbot/domain';
import type { Logger } from '@blargbot/logger';
import type { Mockable, MockCtorArgs } from '@blargbot/test-util';
import { Mock } from '@blargbot/test-util';
import type { APIChannel, APIGuild, APIGuildMember, APIMessage, APIRole, APITextChannel, APIUser, Snowflake } from 'discord-api-types/v9';
import { ChannelType, GuildDefaultMessageNotifications, GuildExplicitContentFilter, GuildMFALevel, GuildNSFWLevel, GuildPremiumTier, GuildVerificationLevel } from 'discord-api-types/v9';
import * as eris from 'eris';
import moment from 'moment-timezone';

type IdPropertiesOf<T> = { [P in keyof T]-?: [P, T[P]] extends [`${string}_id` | 'id', string] ? P : never }[keyof T];
type RequireIds<T, OtherProps extends keyof T = never> = RequiredProps<Partial<T>, IdPropertiesOf<T> | OtherProps>;
type AnyConstructor<T> = (abstract new (...args: never) => T) & {
    readonly prototype: T;
}

export interface SubtagTestCase {
    readonly title?: string;
    readonly code: string;
    readonly subtagName?: string;
    readonly expected?: string | RegExp | (() => string | RegExp);
    readonly setup?: (context: SubtagTestContext, bbtag: BBTagExpression, nodeTest: TestContext) => Awaitable<void>;
    readonly postSetup?: (context: BBTagContext, mocks: SubtagTestContext) => Awaitable<void>;
    readonly assert?: (context: BBTagContext, result: string, test: SubtagTestContext) => Awaitable<void>;
    readonly teardown?: (context: SubtagTestContext) => Awaitable<void>;
    readonly expectError?: {
        required?: boolean;
        handle: (error: unknown) => Awaitable<void>;
    };
    readonly errors?: ReadonlyArray<{ start?: number | SourceMarker; end?: number | SourceMarker; error: BBTagRuntimeError; }> | ((errors: LocatedRuntimeError[]) => void);
    readonly subtags?: readonly Subtag[];
    readonly skip?: boolean | (() => Awaitable<boolean>);
    readonly retries?: number;
    readonly timeout?: number;
}

interface TestSuiteConfig {
    readonly setup: Array<(context: SubtagTestContext, bbtag: BBTagExpression, nodeTest: TestContext) => Awaitable<void>>;
    readonly assert: Array<(context: BBTagContext, result: string, test: SubtagTestContext) => Awaitable<void>>;
    readonly teardown: Array<(context: SubtagTestContext) => Awaitable<void>>;
    readonly postSetup: Array<(context: BBTagContext, mocks: SubtagTestContext) => Awaitable<void>>;
}

export class MarkerError extends BBTagRuntimeError {
    public constructor(type: string, index: number) {
        super(`{${type}} called at ${index}`);
        this.display = '';
    }
}

export interface SubtagTestSuiteData<T extends Subtag = Subtag> extends Pick<SubtagTestCase, 'setup' | 'postSetup' | 'assert' | 'teardown'> {
    readonly names: Iterable<string>;
    readonly cases: SubtagTestCase[];
    readonly subtag: T;
    readonly otherSubtags?: Subtag[];
    readonly runOtherTests?: (subtag: T) => Promise<void>;
    readonly argCountBounds: { min: ArgCountBound; max: ArgCountBound; };
}

function makeId(name: string): string {
    return `${name}<${snowflake.create()}>`;
}

type ArgCountBound = number | { count: number; noEval: number[]; };
/* eslint-disable @typescript-eslint/naming-convention */
export class SubtagTestContext {
    readonly #allMocks: Mock[] = [];
    #isCreated = false;
    public readonly dependencies = this.createMock<InjectionContext>({ id: 'dependencies' });
    public readonly util = this.createMock<BBTagUtilities>({ id: 'util' });
    public readonly shard = this.createMock<eris.Shard>({ id: 'shard' });
    public readonly shards = this.createMock<eris.ShardManager>({ id: 'shards' });
    public readonly discord = this.createMock<eris.Client>({ id: 'discord' });
    readonly #logger = this.createMock<Logger>({ id: 'logger' });
    public readonly tagVariablesTable = this.createMock<TagVariableStore>({ id: 'tagVariablesTable' });
    public readonly tagsTable = this.createMock<TagStore>({ id: 'tagsTable' });
    public readonly guildTable = this.createMock<GuildStore>({ id: 'guildTable' });
    public readonly userTable = this.createMock<UserStore>({ id: 'userTable' });
    public readonly limit = this.createMock<BaseRuntimeLimit>({ id: 'limit' });
    public readonly discordOptions: eris.ClientOptions;
    public readonly ownedMessages: string[] = [];

    public readonly input: Mutable<Omit<BBTagRuntimeInput, 'message'>>;

    public readonly roles = {
        everyone: SubtagTestContext.createApiRole({ id: makeId('everyoneRole') }),
        top: SubtagTestContext.createApiRole({ id: makeId('topRole'), position: 5, name: 'Top Role' }),
        command: SubtagTestContext.createApiRole({ id: makeId('commandRole'), position: 3, name: 'Command User' }),
        authorizer: SubtagTestContext.createApiRole({ id: makeId('authorizerRole'), position: 4, name: 'Command Authorizer' }),
        other: SubtagTestContext.createApiRole({ id: makeId('otherRole'), position: 2, name: 'Other User' }),
        bot: SubtagTestContext.createApiRole({ id: makeId('botRole'), position: 1, name: 'Bot' })
    };

    public readonly users = {
        owner: SubtagTestContext.createApiUser({ id: makeId('ownerUser'), username: 'Guild owner' }),
        command: SubtagTestContext.createApiUser({ id: makeId('commandUser'), username: 'Command User' }),
        authorizer: SubtagTestContext.createApiUser({ id: makeId('authorizerUser'), username: 'Command Authorizer' }),
        other: SubtagTestContext.createApiUser({ id: makeId('otherUser'), username: 'Other user' }),
        bot: SubtagTestContext.createApiUser({
            id: '134133271750639616',
            username: 'blargbot',
            discriminator: '0128'
        })
    };

    public readonly members = {
        owner: SubtagTestContext.createApiGuildMember({ roles: [] }, this.users.owner),
        command: SubtagTestContext.createApiGuildMember({ roles: [this.roles.command.id] }, this.users.command),
        authorizer: SubtagTestContext.createApiGuildMember({ roles: [this.roles.authorizer.id] }, this.users.authorizer),
        other: SubtagTestContext.createApiGuildMember({ roles: [this.roles.other.id] }, this.users.other),
        bot: SubtagTestContext.createApiGuildMember({ roles: [this.roles.bot.id] }, this.users.bot)
    };

    public readonly channels = {
        command: SubtagTestContext.createApiChannel({ id: makeId('commandChannel'), name: 'commands' }),
        general: SubtagTestContext.createApiChannel({ id: makeId('generalChannel'), name: 'general' })
    } as {
        command: Extract<APIChannel, { guild_id?: Snowflake; }>;
        general: Extract<APIChannel, { guild_id?: Snowflake; }>;
        [name: string]: Extract<APIChannel, { guild_id?: Snowflake; }>;
    };

    public readonly guild = SubtagTestContext.createApiGuild(
        {
            id: this.roles.everyone.id,
            owner_id: this.users.owner.id,
            roles: Object.values(this.roles)
        }
    );

    public readonly message: APIMessage = SubtagTestContext.createApiMessage({
        id: makeId('commandMessage'),
        author: this.users.command,
        channel_id: this.channels.command.id
    }, this.users.command);

    public constructor(public readonly testCase: SubtagTestCase, subtags: Iterable<Subtag>) {
        this.discordOptions = { intents: [] };
        this.input = {
            tagName: makeId('tagName'),
            silent: false,
            isCC: false,
            flagDefinitions: [],
            limit: this.limit.instance,
            authorizer: '',
            author: undefined,
            cooldown: 0,
            input: '',
            prefix: undefined,
            tagVars: true
        };

        this.dependencies.setup(m => m.discord).returns(this.discord.instance, { isFallback: true });
        this.dependencies.setup(m => m.logger).returns(this.#logger.instance, { isFallback: true });
        this.dependencies.setup(m => m.util).returns(this.util.instance, { isFallback: true });
        this.dependencies.setup(c => c.subtags).returns(subtags, { isFallback: true });
        this.dependencies.setup(m => m.sleep).returns(() => {
            throw new Error('Sleep called, this typically means a runaway subtag.');
        }, { isFallback: true });

        for (const level of ['error', 'warn'] as const) {
            this.#logger.setup(m => m[level]).returns((...args) => {
                throw args.find(x => x instanceof Error) ?? new Error(args.join());
            }, { isFallback: true });
        }
        this.#logger.setup((m, $) => m.bbtag('Committing', $.number, 'objects to the', $.string, 'pool.'))
            .returns(undefined, { isFallback: true });
        this.#logger.setup((m, $) => m.bbtag('Commited', $.number, 'objects to the', $.string, 'pool in', $.number, 'ms.'))
            .returns(undefined, { isFallback: true });

        this.discord.setup((m, $) => m.emit('warn', $.anything)).returns(false, { isFallback: true });

        this.discord.setup(m => m.shards).returns(this.shards.instance, { isFallback: true });
        this.discord.setup(m => m.guildShardMap).returns({}, { isFallback: true });
        this.discord.setup(m => m.channelGuildMap).returns({}, { isFallback: true });
        this.discord.setup(m => m.options).returns(this.discordOptions, { isFallback: true });
        this.discord.setup((m, $) => m._formatImage($.anything)).invokes(i => eris.Client.prototype._formatImage.call(this.discord.instance, i.arguments[0] as never), { isFallback: true });
        this.discord.setup((m, $) => m._formatAllowedMentions($.anything)).invokes(i => eris.Client.prototype._formatImage.call(this.discord.instance, i.arguments[0] as never), { isFallback: true });

        this.shards.setup(m => m.get(0)).returns(this.shard.instance, { isFallback: true });
        this.shard.setup(m => m.client).returns(this.discord.instance, { isFallback: true });

        this.discord.setup(m => m.guilds).returns(new eris.Collection(eris.Guild), { isFallback: true });
        this.discord.setup(m => m.users).returns(new eris.Collection(eris.User), { isFallback: true });

    }

    public adoptMock(mock: Mock): void {
        this.#allMocks.push(mock);
        mock.reset();
    }

    public adoptSubtagMock<T extends Subtag>(mock: Mock<T>, options: { name?: string; aliases?: string[]; type: AnyConstructor<T>; }): void {
        this.adoptMock(mock);
        mock.setup(m => m.name).returns(options.name ?? `test-subtag-${snowflake.create()}`);
        mock.setup(m => m.aliases).returns(options.aliases ?? []);
        mock.setup(Reflect.getPrototypeOf).returns(options.type.prototype);
        mock.setup(m => m.constructor).returns(options.type);
    }

    public createMock<T extends Mockable>(...args: MockCtorArgs<T>): Mock<T> {
        const mock = new Mock<T>(...args);
        this.#allMocks.push(mock);
        return mock;
    }

    public verifyAll(): void {
        const errors = [];
        for (const mock of this.#allMocks) {
            try {
                mock.verifyAll();
            } catch (err: unknown) {
                errors.push(err);
            }
        }
        switch (errors.length) {
            case 0: break;
            case 1: throw errors[0];
            default: throw new AggregateError(errors, errors.join('\n'));
        }
    }

    public createContext(): BBTagContext {
        if (this.#isCreated)
            throw new Error('Cannot create multiple contexts from 1 mock');
        this.#isCreated = true;

        const engine = new BBTagEngine(this.dependencies.instance);

        const bot = new eris.ExtendedUser(<eris.BaseData><unknown>this.users.bot, this.discord.instance);
        this.discord.setup(m => m.user).returns(bot, { isFallback: true });

        const guild = this.createGuild(this.guild, Object.values(this.channels), Object.values(this.members));
        this.discord.instance.guilds.add(guild);

        for (const channel of guild.channels.values())
            this.discord.setup(m => m.getChannel(channel.id)).returns(channel, { isFallback: true });

        const textableChannelTypes = new Set([ChannelType.GuildText, ChannelType.DM, ChannelType.GroupDM, ChannelType.GuildAnnouncement, ChannelType.AnnouncementThread, ChannelType.PrivateThread, ChannelType.PublicThread]);
        const channel = guild.channels.find(c => textableChannelTypes.has(c.type));
        if (channel === undefined)
            throw new Error('No text channels were added');

        const message = this.createMessage<eris.KnownGuildTextableChannel>(this.message);
        this.util.setup(m => m.getMessage(channel.id, message.id)).resolves(message, { isFallback: true });

        const context = engine.createContext({
            ...this.input,
            authorizer: this.input.authorizer === '' ? this.input.author ?? this.users.authorizer.id : this.input.authorizer,
            author: this.input.author ?? message.author.id,
            message
        });
        context.toString = () => '<TestBBTagContext>';

        this.ownedMessages.forEach(v => context.root.ownedMessageIds.add(v));

        return context;
    }

    public createRESTError(code: number, message = 'Test REST error'): eris.DiscordRESTError {
        const request = this.createMock<ClientRequest>({ id: 'request' });
        const apiMessage = this.createMock<IncomingMessage>({ id: 'apiMessage' });

        apiMessage.setup(Reflect.getPrototypeOf).returns(IncomingMessage.prototype);
        request.setup(Reflect.getPrototypeOf).returns(ClientRequest.prototype);

        const x = { stack: '' };
        Error.captureStackTrace(x);
        return new eris.DiscordRESTError(request.instance, apiMessage.instance, { code, message }, x.stack);
    }

    public createHTTPError(code: number, message: string, method: string, path: string): eris.DiscordHTTPError {
        const request = this.createMock<ClientRequest>({ id: 'request' });
        const apiMessage = this.createMock<IncomingMessage>({ id: 'apiMessage' });

        apiMessage.setup(Reflect.getPrototypeOf).returns(IncomingMessage.prototype);
        request.setup(Reflect.getPrototypeOf).returns(ClientRequest.prototype);

        apiMessage.setup(m => m.statusCode).returns(code);
        apiMessage.setup(m => m.statusMessage).returns(message);
        request.setup(m => m.method).returns(method);
        request.setup(m => m.path).returns(path);

        const x = { stack: '' };
        Error.captureStackTrace(x);
        return new eris.DiscordHTTPError(request.instance, apiMessage.instance, { code, message }, x.stack);
    }

    public createMessage<TChannel extends eris.KnownTextableChannel>(settings: APIMessage): eris.Message<TChannel>
    public createMessage<TChannel extends eris.KnownTextableChannel>(settings: RequireIds<APIMessage>, author: APIUser): eris.Message<TChannel>
    public createMessage<TChannel extends eris.KnownTextableChannel>(...args: [APIMessage] | [RequireIds<APIMessage>, APIUser]): eris.Message<TChannel> {
        const data = args.length === 1 ? args[0] : SubtagTestContext.createApiMessage(...args);
        return new eris.Message<TChannel>(<eris.BaseData><unknown>data, this.discord.instance);
    }

    public static createApiMessage(settings: RequireIds<APIMessage>, author: APIUser): APIMessage {
        return {
            author: author,
            attachments: [],
            content: '',
            edited_timestamp: '1970-01-01T00:00:00Z',
            embeds: [],
            mention_everyone: false,
            mention_roles: [],
            mentions: [],
            pinned: false,
            timestamp: '1970-01-01T00:00:00Z',
            tts: false,
            type: eris.Constants.MessageTypes.DEFAULT,
            ...settings
        };
    }

    public createUser(settings: RequireIds<APIUser>): eris.User {
        const data = SubtagTestContext.createApiUser(settings);
        return new eris.User(<eris.BaseData><unknown>data, this.discord.instance);
    }

    public static createApiUser(settings: RequireIds<APIUser>): APIUser {
        return {
            avatar: null,
            discriminator: '0000',
            username: 'Test User',
            ...settings
        };
    }

    public createGuildMember(guild: eris.Guild | undefined, settings: RequireIds<APIGuildMember>, user: APIUser): eris.Member {
        const data = SubtagTestContext.createApiGuildMember(settings, user);
        return new eris.Member(<eris.BaseData><unknown>data, guild, this.discord.instance);
    }

    public static createApiGuildMember(settings: RequireIds<APIGuildMember>, user: APIUser): RequiredProps<APIGuildMember, 'user'> {
        return {
            deaf: false,
            joined_at: '1970-01-01T00:00:00Z',
            mute: false,
            roles: ['0'],
            user: user,
            ...settings
        };
    }

    public createRole(guild: eris.Guild, settings: RequireIds<APIRole>): eris.Role {
        const data = SubtagTestContext.createApiRole(settings);
        return new eris.Role(<eris.BaseData><unknown>data, guild);
    }

    public static createApiRole(settings: RequireIds<APIRole>): APIRole {
        return {
            color: 0,
            hoist: false,
            managed: false,
            mentionable: false,
            name: '@everyone',
            permissions: '0',
            position: 0,
            ...settings
        };
    }

    public createGuild(settings: APIGuild | RequireIds<APIGuild>, channels: APIChannel[], members: APIGuildMember[]): eris.Guild {
        const data = 'hub_type' in settings ? settings : SubtagTestContext.createApiGuild(settings);
        const guild = new eris.Guild({ ...data, members: members, channels: channels }, this.discord.instance);
        return guild;
    }

    public static createApiGuild(settings: RequireIds<APIGuild>): RequiredProps<APIGuild, 'roles'> {
        return {
            afk_channel_id: null,
            afk_timeout: 60,
            application_id: null,
            banner: null,
            default_message_notifications: GuildDefaultMessageNotifications.AllMessages,
            description: null,
            discovery_splash: null,
            emojis: [],
            explicit_content_filter: GuildExplicitContentFilter.Disabled,
            features: [],
            icon: null,
            mfa_level: GuildMFALevel.None,
            name: 'Test Guild',
            nsfw_level: GuildNSFWLevel.Default,
            preferred_locale: 'en-US',
            premium_progress_bar_enabled: false,
            premium_tier: GuildPremiumTier.None,
            roles: [
                this.createApiRole({ id: settings.id })
            ],
            public_updates_channel_id: null,
            rules_channel_id: null,
            splash: null,
            stickers: [],
            system_channel_flags: 0 as never,
            system_channel_id: null,
            vanity_url_code: null,
            verification_level: GuildVerificationLevel.None,
            region: '',
            hub_type: null,
            ...settings
        };
    }

    public createChannel<T extends keyof eris.KnownChannelMap>(settings: RequireIds<APIChannel> & { type: T; }): eris.KnownChannelMap[T]
    public createChannel(settings: RequireIds<APITextChannel>): eris.KnownTextableChannel
    public createChannel(settings: RequireIds<APIChannel>): eris.KnownChannel
    public createChannel(settings: RequireIds<APIChannel>): eris.KnownChannel {
        const data = SubtagTestContext.createApiChannel(settings);
        return eris.Channel.from(<eris.BaseData><unknown>data, this.discord.instance);
    }

    public static createApiChannel<T extends ChannelType>(settings: RequireIds<Extract<APIChannel, { type: T; }>> & { type: T; }): Extract<APIChannel, { type: T; }>;
    public static createApiChannel(settings: RequireIds<APITextChannel>): APITextChannel;
    public static createApiChannel<T extends APIChannel>(settings: RequireIds<T>): T;
    public static createApiChannel<T extends APIChannel>(settings: RequireIds<T>): T {
        return {
            name: 'Test Channel',
            type: ChannelType.GuildText,
            position: 0,
            permission_overwrites: [],
            nsfw: false,
            topic: 'Test channel!',
            ...settings
        } as unknown as T;
    }
}
/* eslint-enable @typescript-eslint/naming-convention */

export async function runSubtagTests<T extends Subtag>(data: SubtagTestSuiteData<T>): Promise<void> {
    const error = { stack: '' };
    Error.captureStackTrace(error, runSubtagTests);
    const stack = `Via SubtagTestSuite\n${error.stack.split('\n').slice(1).join('\n')}`;
    const suite = new SubtagTestSuite([data.subtag, ...data.otherSubtags ?? []], data.names);
    if (data.setup !== undefined)
        suite.setup(data.setup);
    if (data.postSetup !== undefined)
        suite.postSetup(data.postSetup);
    if (data.assert !== undefined)
        suite.assert(data.assert);
    if (data.teardown !== undefined)
        suite.teardown(data.teardown);

    const min = typeof data.argCountBounds.min === 'number' ? { count: data.argCountBounds.min, noEval: [] } : data.argCountBounds.min;
    const max = typeof data.argCountBounds.max === 'number' ? { count: data.argCountBounds.max, noEval: [] } : data.argCountBounds.max;

    suite.addTestCases(notEnoughArgumentsTestCases(data.subtag.name, min.count, min.noEval));
    suite.addTestCases(data.cases);
    if (max.count < Infinity)
        suite.addTestCases(tooManyArgumentsTestCases(data.subtag.name, max.count, max.noEval));

    const runOtherTests = data.runOtherTests;
    await suite.run(stack, runOtherTests === undefined ? undefined : () => runOtherTests(data.subtag));

    // Output a bbtag file that can be run on the live blargbot instance to find any errors
    if (inspector.url() !== undefined) {
        const blargTestSuite = `Errors:{clean;${data.cases.map(c => ({
            code: c.code,
            expected: getExpectation(c)
        })).map(c => `{if;==;|${c.code}|;|${c.expected?.toString() ?? ''}|;;
> {escapebbtag;${c.code}} failed -
Expected:
|${c.expected?.toString() ?? ''}|
Actual:
|${c.code}|}`).join('\n')}}
---------------
Finished!`;
        fs.writeFileSync(path.join(import.meta.dirname, '../../../test.bbtag'), blargTestSuite);
    }
}

export function sourceMarker(location: number | SourceMarker, source: string): SourceMarker | undefined {
    if (typeof location === 'object')
        return location;

    const slice = source.slice(0, location);
    const lineStart = slice.lastIndexOf('\n');
    const lastLine = lineStart === -1 ? slice : slice.slice(lineStart + 1);
    const lineCount = slice.split('\n').length - 1;
    return { index: location, line: lineCount, column: lastLine.length };
}

abstract class TestSubtagBase extends Subtag {
    public category = SubtagType.SIMPLE;
    public hidden = true;
    public signatures = [];
    public aliases = [];
    public description = undefined;
    public deprecated = false;
    public staff = false;
}

export class TestDataSubtag extends TestSubtagBase {
    public name = 'testdata';
    public constructor(public readonly values: Record<string, string | undefined>) {
        super();
    }

    protected async * executeCore(_: unknown, __: unknown, subtag: SubtagCall): AsyncIterable<string> {
        if (subtag.args.length !== 1)
            throw new RangeError(`Subtag ${this.name} must be given 1 argument!`);
        const key = subtag.args[0].source;
        const value = this.values[key];
        if (value === undefined)
            throw new RangeError(`Subtag ${this.name} doesnt have test data set up for ${JSON.stringify(value)}`);

        await Promise.resolve();
        yield value;
    }
}

export class EvalSubtag extends TestSubtagBase {
    public name = 'eval';

    protected executeCore(_context: BBTagContext, _subtagName: string, subtag: SubtagCall): never {
        throw new MarkerError('eval', subtag.start.index);
    }
}

export class AssertSubtag extends TestSubtagBase {
    readonly #assertion: (context: BBTagContext, subtagName: string, subtag: SubtagCall) => Awaitable<string>;
    public name = 'assert';

    public constructor(assertion: (...args: Parameters<Subtag['executeCore']>) => Awaitable<string>) {
        super();
        this.#assertion = assertion;
    }

    protected async * executeCore(context: BBTagContext, subtagName: string, subtag: SubtagCall): AsyncIterable<string> {
        yield await this.#assertion(context, subtagName, subtag);
    }
}

export class FailTestSubtag extends TestSubtagBase {
    public name = 'fail';

    public executeCore(_context: BBTagContext, _subtagName: string, subtag: SubtagCall): never {
        throw new RangeError(`Subtag ${subtag.source} was evaluated when it wasnt supposed to!`);
    }
}

export class LimitedTestSubtag extends TestSubtagBase {
    readonly #counts = new WeakMap<BBTagContext, number>();
    readonly #limit: number;
    public name = 'limit';

    public constructor(limit = 1) {
        super();
        this.#limit = limit;
    }

    protected executeCore(context: BBTagContext): never {
        const count = this.#counts.get(context) ?? 0;
        this.#counts.set(context, count + 1);

        if (count >= this.#limit)
            throw new Error(`Subtag {limit} cannot be called more than ${this.#limit} time(s)`);
        throw new MarkerError('limit', count + 1);
    }
}

export class EchoArgsSubtag extends TestSubtagBase {
    public name = 'echoargs';
    protected async * executeCore(_: BBTagContext, __: string, subtag: SubtagCall): AsyncIterable<string> {
        await Promise.resolve();
        yield '[';
        yield JSON.stringify(subtag.name.source);
        for (const arg of subtag.args) {
            yield ',';
            yield JSON.stringify(arg.source);
        }
        yield ']';
    }
}

export class SubtagTestSuite {
    readonly #config: TestSuiteConfig = { setup: [], assert: [], teardown: [], postSetup: [] };
    readonly #testCases: SubtagTestCase[] = [];
    readonly #subtags: Subtag[];
    readonly #names: Iterable<string>;

    public constructor(subtags: Subtag[], names: Iterable<string>) {
        this.#subtags = subtags;
        this.#names = names;
    }

    public setup(setup: TestSuiteConfig['setup'][number]): this {
        this.#config.setup.push(setup);
        return this;
    }

    public postSetup(setup: TestSuiteConfig['postSetup'][number]): this {
        this.#config.postSetup.push(setup);
        return this;
    }

    public assert(assert: TestSuiteConfig['assert'][number]): this {
        this.#config.assert.push(assert);
        return this;

    }

    public teardown(teardown: TestSuiteConfig['teardown'][number]): this {
        this.#config.teardown.push(teardown);
        return this;
    }

    public addTestCase(...testCases: SubtagTestCase[]): this {
        return this.addTestCases(testCases);
    }

    public addTestCases(testCases: Iterable<SubtagTestCase>): this {
        for (const testCase of testCases)
            this.#testCases.push(testCase);
        return this;
    }

    public async run(stack: string, otherTests?: () => Promise<void>): Promise<void> {
        const subtag = this.#subtags[0];
        await describe(`{${subtag.name}}`, async () => {
            const config = this.#config;
            await it(`Should have [${Iterator.from(this.#names).map(x => JSON.stringify(x)).toArray().join(',')}] as names`, () => {
                try {
                    const expectedNames = new Set(this.#names);
                    assert(expectedNames.size > 0);
                    const subtagNames = new Set(subtag.aliases);
                    subtagNames.add(subtag.name);
                    assert.deepEqual(subtagNames, expectedNames);
                } catch (error) {
                    if (error instanceof Error)
                        error.stack += `\n${stack}`;
                    throw error;
                }
            });

            for (const testCase of this.#testCases) {
                const retries = Math.max(testCase.retries ?? 0, 0);
                const timeout = testCase.timeout === undefined ? undefined : (retries + 1) * testCase.timeout;
                await it(getTestName(testCase), { skip: await shouldSkip(testCase), timeout }, async t => {
                    for (let attempt = 0; attempt < retries; attempt++) {
                        try {
                            await runTestCase(this.#subtags, testCase, config, t);
                            return;
                        } catch {
                            t.mock.reset();
                            /* NO-OP */
                        }
                    }
                    try {
                        await runTestCase(this.#subtags, testCase, config, t);
                    } catch (error) {
                        if (error instanceof Error)
                            error.stack += `\n${stack}`;
                        throw error;
                    }
                });
            }

            if (otherTests !== undefined)
                await otherTests();
        });
    }
}

function getTestName(testCase: SubtagTestCase): string {
    let result = `should handle ${JSON.stringify(testCase.code)}`;
    const expected = getExpectation(testCase);
    switch (typeof expected) {
        case 'undefined': break;
        case 'string':
            result += ` and return ${JSON.stringify(expected)}`;
            break;
        case 'object':
            result += ` and return something matching ${expected.toString()}`;
            break;
    }

    if (typeof testCase.errors === 'object') {
        const [errorCount, markerCount] = testCase.errors.reduce((p, c) => c.error instanceof MarkerError ? [p[0], p[1] + 1] : [p[0] + 1, p[1]], [0, 0]);
        if (errorCount > 0 || markerCount > 0) {
            const errorStr = errorCount === 0 ? undefined : `${errorCount} ${p(errorCount, 'error')}`;
            const markerStr = markerCount === 0 ? undefined : `${markerCount} ${p(markerCount, 'marker')}`;
            result += ` with ${[markerStr, errorStr].filter(x => x !== undefined).join(' and ')}`;
        }
    }

    if (testCase.title !== undefined)
        result += ` - ${testCase.title}`;

    return result;
}

async function shouldSkip(testCase: SubtagTestCase): Promise<boolean> {
    return typeof testCase.skip === 'boolean' ? testCase.skip : await testCase.skip?.() ?? false;
}

async function runTestCase<TestCase extends SubtagTestCase>(subtags: Subtag[], testCase: TestCase, config: TestSuiteConfig, testCtx: TestContext): Promise<void> {
    subtags = [...subtags, new EvalSubtag(), new FailTestSubtag(), ...testCase.subtags ?? []];
    const test = new SubtagTestContext(testCase, subtags);
    const actualTestCase = Object.create(testCase, { 'timestamp': { value: moment() } });

    try {
        // arrange
        const code = bbtag.parse(testCase.code);
        for (const setup of config.setup)
            await setup(test, code, testCtx);
        await actualTestCase.setup?.(test, code, testCtx);
        for (const s of subtags)
            test.limit.setup((m, $) => m.check($.instanceOf(BBTagContext), s.name)).resolves(undefined, { isFallback: true });
        const context = test.createContext();
        for (const postSetup of config.postSetup)
            await postSetup.call(actualTestCase, context, test);
        await actualTestCase.postSetup?.(context, test);

        const expected = getExpectation(testCase);

        // act
        const result = await runSafe(() => context.eval(code));
        if (!result.success) {
            if (actualTestCase.expectError === undefined)
                throw result.error;
            await actualTestCase.expectError.handle(result.error);
            return;
        } else if (actualTestCase.expectError?.required === true) {
            throw new Error('Expected an error to be thrown!');
        }

        // assert
        switch (typeof expected) {
            case 'string':
                assert.equal(result.value, expected);
                break;
            case 'object':
                assert.match(result.value, expected);
                break;
        }

        await actualTestCase.assert?.(context, result.value, test);
        for (const assert of config.assert)
            await assert.call(actualTestCase, context, result.value, test);

        if (typeof testCase.errors === 'function') {
            testCase.errors(context.errors);
        } else {
            const errors = context.errors.map(err => ({
                error: noStack(err.error),
                start: err.subtag?.start,
                end: err.subtag?.end
            }));
            const expected = testCase.errors?.map(err => ({
                error: noStack(err.error),
                start: sourceMarker(err.start ?? 0, testCase.code),
                end: sourceMarker(err.end ?? testCase.code.length, testCase.code)
            })) ?? [];
            assert.deepEqual(errors, expected);
        }
        test.verifyAll();
    } finally {
        for (const teardown of config.teardown)
            await teardown.call(actualTestCase, test);
    }
}

async function runSafe<T>(action: () => Awaitable<T>): Promise<{ success: true; value: T; } | { success: false; error: unknown; }> {
    try {
        return { success: true, value: await action() };
    } catch (err: unknown) {
        return { success: false, error: err };
    }
}

function noStack(error: unknown): unknown {
    if (!(error instanceof Error))
        return error;

    const result = Object.create(Reflect.getPrototypeOf(error)) as Error;
    for (const property of Reflect.ownKeys(error)) {
        const descriptor = Reflect.getOwnPropertyDescriptor(error, property);
        if (descriptor === undefined)
            continue;
        if (property === 'stack')
            descriptor.value = error.stack?.replaceAll(/(?<=\n)(?: {4}at [^\n]+(?:\n|$))+/gs, '<stack ignored>');
        else if (property === 'cause')
            descriptor.value = noStack(descriptor.value);
        if ('get' in descriptor && 'value' in descriptor) {
            descriptor.writable = 'set' in descriptor;
            delete descriptor.get;
            delete descriptor.set;
        }
        Reflect.defineProperty(result, property, descriptor);
    }
    return result;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
function getExpectation(testCase: SubtagTestCase): Exclude<SubtagTestCase['expected'], Function> {
    if (typeof testCase.expected === 'function')
        return testCase.expected();
    return testCase.expected;
}

export function* notEnoughArgumentsTestCases(subtagName: string, minArgCount: number, noEval: number[]): Generator<SubtagTestCase> {
    const noEvalLookup = new Set(noEval);
    for (let i = 0; i < minArgCount; i++) {
        const codeParts = repeat(i, j => {
            const start = 2 + subtagName.length + 7 * j;
            return [noEvalLookup.has(j), { start, end: start + 6, error: new MarkerError('eval', start) }] as const;
        });
        yield {
            code: `{${[subtagName, ...codeParts.map(p => p[0] ? '{fail}' : '{eval}')].join(';')}}`,
            expected: '`Not enough arguments`',
            errors: [
                ...codeParts.filter(p => !p[0]).map(p => p[1]),
                { error: new NotEnoughArgumentsError(minArgCount, i) }
            ]
        };
    }
    const codeParts = repeat(minArgCount, j => {
        const start = 2 + subtagName.length + 7 * j;
        return [noEvalLookup.has(j), { start, end: start + 6, error: new MarkerError('eval', start) }] as const;
    });
    yield {
        title: 'Min arg count',
        code: `{${[subtagName, ...codeParts.map(p => p[0] ? '{fail}' : '{eval}')].join(';')}}`,
        expected: /^(?!`Not enough arguments`|`Too many arguments`).*$/gis,
        errors(err) {
            const errorTypes = new Set(err.map(x => x.error.constructor));
            assert(!errorTypes.has(NotEnoughArgumentsError));
            assert(!errorTypes.has(TooManyArgumentsError));
        },
        expectError: {
            handle() { /* NOOP */ }
        }
    };
}

export function* tooManyArgumentsTestCases(subtagName: string, maxArgCount: number, noEval: number[]): Generator<SubtagTestCase> {
    const noEvalLookup = new Set(noEval);
    const codeParts = repeat(maxArgCount + 1, j => {
        const start = 2 + subtagName.length + 7 * j;
        return [noEvalLookup.has(j), { start, end: start + 6, error: new MarkerError('eval', start) }] as const;
    });
    yield {
        title: 'Max arg count',
        code: `{${[subtagName, ...codeParts.slice(0, maxArgCount).map(p => p[0] ? '{fail}' : '{eval}')].join(';')}}`,
        expected: /^(?!`Not enough arguments`|`Too many arguments`).*$/gis,
        errors(err) {
            const errorTypes = new Set(err.map(x => x.error.constructor));
            assert(!errorTypes.has(NotEnoughArgumentsError));
            assert(!errorTypes.has(TooManyArgumentsError));
        },
        expectError: {
            handle() { /* NOOP */ }
        }
    };
    yield {
        code: `{${[subtagName, ...codeParts.map(p => p[0] ? '{fail}' : '{eval}')].join(';')}}`,
        expected: '`Too many arguments`',
        errors: [
            ...codeParts.filter(p => !p[0]).map(p => p[1]),
            { error: new TooManyArgumentsError(maxArgCount, maxArgCount + 1) }
        ]
    };
}
