import { Cluster, ClusterUtilities } from '@cluster';
import { BBTagContext, BBTagEngine, Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { BaseRuntimeLimit } from '@cluster/bbtag/limits/BaseRuntimeLimit';
import { TimeoutManager } from '@cluster/managers';
import { BBTagContextOptions, BBTagRuntimeScope, LocatedRuntimeError, SourceMarker, SubtagCall } from '@cluster/types';
import { bbtagUtil, guard, pluralise as p, snowflake, SubtagType } from '@cluster/utils';
import { Database } from '@core/database';
import { Logger } from '@core/Logger';
import { ModuleLoader } from '@core/modules';
import { GuildTable, SubtagVariableType, TagVariablesTable } from '@core/types';
import { expect } from 'chai';
import * as chai from 'chai';
import chaiExclude from 'chai-exclude';
import { APIChannel, APIGuild, APIGuildMember, APIMessage, APIRole, APIUser, ChannelType, GuildDefaultMessageNotifications, GuildExplicitContentFilter, GuildMFALevel, GuildNSFWLevel, GuildPremiumTier, GuildVerificationLevel } from 'discord-api-types';
import { BaseData, Channel, Client as Discord, ClientOptions as DiscordOptions, Collection, Constants, DiscordRESTError, ExtendedUser, Guild, HTTPResponse, KnownChannel, KnownChannelMap, KnownGuildTextableChannel, KnownTextableChannel, Member, Message, Role, Shard, ShardManager, User } from 'eris';
import * as fs from 'fs';
import { ClientRequest, IncomingMessage } from 'http';
import * as inspector from 'inspector';
import { Context, describe, it } from 'mocha';
import moment, { Moment } from 'moment-timezone';
import path from 'path';
import { anyString, anything } from 'ts-mockito';
import { inspect } from 'util';

import { argument, Mock } from '../../../mock';

chai.use(chaiExclude);

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
    readonly assert?: (this: RuntimeSubtagTestCase<this>, context: BBTagContext, result: string, test: SubtagTestContext) => Awaitable<void>;
    readonly teardown?: (this: RuntimeSubtagTestCase<this>, context: SubtagTestContext) => Awaitable<void>;
    readonly errors?: ReadonlyArray<{ start?: SourceMarkerResolvable; end?: SourceMarkerResolvable; error: BBTagRuntimeError; }> | ((errors: LocatedRuntimeError[]) => void);
    readonly subtags?: readonly Subtag[];
    readonly skip?: boolean | (() => Awaitable<boolean>);
    readonly retries?: number;
}

interface TestSuiteConfig<T extends SubtagTestCase> {
    readonly setup: Array<(this: RuntimeSubtagTestCase<T>, context: SubtagTestContext) => Awaitable<void>>;
    readonly assert: Array<(this: RuntimeSubtagTestCase<T>, context: BBTagContext, result: string, test: SubtagTestContext) => Awaitable<void>>;
    readonly teardown: Array<(this: RuntimeSubtagTestCase<T>, context: SubtagTestContext) => Awaitable<void>>;
}

export class MarkerError extends BBTagRuntimeError {
    public constructor(type: string, index: number) {
        super(`{${type}} called at ${index}`);
        this.display = '';
    }
}

export interface SubtagTestSuiteData<T extends Subtag = Subtag, TestCase extends SubtagTestCase = SubtagTestCase> extends Pick<TestCase, 'setup' | 'assert' | 'teardown'> {
    readonly cases: TestCase[];
    readonly subtag: T;
    readonly runOtherTests?: (subtag: T) => void;
}

/* eslint-disable @typescript-eslint/naming-convention */
export class SubtagTestContext {
    public readonly cluster: Mock<Cluster>;
    public readonly shard: Mock<Shard>;
    public readonly shards: Mock<ShardManager>;
    public readonly discord: Mock<Discord>;
    public readonly logger: Mock<Logger>;
    public readonly database: Mock<Database>;
    public readonly tagVariablesTable: Mock<TagVariablesTable>;
    public readonly guildTable: Mock<GuildTable>;
    public readonly timeouts: Mock<TimeoutManager>;
    public readonly limit: Mock<BaseRuntimeLimit>;
    public readonly discordOptions: DiscordOptions;

    public readonly tagVariables: Record<`${SubtagVariableType}.${string}.${string}`, JToken | undefined>;
    public readonly rootScope: BBTagRuntimeScope = { functions: {}, inLock: false };

    public readonly options: Mutable<Partial<BBTagContextOptions>>;

    public readonly roles = {
        everyone: SubtagTestContext.createApiRole({ id: snowflake.create().toString() }),
        command: SubtagTestContext.createApiRole({ id: snowflake.create().toString(), name: 'Command User' }),
        other: SubtagTestContext.createApiRole({ id: snowflake.create().toString(), name: 'Other User' }),
        bot: SubtagTestContext.createApiRole({ id: snowflake.create().toString(), name: 'Bot' })
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
        command: SubtagTestContext.createApiChannel({ id: snowflake.create().toString() })
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

    public constructor(subtags: Iterable<Subtag>) {
        this.logger = new Mock<Logger>(undefined, false);
        this.discordOptions = { intents: [] };
        this.discord = new Mock(Discord);
        this.cluster = new Mock(Cluster);
        this.shard = new Mock(Shard);
        this.shards = new Mock(ShardManager);
        this.database = new Mock(Database);
        this.timeouts = new Mock(TimeoutManager);
        this.tagVariablesTable = new Mock<TagVariablesTable>();
        this.guildTable = new Mock<GuildTable>();
        this.limit = new Mock<BaseRuntimeLimit>();
        this.tagVariables = {};
        this.options = {};

        const args = new Array(100).fill(argument.any()()) as unknown[];
        for (let i = 0; i < args.length; i++) {
            this.logger.setup(m => m.error(...args.slice(0, i))).thenCall((...args: unknown[]) => {
                throw new Error('Unexpected logger error: ' + inspect(args));
            });
        }

        this.cluster.setup(m => m.discord).thenReturn(this.discord.instance);
        this.cluster.setup(m => m.database).thenReturn(this.database.instance);
        this.cluster.setup(m => m.logger).thenReturn(this.logger.instance);
        this.cluster.setup(m => m.timeouts).thenReturn(this.timeouts.instance);
        this.cluster.setup(m => m.util).thenReturn(new ClusterUtilities(this.cluster.instance));

        this.database.setup(m => m.tagVariables).thenReturn(this.tagVariablesTable.instance);
        this.database.setup(m => m.guilds).thenReturn(this.guildTable.instance);
        this.tagVariablesTable.setup(m => m.get(anyString(), anyString(), anyString()))
            .thenCall((name: string, type: SubtagVariableType, scope: string) => this.tagVariables[`${type}.${scope}.${name}`]);

        this.discord.setup(m => m.shards).thenReturn(this.shards.instance);
        this.discord.setup(m => m.guildShardMap).thenReturn({});
        this.discord.setup(m => m.channelGuildMap).thenReturn({});
        this.discord.setup(m => m.options).thenReturn(this.discordOptions);
        this.discord.setup(m => m._formatImage(anything() as never)).thenCall((str: never) => Discord.prototype._formatImage.call(this.discord.instance, str));
        this.discord.setup(m => m._formatAllowedMentions(anything() as never)).thenCall((str: never) => Discord.prototype._formatImage.call(this.discord.instance, str));

        this.shards.setup(m => m.get(0)).thenReturn(this.shard.instance);
        this.shard.setup(m => m.client).thenReturn(this.discord.instance);

        this.discord.setup(m => m.guilds).thenReturn(new Collection(Guild));
        this.discord.setup(m => m.users).thenReturn(new Collection(User));

        const subtagLoader = new Mock<ModuleLoader<Subtag>>(ModuleLoader);
        const subtagMap = new Map([...subtags].flatMap(s => [s.name, ...s.aliases].map(n => [n, s])));
        subtagLoader.setup(m => m.get(anyString())).thenCall((name: string) => subtagMap.get(name));

        this.cluster.setup(c => c.subtags).thenReturn(subtagLoader.instance);
    }

    public createContext(): BBTagContext {
        const engine = new BBTagEngine(this.cluster.instance);

        const bot = new ExtendedUser(<BaseData><unknown>this.users.bot, this.discord.instance);
        this.discord.setup(m => m.user).thenReturn(bot);

        const guild = this.createGuild(this.guild);
        this.discord.instance.guilds.add(guild);

        for (const channel of guild.channels.values())
            this.discord.setup(m => m.getChannel(channel.id)).thenReturn(channel);

        const channel = guild.channels.find(guard.isTextableChannel);
        if (channel === undefined)
            throw new Error('No text channels were added');

        const message = this.createMessage<KnownGuildTextableChannel>(this.message);

        const context = new BBTagContext(engine, {
            author: message.author.id,
            inputRaw: '',
            isCC: false,
            limit: this.limit.instance,
            message: message,
            ...this.options
        });

        this.limit.setup(m => m.check(context, anyString())).thenResolve();

        Object.assign(context.scopes.root, this.rootScope);

        return context;
    }

    public createRESTError(code: number): DiscordRESTError {
        const request = new Mock(ClientRequest);
        const message = new Mock(IncomingMessage);
        const response = new Mock<HTTPResponse>();

        response.setup(m => m.code).thenReturn(code);

        const x = { stack: '' };
        Error.captureStackTrace(x);
        return new DiscordRESTError(request.instance, message.instance, response.instance, x.stack);
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
    if (data.assert !== undefined)
        suite.assert(data.assert);
    if (data.teardown !== undefined)
        suite.teardown(data.teardown);
    for (const testCase of data.cases)
        suite.addTestCase(testCase);
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
        const root = require.resolve('@config');
        fs.writeFileSync(path.dirname(root) + '/test.bbtag', blargTestSuite);
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

export class SubtagTestSuite<TestCase extends SubtagTestCase> {
    readonly #config: TestSuiteConfig<TestCase> = { setup: [], assert: [], teardown: [] };
    readonly #testCases: TestCase[] = [];
    readonly #subtag: Subtag;

    public constructor(subtag: Subtag) {
        this.#subtag = subtag;
    }

    public setup(setup: TestSuiteConfig<TestCase>['setup'][number]): this {
        this.#config.setup.push(setup);
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
            result += ` and return ${expected.toString()}`;
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
    const test = new SubtagTestContext(subtags);
    const actualTestCase = Object.create(testCase, { 'timestamp': { value: moment() } });

    try {
        // arrange
        for (const setup of config.setup)
            await setup.call(actualTestCase, test);
        await actualTestCase.setup?.(test);
        const code = bbtagUtil.parse(testCase.code);
        const context = test.createContext();
        const expected = getExpectation(testCase);

        // act
        const result = await context.eval(code);

        // assert
        switch (typeof expected) {
            case 'string':
                expect(result).to.equal(expected);
                break;
            case 'object':
                expect(result).to.match(expected);
                break;
        }

        await actualTestCase.assert?.(context, result, test);
        for (const assert of config.assert)
            await assert.call(actualTestCase, context, result, test);

        if (typeof testCase.errors === 'function') {
            testCase.errors(context.errors);
        } else {
            expect(context.errors.map(err => ({ error: err.error, start: err.subtag?.start, end: err.subtag?.end })))
                .excludingEvery('stack')
                .to.deep.equal(testCase.errors?.map(err => ({ error: err.error, start: sourceMarker(err.start), end: sourceMarker(err.end) })) ?? [],
                    'Error details didnt match the expectation');
        }

    } finally {
        for (const teardown of config.teardown)
            await teardown.call(actualTestCase, test);
    }
}

// eslint-disable-next-line @typescript-eslint/ban-types
function getExpectation(testCase: SubtagTestCase): Exclude<SubtagTestCase['expected'], Function> {
    if (typeof testCase.expected === 'function')
        return testCase.expected();
    return testCase.expected;
}
