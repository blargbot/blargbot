import { BBTagContext, BBTagEngine, Subtag } from '@blargbot/bbtag';
import { BBTagUtilities, InjectionContext } from '@blargbot/bbtag/BBTagUtilities';
import { BBTagRuntimeError, NotEnoughArgumentsError, TooManyArgumentsError } from '@blargbot/bbtag/errors';
import { BaseRuntimeLimit } from '@blargbot/bbtag/limits/BaseRuntimeLimit';
import { BBTagContextOptions, BBTagRuntimeScope, LocatedRuntimeError, SourceMarker, SubtagCall, SubtagResult } from '@blargbot/bbtag/types';
import { bbtag, SubtagType } from '@blargbot/bbtag/utils';
import { Database } from '@blargbot/core/database';
import { ModuleLoader } from '@blargbot/core/modules';
import { Timer } from '@blargbot/core/Timer';
import { GuildCommandTag, GuildTable, StoredTag, SubtagVariableType, TagsTable, TagVariablesTable, UserTable } from '@blargbot/core/types';
import { pluralise as p, repeat, snowflake } from '@blargbot/core/utils';
import { Logger } from '@blargbot/logger';
import { expect } from 'chai';
import * as chai from 'chai';
import chaiBytes from 'chai-bytes';
import chaiDateTime from 'chai-datetime';
import chaiExclude from 'chai-exclude';
import { APIChannel, APIGuild, APIGuildMember, APIMessage, APIRole, APIUser, ChannelType, GuildDefaultMessageNotifications, GuildExplicitContentFilter, GuildMFALevel, GuildNSFWLevel, GuildPremiumTier, GuildVerificationLevel } from 'discord-api-types';
import { BaseData, Channel, Client as Discord, ClientOptions as DiscordOptions, Collection, Constants, DiscordHTTPError, DiscordRESTError, ExtendedUser, Guild, KnownChannel, KnownChannelMap, KnownGuildTextableChannel, KnownTextableChannel, Member, Message, Role, Shard, ShardManager, User } from 'eris';
import * as fs from 'fs';
import { ClientRequest, IncomingMessage } from 'http';
import * as inspector from 'inspector';
import { Context, describe, it } from 'mocha';
import moment, { Moment } from 'moment-timezone';
import path from 'path';
import { anything } from 'ts-mockito';
import { inspect } from 'util';

import { argument, Mock } from '../mock';

chai.use(chaiExclude);
chai.use(chaiBytes);
chai.use(chaiDateTime);

type SourceMarkerResolvable = SourceMarker | number | `${number}:${number}:${number}` | `${number}:${number}` | `${number}`;
type IdPropertiesOf<T> = { [P in keyof T]-?: [P, T[P]] extends [`${string}_id` | 'id', string] ? P : never }[keyof T];
type RequireIds<T, OtherProps extends keyof T = never> = RequiredProps<Partial<T>, IdPropertiesOf<T> | OtherProps>;

type RuntimeSubtagTestCase<T> = Readonly<T> & {
    readonly timestamp: Moment;
}

export interface SubtagTestCase {
    readonly title?: string;
    readonly code: string;
    readonly subtagName?: string;
    readonly expected?: string | RegExp | (() => string | RegExp);
    readonly setup?: (this: RuntimeSubtagTestCase<this>, context: SubtagTestContext) => Awaitable<void>;
    readonly postSetup?: (this: RuntimeSubtagTestCase<this>, context: BBTagContext, mocks: SubtagTestContext) => Awaitable<void>;
    readonly assert?: (this: RuntimeSubtagTestCase<this>, context: BBTagContext, result: string, test: SubtagTestContext) => Awaitable<void>;
    readonly teardown?: (this: RuntimeSubtagTestCase<this>, context: SubtagTestContext) => Awaitable<void>;
    readonly expectError?: {
        required?: boolean;
        handle: (error: unknown) => Awaitable<void>;
    };
    readonly errors?: ReadonlyArray<{ start?: SourceMarkerResolvable; end?: SourceMarkerResolvable; error: BBTagRuntimeError; }> | ((errors: LocatedRuntimeError[]) => void);
    readonly subtags?: readonly Subtag[];
    readonly skip?: boolean | (() => Awaitable<boolean>);
    readonly retries?: number;
    readonly setupSaveVariables?: boolean;
}

interface TestSuiteConfig<T extends SubtagTestCase> {
    readonly setup: Array<(this: RuntimeSubtagTestCase<T>, context: SubtagTestContext) => Awaitable<void>>;
    readonly assert: Array<(this: RuntimeSubtagTestCase<T>, context: BBTagContext, result: string, test: SubtagTestContext) => Awaitable<void>>;
    readonly teardown: Array<(this: RuntimeSubtagTestCase<T>, context: SubtagTestContext) => Awaitable<void>>;
    readonly postSetup: Array<(this: RuntimeSubtagTestCase<T>, context: BBTagContext, mocks: SubtagTestContext) => Awaitable<void>>;
}

export class MarkerError extends BBTagRuntimeError {
    public constructor(type: string, index: number) {
        super(`{${type}} called at ${index}`);
        this.display = '';
    }
}

export interface SubtagTestSuiteData<T extends Subtag = Subtag, TestCase extends SubtagTestCase = SubtagTestCase> extends Pick<TestCase, 'setup' | 'postSetup' | 'assert' | 'teardown'> {
    readonly cases: TestCase[];
    readonly subtag: T;
    readonly runOtherTests?: (subtag: T) => void;
    readonly argCountBounds: { min: ArgCountBound; max: ArgCountBound; };
}

type ArgCountBound = number | { count: number; noEval: number[]; };

/* eslint-disable @typescript-eslint/naming-convention */
export class SubtagTestContext {
    readonly #allMocks: Array<Mock<unknown>> = [];
    #isCreated = false;
    public readonly timer = new Timer();
    public readonly dependencies = this.createMock<InjectionContext>();
    public readonly util = this.createMock<BBTagUtilities>();
    public readonly shard = this.createMock(Shard);
    public readonly shards = this.createMock(ShardManager);
    public readonly discord = this.createMock(Discord);
    public readonly logger = this.createMock<Logger>(undefined, false);
    public readonly database = this.createMock(Database);
    public readonly tagVariablesTable = this.createMock<TagVariablesTable>();
    public readonly tagsTable = this.createMock<TagsTable>();
    public readonly guildTable = this.createMock<GuildTable>();
    public readonly userTable = this.createMock<UserTable>();
    public readonly limit = this.createMock(BaseRuntimeLimit);
    public readonly discordOptions: DiscordOptions;
    public isStaff = false;
    public readonly ownedMessages: string[] = [];

    public readonly ccommands: Record<string, GuildCommandTag>;
    public readonly tags: Record<string, StoredTag>;
    public readonly tagVariables: Record<`${SubtagVariableType}.${string}.${string}`, JToken | undefined>;
    public readonly rootScope: BBTagRuntimeScope = { functions: {}, inLock: false, isTag: true };

    public readonly options: Mutable<Partial<BBTagContextOptions>>;

    public readonly roles = {
        everyone: SubtagTestContext.createApiRole({ id: snowflake.create().toString() }),
        top: SubtagTestContext.createApiRole({ id: snowflake.create().toString(), position: 4, name: 'Top Role' }),
        command: SubtagTestContext.createApiRole({ id: snowflake.create().toString(), position: 3, name: 'Command User' }),
        other: SubtagTestContext.createApiRole({ id: snowflake.create().toString(), position: 2, name: 'Other User' }),
        bot: SubtagTestContext.createApiRole({ id: snowflake.create().toString(), position: 1, name: 'Bot' })
    };

    public readonly users = {
        owner: SubtagTestContext.createApiUser({ id: snowflake.create().toString(), username: 'Guild owner' }),
        command: SubtagTestContext.createApiUser({ id: snowflake.create().toString(), username: 'Command User' }),
        other: SubtagTestContext.createApiUser({ id: snowflake.create().toString(), username: 'Other user' }),
        bot: SubtagTestContext.createApiUser({
            id: '134133271750639616',
            username: 'blargbot',
            discriminator: '0128'
        })
    };

    public readonly members = {
        owner: SubtagTestContext.createApiGuildMember({ roles: [] }, this.users.owner),
        command: SubtagTestContext.createApiGuildMember({ roles: [this.roles.command.id] }, this.users.command),
        other: SubtagTestContext.createApiGuildMember({ roles: [this.roles.other.id] }, this.users.other),
        bot: SubtagTestContext.createApiGuildMember({ roles: [this.roles.bot.id] }, this.users.bot)
    };

    public readonly channels = {
        command: SubtagTestContext.createApiChannel({ id: snowflake.create().toString(), name: 'commands' }),
        general: SubtagTestContext.createApiChannel({ id: snowflake.create().toString(), name: 'general' })
    };

    public readonly guild = SubtagTestContext.createApiGuild(
        {
            id: this.roles.everyone.id,
            owner_id: this.users.owner.id,
            roles: Object.values(this.roles)
        },
        Object.values(this.channels),
        Object.values(this.members)
    );

    public readonly message: APIMessage = SubtagTestContext.createApiMessage({
        id: snowflake.create().toString(),
        member: this.members.command,
        channel_id: this.channels.command.id,
        guild_id: this.guild.id
    }, this.users.command);

    public constructor(public readonly testCase: SubtagTestCase, subtags: Iterable<Subtag>) {
        this.discordOptions = { intents: [] };
        this.tagVariables = {};
        this.tags = {};
        this.ccommands = {};
        this.options = { tagName: `testTag_${snowflake.create()}` };

        const args = new Array(100).fill(argument.any().value) as unknown[];
        for (let i = 0; i < args.length; i++) {
            this.logger.setup(m => m.error(...args.slice(0, i)), false).thenCall((...args: unknown[]) => {
                throw args.find(x => x instanceof Error) ?? new Error('Unexpected logger error: ' + inspect(args));
            });
        }

        this.dependencies.setup(m => m.discord, false).thenReturn(this.discord.instance);
        this.dependencies.setup(m => m.database, false).thenReturn(this.database.instance);
        this.dependencies.setup(m => m.logger, false).thenReturn(this.logger.instance);
        this.dependencies.setup(m => m.util, false).thenReturn(this.util.instance);

        this.database.setup(m => m.tagVariables, false).thenReturn(this.tagVariablesTable.instance);
        this.database.setup(m => m.guilds, false).thenReturn(this.guildTable.instance);
        this.database.setup(m => m.users, false).thenReturn(this.userTable.instance);
        this.database.setup(m => m.tags, false).thenReturn(this.tagsTable.instance);

        const isVariableType = argument.isTypeof('string').and((v): v is SubtagVariableType => Object.values(SubtagVariableType).includes(v)).value;

        this.tagVariablesTable.setup(m => m.get(argument.isTypeof('string').value, isVariableType, argument.isTypeof('string').value), false)
            .thenCall((...args: Parameters<TagVariablesTable['get']>) => this.tagVariables[`${args[1]}.${args[2]}.${args[0]}`]);
        if (this.testCase.setupSaveVariables !== false) {
            this.tagVariablesTable.setup(m => m.upsert(anything() as never, isVariableType, argument.isTypeof('string').value), false)
                .thenCall((...args: Parameters<TagVariablesTable['upsert']>) => {
                    for (const [name, value] of Object.entries(args[0]))
                        this.tagVariables[`${args[1]}.${args[2]}.${name}`] = value;
                });
        }

        this.tagsTable.setup(m => m.get(argument.isTypeof('string').value), false)
            .thenCall((...args: Parameters<TagsTable['get']>) => this.tags[args[0]]);
        this.guildTable.setup(m => m.getCommand(this.guild.id, argument.isTypeof('string').value), false)
            .thenCall((...args: Parameters<GuildTable['getCommand']>) => this.ccommands[args[1]]);

        this.discord.setup(m => m.shards, false).thenReturn(this.shards.instance);
        this.discord.setup(m => m.guildShardMap, false).thenReturn({});
        this.discord.setup(m => m.channelGuildMap, false).thenReturn({});
        this.discord.setup(m => m.options, false).thenReturn(this.discordOptions);
        this.discord.setup(m => m._formatImage(anything() as never), false).thenCall((str: never) => Discord.prototype._formatImage.call(this.discord.instance, str));
        this.discord.setup(m => m._formatAllowedMentions(anything() as never), false).thenCall((str: never) => Discord.prototype._formatImage.call(this.discord.instance, str));

        this.shards.setup(m => m.get(0), false).thenReturn(this.shard.instance);
        this.shard.setup(m => m.client, false).thenReturn(this.discord.instance);

        this.discord.setup(m => m.guilds, false).thenReturn(new Collection(Guild));
        this.discord.setup(m => m.users, false).thenReturn(new Collection(User));

        const subtagLoader = this.createMock<ModuleLoader<Subtag>>(ModuleLoader);
        const subtagMap = new Map([...subtags].flatMap(s => [s.name, ...s.aliases].map(n => [n, s])));
        subtagLoader.setup(m => m.get(argument.isTypeof('string').value), false).thenCall((name: string) => subtagMap.get(name));

        this.dependencies.setup(c => c.subtags, false).thenReturn(subtagLoader.instance);
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    public createMock<T>(clazz?: (new (...args: never[]) => T) | (Function & { prototype: T; }), strict = true): Mock<T> {
        const mock = new Mock<T>(clazz, strict);
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

        const bot = new ExtendedUser(<BaseData><unknown>this.users.bot, this.discord.instance);
        this.discord.setup(m => m.user, false).thenReturn(bot);

        const guild = this.createGuild(this.guild);
        this.discord.instance.guilds.add(guild);

        const authorizerId = this.options.authorizerId ?? this.options.authorId ?? this.users.command.id;
        this.util.setup(m => m.isUserStaff(argument.isInstanceof(Member).and(m => m.id === authorizerId && m.guild === guild).value), false).thenResolve(this.isStaff);

        for (const channel of guild.channels.values())
            this.discord.setup(m => m.getChannel(channel.id), false).thenReturn(channel);

        const textableChannelTypes = new Set([ChannelType.GuildText, ChannelType.DM, ChannelType.GroupDM, ChannelType.GuildNews, ChannelType.GuildNewsThread, ChannelType.GuildPrivateThread, ChannelType.GuildPublicThread]);
        const channel = guild.channels.find(c => textableChannelTypes.has(c.type));
        if (channel === undefined)
            throw new Error('No text channels were added');

        const message = this.createMessage<KnownGuildTextableChannel>(this.message);
        this.util.setup(m => m.getMessage(channel, message.id), false).thenResolve(message);

        const context = new BBTagContext(engine, {
            authorId: message.author.id,
            inputRaw: '',
            isCC: false,
            limit: this.limit.instance,
            message: message,
            ...this.options
        });

        context.data.ownedMsgs.push(...this.ownedMessages);
        Object.assign(context.scopes.root, this.rootScope);

        return context;
    }

    public createRESTError(code: number, message = 'Test REST error'): DiscordRESTError {
        const request = this.createMock(ClientRequest);
        const apiMessage = this.createMock(IncomingMessage);

        const x = { stack: '' };
        Error.captureStackTrace(x);
        return new DiscordRESTError(request.instance, apiMessage.instance, { code, message }, x.stack);
    }

    public createHTTPError(code: number, message: string, method: string, path: string): DiscordHTTPError {
        const request = this.createMock(ClientRequest);
        const apiMessage = this.createMock(IncomingMessage);

        apiMessage.setup(m => m.statusCode).thenReturn(code);
        apiMessage.setup(m => m.statusMessage).thenReturn(message);
        request.setup(m => m.method).thenReturn(method);
        request.setup(m => m.path).thenReturn(path);

        const x = { stack: '' };
        Error.captureStackTrace(x);
        return new DiscordHTTPError(request.instance, apiMessage.instance, { code, message }, x.stack);
    }

    public createMessage<TChannel extends KnownTextableChannel>(settings: APIMessage): Message<TChannel>
    public createMessage<TChannel extends KnownTextableChannel>(settings: RequireIds<APIMessage>, author: APIUser): Message<TChannel>
    public createMessage<TChannel extends KnownTextableChannel>(...args: [APIMessage] | [RequireIds<APIMessage>, APIUser]): Message<TChannel> {
        const data = args.length === 1 ? args[0] : SubtagTestContext.createApiMessage(...args);
        return new Message<TChannel>(<BaseData><unknown>data, this.discord.instance);
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
            type: Constants.MessageTypes.DEFAULT,
            ...settings
        };
    }

    public createUser(settings: RequireIds<APIUser>): User {
        const data = SubtagTestContext.createApiUser(settings);
        return new User(<BaseData><unknown>data, this.discord.instance);
    }

    public static createApiUser(settings: RequireIds<APIUser>): APIUser {
        return {
            avatar: null,
            discriminator: '0000',
            username: 'Test User',
            ...settings
        };
    }

    public createGuildMember(guild: Guild | undefined, settings: RequireIds<APIGuildMember>, user: APIUser): Member {
        const data = SubtagTestContext.createApiGuildMember(settings, user);
        return new Member(<BaseData><unknown>data, guild, this.discord.instance);
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

    public createRole(guild: Guild, settings: RequireIds<APIRole>): Role {
        const data = SubtagTestContext.createApiRole(settings);
        return new Role(<BaseData><unknown>data, guild);
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

    public createGuild(settings: APIGuild): Guild
    public createGuild(settings: RequireIds<APIGuild>, channels: APIChannel[], members: APIGuildMember[]): Guild
    public createGuild(...args: [APIGuild] | [RequireIds<APIGuild>, APIChannel[], APIGuildMember[]]): Guild {
        const data = args.length === 1 ? args[0] : SubtagTestContext.createApiGuild(...args);
        return new Guild(<BaseData><unknown>data, this.discord.instance);
    }

    public static createApiGuild(settings: RequireIds<APIGuild>, channels: APIChannel[], members: APIGuildMember[]): RequiredProps<APIGuild, 'members' | 'roles' | 'channels'> {
        return {
            afk_channel_id: null,
            afk_timeout: 0,
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
            system_channel_flags: 0,
            system_channel_id: null,
            vanity_url_code: null,
            verification_level: GuildVerificationLevel.None,
            region: '',
            channels: channels,
            members: members,
            ...settings
        };
    }

    public createChannel<T extends ChannelType>(settings: RequireIds<APIChannel> & { type: T; }): KnownChannelMap[T]
    public createChannel(settings: RequireIds<APIChannel>): KnownChannel
    public createChannel(settings: RequireIds<APIChannel>): KnownChannel {
        const data = SubtagTestContext.createApiChannel(settings);
        return Channel.from(<BaseData><unknown>data, this.discord.instance);
    }

    public static createApiChannel(settings: RequireIds<APIChannel>): APIChannel {
        return {
            name: 'Test Channel',
            type: ChannelType.GuildText,
            position: 0,
            permission_overwrites: [],
            nsfw: false,
            topic: 'Test channel!',
            ...settings
        };
    }
}
/* eslint-enable @typescript-eslint/naming-convention */

export function runSubtagTests<T extends Subtag>(data: SubtagTestSuiteData<T>): void
export function runSubtagTests<T extends Subtag, TestCase extends SubtagTestCase>(data: SubtagTestSuiteData<T, TestCase>): void
export function runSubtagTests<T extends Subtag, TestCase extends SubtagTestCase>(data: SubtagTestSuiteData<T, TestCase>): void {
    const suite = new SubtagTestSuite(data.subtag);
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

    suite.run(() => data.runOtherTests?.(data.subtag));

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
        fs.writeFileSync(path.join(__dirname, '../../../test.bbtag'), blargTestSuite);
    }
}

export function sourceMarker(location: SourceMarkerResolvable): SourceMarker
export function sourceMarker(location: SourceMarkerResolvable | undefined): SourceMarker | undefined
export function sourceMarker(location: SourceMarkerResolvable | undefined): SourceMarker | undefined {
    if (typeof location === 'number')
        return { index: location, line: 0, column: location };
    if (typeof location === 'object')
        return location;
    if (typeof location === 'undefined')
        return undefined;

    const segments = location.split(':');
    const index = segments[0];
    const line = segments[1] ?? '0';
    const column = segments[2] ?? index;

    return { index: parseInt(index), line: parseInt(line), column: parseInt(column) };
}
export class TestDataSubtag extends Subtag {
    public constructor(public readonly values: Record<string, string | undefined>) {
        super({
            name: 'testdata',
            category: SubtagType.SIMPLE,
            signatures: []
        });
    }

    protected async * executeCore(_: unknown, __: unknown, subtag: SubtagCall): SubtagResult {
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

export class EvalSubtag extends Subtag {
    public constructor() {
        super({
            name: 'eval',
            category: SubtagType.SIMPLE,
            hidden: true,
            signatures: []
        });
    }

    protected executeCore(_context: BBTagContext, _subtagName: string, subtag: SubtagCall): never {
        throw new MarkerError('eval', subtag.start.index);
    }
}

export class AssertSubtag extends Subtag {
    public constructor(private readonly assertion: (...args: Parameters<Subtag['executeCore']>) => Awaitable<string>) {
        super({
            name: 'assert',
            category: SubtagType.SIMPLE,
            hidden: true,
            signatures: []
        });
    }

    protected async * executeCore(context: BBTagContext, subtagName: string, subtag: SubtagCall): SubtagResult {
        yield await this.assertion(context, subtagName, subtag);
    }
}

export class FailTestSubtag extends Subtag {
    public constructor() {
        super({
            name: 'fail',
            category: SubtagType.SIMPLE,
            signatures: [],
            hidden: true
        });
    }

    public executeCore(_context: BBTagContext, _subtagName: string, subtag: SubtagCall): never {
        throw new RangeError(`Subtag ${subtag.source} was evaluated when it wasnt supposed to!`);
    }
}

export class LimitedTestSubtag extends Subtag {
    readonly #counts = new WeakMap<BBTagContext, number>();
    readonly #limit: number;

    public constructor(limit = 1) {
        super({
            name: 'limit',
            category: SubtagType.SIMPLE,
            hidden: true,
            signatures: []
        });
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

export class EchoArgsSubtag extends Subtag {
    public constructor() {
        super({
            name: 'echoargs',
            category: SubtagType.SIMPLE,
            hidden: true,
            signatures: []
        });
    }

    protected async * executeCore(_: BBTagContext, __: string, subtag: SubtagCall): SubtagResult {
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

export class SubtagTestSuite<TestCase extends SubtagTestCase> {
    readonly #config: TestSuiteConfig<TestCase> = { setup: [], assert: [], teardown: [], postSetup: [] };
    readonly #testCases: TestCase[] = [];
    readonly #subtag: Subtag;

    public constructor(subtag: Subtag) {
        this.#subtag = subtag;
    }

    public setup(setup: TestSuiteConfig<TestCase>['setup'][number]): this {
        this.#config.setup.push(setup);
        return this;
    }

    public postSetup(setup: TestSuiteConfig<TestCase>['postSetup'][number]): this {
        this.#config.postSetup.push(setup);
        return this;
    }

    public assert(assert: TestSuiteConfig<TestCase>['assert'][number]): this {
        this.#config.assert.push(assert);
        return this;

    }

    public teardown(teardown: TestSuiteConfig<TestCase>['teardown'][number]): this {
        this.#config.teardown.push(teardown);
        return this;
    }

    public addTestCase(...testCases: TestCase[]): this {
        return this.addTestCases(testCases);
    }

    public addTestCases(testCases: Iterable<TestCase>): this {
        for (const testCase of testCases)
            this.#testCases.push(testCase);
        return this;
    }

    public run(otherTests?: () => void): void {
        describe(`{${this.#subtag.name}}`, () => {
            const subtag = this.#subtag;
            const config = this.#config;
            for (const testCase of this.#testCases) {
                it(getTestName(testCase), function () {
                    return runTestCase(this, subtag, testCase, config);
                }).retries(testCase.retries ?? 0);
            }

            otherTests?.();
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

async function runTestCase<TestCase extends SubtagTestCase>(context: Context, subtag: Subtag, testCase: TestCase, config: TestSuiteConfig<TestCase>): Promise<void> {
    if (typeof testCase.skip === 'boolean' ? testCase.skip : await testCase.skip?.() ?? false)
        context.skip();

    const subtags = [subtag, new EvalSubtag(), new FailTestSubtag(), ...testCase.subtags ?? []];
    const test = new SubtagTestContext(testCase, subtags);
    const actualTestCase = Object.create(testCase, { 'timestamp': { value: moment() } });

    try {
        // arrange
        for (const s of subtags)
            test.limit.setup(m => m.check(argument.isInstanceof(BBTagContext).value, s.name), s === subtag).thenResolve(undefined);
        for (const setup of config.setup)
            await setup.call(actualTestCase, test);
        await actualTestCase.setup?.(test);
        const code = bbtag.parse(testCase.code);
        const context = test.createContext();
        for (const postSetup of config.postSetup)
            await postSetup.call(actualTestCase, context, test);
        await actualTestCase.postSetup?.(context, test);

        const expected = getExpectation(testCase);

        // act
        test.timer.start(true);
        const result = await runSafe(() => context.eval(code));
        test.timer.end();
        if (!result.success) {
            if (actualTestCase.expectError === undefined)
                throw result.error;
            await actualTestCase.expectError.handle(result.error);
            return;
        } else if (actualTestCase.expectError?.required === true) {
            throw new Error('Expected an error to be thrown!');
        }

        if (actualTestCase.setupSaveVariables !== false)
            await context.variables.persist();

        // assert
        switch (typeof expected) {
            case 'string':
                expect(result.value).to.equal(expected);
                break;
            case 'object':
                expect(result.value).to.match(expected);
                break;
        }

        await actualTestCase.assert?.(context, result.value, test);
        for (const assert of config.assert)
            await assert.call(actualTestCase, context, result.value, test);

        if (typeof testCase.errors === 'function') {
            testCase.errors(context.errors);
        } else {
            expect(context.errors.map(err => ({ error: err.error, start: err.subtag?.start, end: err.subtag?.end })))
                .excludingEvery('stack')
                .to.deep.equal(testCase.errors?.map(err => ({ error: err.error, start: sourceMarker(err.start), end: sourceMarker(err.end) })) ?? [],
                    'Error details didnt match the expectation');
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

// eslint-disable-next-line @typescript-eslint/ban-types
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
                { start: 0, end: 2 + subtagName.length + 7 * i, error: new NotEnoughArgumentsError(minArgCount, i) }
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
            expect(err.map(x => x.error.constructor)).to.not.have.members([NotEnoughArgumentsError, TooManyArgumentsError]);
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
            expect(err.map(x => x.error.constructor)).to.not.have.members([NotEnoughArgumentsError, TooManyArgumentsError]);
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
            { start: 0, end: 9 + subtagName.length + 7 * maxArgCount, error: new TooManyArgumentsError(maxArgCount, maxArgCount + 1) }
        ]
    };
}
