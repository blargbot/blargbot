import { inspect } from 'node:util';

import type { BBTagContextOptions, BBTagRuntimeScope, BBTagUtilities, ChannelService, Entities, GuildService, InjectionContext, LocatedRuntimeError, MessageService, RoleService, SourceMarker, SubtagCall, SubtagDescriptor, UserService } from '@bbtag/blargbot';
import { BaseRuntimeLimit, BBTagContext, BBTagEngine, BBTagRuntimeError, createBBTagArrayTools, createBBTagJsonTools, createBBTagOperators, createEmbedParser, NotEnoughArgumentsError, parseBBTag, smartStringCompare, Subtag, SubtagType, TooManyArgumentsError } from '@bbtag/blargbot';
import { smartSplitRanges } from '@blargbot/core/utils/humanize/smartSplit.js';
import { repeat } from '@blargbot/core/utils/index.js';
import { parseBigInt } from '@blargbot/core/utils/parse/parseBigInt.js';
import { parseBoolean } from '@blargbot/core/utils/parse/parseBoolean.js';
import { parseColor } from '@blargbot/core/utils/parse/parseColor.js';
import { parseDuration } from '@blargbot/core/utils/parse/parseDuration.js';
import { parseFloat } from '@blargbot/core/utils/parse/parseFloat.js';
import { parseInt as bbtagParseInt } from '@blargbot/core/utils/parse/parseInt.js';
import { parseString } from '@blargbot/core/utils/parse/parseString.js';
import { parseTime } from '@blargbot/core/utils/parse/parseTime.js';
import { Database } from '@blargbot/database';
import { snowflake } from '@blargbot/discord-util';
import type { GuildCommandTag, StoredTag, TagVariableScope } from '@blargbot/domain/models/index.js';
import type { GuildStore, TagStore, TagVariableStore, UserStore } from '@blargbot/domain/stores/index.js';
import { createFlagParser } from '@blargbot/flags';
import type { Logger } from '@blargbot/logger';
import { argument, Mock } from '@blargbot/test-util/mock.js';
// import { argument, Mock } from '@blargbot/test-util/mock.js';
import { Timer } from '@blargbot/timer';
import chai from 'chai';
import chaiBytes from 'chai-bytes';
import chaiDateTime from 'chai-datetime';
import chaiExclude from 'chai-exclude';
import Discord from 'discord-api-types/v10';
import mocha from 'mocha';
import moment from 'moment-timezone';
import tsMockito from 'ts-mockito';

chai.use(chaiExclude);
chai.use(chaiBytes);
chai.use(chaiDateTime);

type SourceMarkerResolvable = SourceMarker | number | `${number}:${number}:${number}` | `${number}:${number}` | `${number}`;
type IdPropertiesOf<T> = { [P in AnyPropertyKey<T>]-?: [P, T[P]] extends [`${string}_id` | 'id', string] ? P : never }[AnyPropertyKey<T>];
type RequireIds<T, OtherProps extends AnyPropertyKey<T> = never> = T extends infer R ? RequiredProps<Partial<R>, IdPropertiesOf<R> | OtherProps> : never;

type RuntimeSubtagTestCase<T> = Readonly<T> & {
    readonly timestamp: moment.Moment;
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
    readonly subtags?: readonly SubtagDescriptor[];
    readonly skip?: boolean | (() => Awaitable<boolean>);
    readonly retries?: number;
    readonly timeout?: number;
    readonly setupSaveVariables?: boolean;
}

interface TestSuiteConfig<T extends SubtagTestCase> {
    readonly setup: Array<() => Awaitable<void>>;
    readonly teardown: Array<() => Awaitable<void>>;
    readonly setupEach: Array<(this: RuntimeSubtagTestCase<T>, context: SubtagTestContext) => Awaitable<void>>;
    readonly assertEach: Array<(this: RuntimeSubtagTestCase<T>, context: BBTagContext, result: string, test: SubtagTestContext) => Awaitable<void>>;
    readonly teardownEach: Array<(this: RuntimeSubtagTestCase<T>, context: SubtagTestContext) => Awaitable<void>>;
    readonly postSetupEach: Array<(this: RuntimeSubtagTestCase<T>, context: BBTagContext, mocks: SubtagTestContext) => Awaitable<void>>;
}

export class MarkerError extends BBTagRuntimeError {
    public constructor(type: string, index: number) {
        super(`{${type}} called at ${index}`);
        this.display = '';
    }
}

type SuiteEachSetup<T extends SubtagTestCase> = {
    readonly [P in 'setup' | 'teardown' | 'postSetup' | 'assert' as `${P}Each`]?: T[P]
}

export interface SubtagTestSuiteData<T extends Subtag = Subtag, TestCase extends SubtagTestCase = SubtagTestCase> extends SuiteEachSetup<TestCase> {
    readonly cases: TestCase[];
    readonly subtag: SubtagDescriptor<T>;
    readonly runOtherTests?: (subtag: SubtagDescriptor<T>) => void;
    readonly argCountBounds: { min: ArgCountBound; max: ArgCountBound; };
    readonly setup?: (this: void) => Awaitable<void>;
    readonly teardown?: (this: void) => Awaitable<void>;
}

type ArgCountBound = number | { count: number; noEval: number[]; };

const createSnowflake = snowflake.nextFactory();

/* eslint-disable @typescript-eslint/naming-convention */
export class SubtagTestContext {
    readonly #allMocks: Array<Mock<unknown>> = [];
    #isCreated = false;
    public readonly timer = new Timer();
    public readonly dependencies = this.createMock<InjectionContext>();
    public readonly util = this.createMock<BBTagUtilities>();
    public readonly logger = this.createMock<Logger>(undefined, false);
    public readonly database = this.createMock(Database);
    public readonly tagVariablesTable = this.createMock<TagVariableStore>();
    public readonly tagsTable = this.createMock<TagStore>();
    public readonly guildTable = this.createMock<GuildStore>();
    public readonly userTable = this.createMock<UserStore>();
    public readonly limit = this.createMock(BaseRuntimeLimit);
    public readonly channelService = this.createMock<ChannelService>();
    public readonly roleService = this.createMock<RoleService>();
    public readonly userService = this.createMock<UserService>();
    public readonly guildService = this.createMock<GuildService>();
    public readonly messageService = this.createMock<MessageService>();
    public isStaff = false;
    public readonly ownedMessages: string[] = [];

    public readonly ccommands: Record<string, GuildCommandTag>;
    public readonly tags: Record<string, StoredTag>;
    public readonly tagVariables: MapByValue<{ scope: TagVariableScope; name: string; }, JToken>;
    public readonly rootScope: BBTagRuntimeScope = { functions: {}, inLock: false, isTag: true };

    public readonly options: Mutable<Partial<BBTagContextOptions>>;

    public readonly roles = {
        everyone: SubtagTestContext.createRole({ id: createSnowflake() }),
        top: SubtagTestContext.createRole({ id: createSnowflake(), position: 5, name: 'Top Role' }),
        command: SubtagTestContext.createRole({ id: createSnowflake(), position: 3, name: 'Command User' }),
        authorizer: SubtagTestContext.createRole({ id: createSnowflake(), position: 4, name: 'Command Authorizer' }),
        other: SubtagTestContext.createRole({ id: createSnowflake(), position: 2, name: 'Other User' }),
        bot: SubtagTestContext.createRole({ id: createSnowflake(), position: 1, name: 'Bot' })
    };

    public readonly users = {
        owner: SubtagTestContext.createMember({ id: createSnowflake(), username: 'Guild owner', member: { roles: [this.roles.everyone.id] } }),
        command: SubtagTestContext.createMember({ id: createSnowflake(), username: 'Command User', member: { roles: [this.roles.everyone.id, this.roles.command.id] } }),
        authorizer: SubtagTestContext.createMember({ id: createSnowflake(), username: 'Command Authorizer', member: { roles: [this.roles.everyone.id, this.roles.authorizer.id] } }),
        other: SubtagTestContext.createMember({ id: createSnowflake(), username: 'Other user', member: { roles: [this.roles.everyone.id, this.roles.other.id] } }),
        bot: SubtagTestContext.createMember({
            id: '134133271750639616',
            username: 'blargbot',
            discriminator: '0128',
            member: {
                roles: [this.roles.everyone.id, this.roles.bot.id]
            }
        })
    };

    public readonly channels = {
        command: SubtagTestContext.createChannel({ id: createSnowflake(), type: Discord.ChannelType.GuildText, name: 'commands' }),
        general: SubtagTestContext.createChannel({ id: createSnowflake(), type: Discord.ChannelType.GuildText, name: 'general' })
    } as {
        command: Extract<Discord.APIChannel, { guild_id?: Discord.Snowflake; }>;
        general: Extract<Discord.APIChannel, { guild_id?: Discord.Snowflake; }>;
        [name: string]: Extract<Discord.APIChannel, { guild_id?: Discord.Snowflake; }>;
    };

    public readonly guild = SubtagTestContext.createGuild(
        {
            id: this.roles.everyone.id,
            owner_id: this.users.owner.id,
            roles: Object.values(this.roles)
        }
    );

    public readonly message: Entities.Message = SubtagTestContext.createMessage({
        id: createSnowflake(),
        author: this.users.command,
        channel_id: this.channels.command.id
    }, this.users.command);

    public constructor(public readonly testCase: SubtagTestCase, subtags: Iterable<SubtagDescriptor>) {
        this.tagVariables = new MapByValue();
        this.tags = {};
        this.ccommands = {};
        this.options = { tagName: `testTag_${createSnowflake()}` };

        const args = new Array(100).fill(argument.any().value) as unknown[];
        for (let i = 0; i < args.length; i++) {
            this.logger.setup(m => m.error(...args.slice(0, i)), false).thenCall((...args: unknown[]) => {
                throw args.find(x => x instanceof Error) ?? new Error(`Unexpected logger error: ${inspect(args)}`);
            });
        }

        const bbtagArrayTools = createBBTagArrayTools({
            convertToInt: parseInt
        });

        this.dependencies.setup(m => m.database, false).thenReturn(this.database.instance);
        this.dependencies.setup(m => m.logger, false).thenReturn(this.logger.instance);
        this.dependencies.setup(m => m.util, false).thenReturn(this.util.instance);
        this.dependencies.setup(m => m.arrayTools, false).thenReturn(bbtagArrayTools);
        this.dependencies.setup(m => m.services, false).thenReturn({
            channel: this.channelService.instance,
            message: this.messageService.instance,
            role: this.roleService.instance,
            user: this.userService.instance,
            guild: this.guildService.instance
        });
        this.dependencies.setup(m => m.jsonTools, false).thenReturn(createBBTagJsonTools({
            convertToInt: bbtagParseInt,
            isTagArray: bbtagArrayTools.isTagArray
        }));
        this.dependencies.setup(m => m.operators, false).thenReturn(createBBTagOperators({
            compare: smartStringCompare,
            convertToString: parseString,
            parseArray: v => bbtagArrayTools.deserialize(v)?.v
        }));
        this.dependencies.setup(m => m.parseFlags, false).thenReturn(createFlagParser({
            splitter: smartSplitRanges
        }));
        this.dependencies.setup(m => m.converter, false).thenReturn({
            int: bbtagParseInt,
            float: parseFloat,
            string: parseString,
            boolean: parseBoolean,
            duration: parseDuration,
            embed: createEmbedParser({
                convertToColor: parseColor,
                convertToNumber: bbtagParseInt
            }),
            bigInt: parseBigInt,
            color: parseColor,
            time: parseTime
        });

        this.database.setup(m => m.tagVariables, false).thenReturn(this.tagVariablesTable.instance);
        this.database.setup(m => m.guilds, false).thenReturn(this.guildTable.instance);
        this.database.setup(m => m.users, false).thenReturn(this.userTable.instance);
        this.database.setup(m => m.tags, false).thenReturn(this.tagsTable.instance);

        this.tagVariablesTable.setup(m => m.get(argument.isTypeof('string').value, tsMockito.anything() as never), false)
            .thenCall((...[name, scope]: Parameters<TagVariableStore['get']>) => this.tagVariables.get({ scope, name }));
        if (this.testCase.setupSaveVariables !== false) {
            this.tagVariablesTable.setup(m => m.upsert(tsMockito.anything() as never, tsMockito.anything() as never), false)
                .thenCall((...[values, scope]: Parameters<TagVariableStore['upsert']>) => {
                    for (const [name, value] of Object.entries(values)) {
                        if (value !== undefined)
                            this.tagVariables.set({ scope, name }, value);
                        else
                            this.tagVariables.delete({ scope, name });
                    }
                });
        }

        this.tagsTable.setup(m => m.get(argument.isTypeof('string').value), false)
            .thenCall((...args: Parameters<TagStore['get']>) => this.tags[args[0]]);
        this.guildTable.setup(m => m.getCommand(this.guild.id, argument.isTypeof('string').value), false)
            .thenCall((...args: Parameters<GuildStore['getCommand']>) => this.ccommands[args[1]]);

        this.dependencies.setup(c => c.subtags, false).thenReturn(subtags);
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

        const context = new BBTagContext(engine, {
            bot: this.users.bot,
            authorizer: this.users.authorizer,
            user: this.users.command,
            isStaff: this.isStaff,
            channel: this.channels.command,
            guild: this.guild,
            authorId: this.message.author.id,
            inputRaw: '',
            isCC: false,
            limit: this.limit.instance,
            message: this.message,
            ...this.options
        });

        this.userService.setup(m => m.querySingle(context, ''), false).thenResolve(this.users.command);
        this.userService.setup(m => m.querySingle(context, '', argument.any().value as undefined), false).thenResolve(this.users.command);
        this.userService.setup(m => m.querySingle(context, this.users.command.id), false).thenResolve(this.users.command);
        this.userService.setup(m => m.querySingle(context, this.users.command.id, argument.any().value as undefined), false).thenResolve(this.users.command);
        this.channelService.setup(m => m.querySingle(context, ''), false).thenResolve(this.channels.command);
        this.channelService.setup(m => m.querySingle(context, '', argument.any().value as undefined), false).thenResolve(this.channels.command);
        this.channelService.setup(m => m.querySingle(context, this.channels.command.id), false).thenResolve(this.channels.command);
        this.channelService.setup(m => m.querySingle(context, this.channels.command.id, argument.any().value as undefined), false).thenResolve(this.channels.command);
        this.messageService.setup(m => m.get(context, this.channels.command.id, ''), false).thenResolve(this.message);
        this.messageService.setup(m => m.get(context, this.channels.command.id, this.message.id), false).thenResolve(this.message);

        context.data.ownedMsgs.push(...this.ownedMessages);
        Object.assign(context.scopes.root, this.rootScope);

        return context;
    }

    public static createMessage(settings: RequireIds<Entities.Message>, author: Discord.APIUser): Entities.Message {
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
            type: Discord.MessageType.Default,
            ...settings
        };
    }

    public static createUser(settings: RequireIds<Entities.User>): Entities.User {
        return {
            avatar: null,
            discriminator: '0000',
            username: 'Test User',
            ...settings
        };
    }

    public static createMember(settings: RequireIds<Omit<Entities.User, 'member'>> & { member?: Partial<Entities.Member>; }): RequiredProps<Entities.User, 'member'> {
        return {
            avatar: null,
            discriminator: '0000',
            username: 'Test User',
            ...settings,
            member: {
                activities: [],
                deaf: false,
                joined_at: new Date().toISOString(),
                mute: false,
                roles: [],
                ...settings.member
            }
        };
    }

    public static createRole(settings: RequireIds<Entities.Role>): Entities.Role {
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

    public static createGuild(settings: RequireIds<Entities.Guild>): RequiredProps<Entities.Guild, 'roles'> {
        return {
            afk_channel_id: null,
            afk_timeout: 60,
            application_id: null,
            banner: null,
            default_message_notifications: 0,
            description: null,
            discovery_splash: null,
            emojis: [],
            explicit_content_filter: 0,
            features: [],
            icon: null,
            mfa_level: 0,
            name: 'Test Guild',
            nsfw_level: 0,
            preferred_locale: 'en-US',
            premium_progress_bar_enabled: false,
            premium_tier: 0,
            roles: [
                this.createRole({ id: settings.id })
            ],
            public_updates_channel_id: null,
            rules_channel_id: null,
            splash: null,
            stickers: [],
            system_channel_flags: 0,
            system_channel_id: null,
            vanity_url_code: null,
            verification_level: 0,
            region: '',
            hub_type: null,
            ...settings
        };
    }

    public static createChannel<T extends Entities.Channel>(settings: RequireIds<T>): T {
        return {
            name: 'Test Channel',
            position: 0,
            permission_overwrites: [],
            nsfw: false,
            topic: 'Test channel!',
            ...settings
        } as T;
    }
}
/* eslint-enable @typescript-eslint/naming-convention */

export function createDescriptor<T extends Subtag>(subtag: T): SubtagDescriptor<T> {
    return {
        name: subtag.name,
        aliases: subtag.aliases,
        createInstance: () => subtag
    };
}

export function runSubtagTests<T extends Subtag>(data: SubtagTestSuiteData<T>): void
export function runSubtagTests<T extends Subtag, TestCase extends SubtagTestCase>(data: SubtagTestSuiteData<T, TestCase>): void
export function runSubtagTests<T extends Subtag, TestCase extends SubtagTestCase>(data: SubtagTestSuiteData<T, TestCase>): void {
    const suite = new SubtagTestSuite(data.subtag);
    if (data.setup !== undefined)
        suite.setup(data.setup);
    if (data.teardown !== undefined)
        suite.teardown(data.teardown);
    if (data.setupEach !== undefined)
        suite.setupEach(data.setupEach);
    if (data.teardownEach !== undefined)
        suite.teardownEach(data.teardownEach);
    if (data.assertEach !== undefined)
        suite.assertEach(data.assertEach);
    if (data.postSetupEach !== undefined)
        suite.postSetupEach(data.postSetupEach);

    const min = typeof data.argCountBounds.min === 'number' ? { count: data.argCountBounds.min, noEval: [] } : data.argCountBounds.min;
    const max = typeof data.argCountBounds.max === 'number' ? { count: data.argCountBounds.max, noEval: [] } : data.argCountBounds.max;

    suite.addTestCases(notEnoughArgumentsTestCases(data.subtag.name, min.count, min.noEval));
    suite.addTestCases(data.cases);
    if (max.count < Infinity)
        suite.addTestCases(tooManyArgumentsTestCases(data.subtag.name, max.count, max.noEval));

    suite.run(() => data.runOtherTests?.(data.subtag));
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

@Subtag.names('testdata')
export class TestDataSubtag extends Subtag {
    public constructor(public readonly values: Record<string, string | undefined>) {
        super({
            category: SubtagType.SIMPLE,
            signatures: []
        });
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

@Subtag.ctorArgs()
@Subtag.names('eval')
export class EvalSubtag extends Subtag {
    public constructor() {
        super({
            category: SubtagType.SIMPLE,
            hidden: true,
            signatures: []
        });
    }

    protected executeCore(_context: BBTagContext, _subtagName: string, subtag: SubtagCall): never {
        throw new MarkerError('eval', subtag.start.index);
    }
}

@Subtag.names('assert')
export class AssertSubtag extends Subtag {
    readonly #assertion: (context: BBTagContext, subtagName: string, subtag: SubtagCall) => Awaitable<string>;

    public constructor(assertion: (...args: Parameters<Subtag['executeCore']>) => Awaitable<string>) {
        super({
            category: SubtagType.SIMPLE,
            hidden: true,
            signatures: []
        });

        this.#assertion = assertion;
    }

    protected async * executeCore(context: BBTagContext, subtagName: string, subtag: SubtagCall): AsyncIterable<string> {
        yield await this.#assertion(context, subtagName, subtag);
    }
}

@Subtag.ctorArgs()
@Subtag.names('fail')
export class FailTestSubtag extends Subtag {
    public constructor() {
        super({
            category: SubtagType.SIMPLE,
            signatures: [],
            hidden: true
        });
    }

    public executeCore(_context: BBTagContext, _subtagName: string, subtag: SubtagCall): never {
        throw new RangeError(`Subtag ${subtag.source} was evaluated when it wasnt supposed to!`);
    }
}

@Subtag.names('limit')
export class LimitedTestSubtag extends Subtag {
    readonly #counts = new WeakMap<BBTagContext, number>();
    readonly #limit: number;

    public constructor(limit = 1) {
        super({
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

@Subtag.ctorArgs()
@Subtag.names('echoargs')
export class EchoArgsSubtag extends Subtag {
    public constructor() {
        super({
            category: SubtagType.SIMPLE,
            hidden: true,
            signatures: []
        });
    }

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

export class SubtagTestSuite<TestCase extends SubtagTestCase> {
    readonly #config: TestSuiteConfig<TestCase> = { setup: [], teardown: [], setupEach: [], assertEach: [], postSetupEach: [], teardownEach: [] };
    readonly #testCases: TestCase[] = [];
    readonly #subtag: SubtagDescriptor;

    public constructor(subtag: SubtagDescriptor) {
        this.#subtag = subtag;
    }

    public setup(setup: TestSuiteConfig<TestCase>['setup'][number]): this {
        this.#config.setup.push(setup);
        return this;
    }

    public teardown(teardown: TestSuiteConfig<TestCase>['teardown'][number]): this {
        this.#config.teardown.push(teardown);
        return this;
    }
    public setupEach(setupEach: TestSuiteConfig<TestCase>['setupEach'][number]): this {
        this.#config.setupEach.push(setupEach);
        return this;
    }

    public teardownEach(teardownEach: TestSuiteConfig<TestCase>['teardownEach'][number]): this {
        this.#config.teardownEach.push(teardownEach);
        return this;
    }
    public assertEach(assertEach: TestSuiteConfig<TestCase>['assertEach'][number]): this {
        this.#config.assertEach.push(assertEach);
        return this;
    }

    public postSetupEach(postSetupEach: TestSuiteConfig<TestCase>['postSetupEach'][number]): this {
        this.#config.postSetupEach.push(postSetupEach);
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
        const suite = mocha.describe(`{${this.#subtag.name}}`, () => {
            const subtag = this.#subtag;
            const config = this.#config;
            for (const testCase of this.#testCases) {
                const test = mocha.it(getTestName(testCase), function () {
                    return runTestCase(this, subtag, testCase, config);
                });
                if (testCase.retries !== undefined)
                    test.retries(testCase.retries);
                if (testCase.timeout !== undefined)
                    test.timeout(testCase.timeout);
            }

            otherTests?.();
        });
        suite.beforeAll(async () => {
            for (const setup of this.#config.setup)
                await setup();
        });
        suite.afterAll(async () => {
            for (const teardown of this.#config.teardown)
                await teardown();
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
            const errorStr = errorCount === 0 ? undefined : `${errorCount} error(s)`;
            const markerStr = markerCount === 0 ? undefined : `${markerCount} marker(s)`;
            result += ` with ${[markerStr, errorStr].filter(x => x !== undefined).join(' and ')}`;
        }
    }

    if (testCase.title !== undefined)
        result += ` - ${testCase.title}`;

    return result;
}

async function runTestCase<TestCase extends SubtagTestCase>(context: mocha.Context, subtag: SubtagDescriptor, testCase: TestCase, config: TestSuiteConfig<TestCase>): Promise<void> {
    if (typeof testCase.skip === 'boolean' ? testCase.skip : await testCase.skip?.() ?? false)
        context.skip();

    const subtags = [subtag, Subtag.getDescriptor(EvalSubtag), Subtag.getDescriptor(FailTestSubtag), ...testCase.subtags ?? []];
    const test = new SubtagTestContext(testCase, subtags);
    const actualTestCase = Object.create(testCase, { 'timestamp': { value: moment() } });

    try {
        // arrange
        for (const s of subtags)
            test.limit.setup(m => m.check(argument.isInstanceof(BBTagContext).value, s.name), s === subtag).thenResolve(undefined);
        for (const setup of config.setupEach)
            await setup.call(actualTestCase, test);
        await actualTestCase.setup?.(test);
        const code = parseBBTag(testCase.code);
        const context = test.createContext();
        for (const postSetup of config.postSetupEach)
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
                chai.expect(result.value).to.equal(expected);
                break;
            case 'object':
                chai.expect(result.value).to.match(expected);
                break;
        }

        await actualTestCase.assert?.(context, result.value, test);
        for (const assert of config.assertEach)
            await assert.call(actualTestCase, context, result.value, test);

        if (typeof testCase.errors === 'function') {
            testCase.errors(context.errors);
        } else {
            chai.expect(context.errors.map(err => ({ error: err.error, start: err.subtag?.start, end: err.subtag?.end })))
                .excludingEvery('stack')
                .to.deep.equal(testCase.errors?.map(err => ({ error: err.error, start: sourceMarker(err.start), end: sourceMarker(err.end) })) ?? [],
                    'Error details didnt match the expectation');
        }
        test.verifyAll();
    } finally {
        for (const teardown of config.teardownEach)
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
            chai.expect(err.map(x => x.error.constructor)).to.not.have.members([NotEnoughArgumentsError, TooManyArgumentsError]);
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
            chai.expect(err.map(x => x.error.constructor)).to.not.have.members([NotEnoughArgumentsError, TooManyArgumentsError]);
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

class MapByValue<Key, Value> implements Map<Key, Value> {
    #inner: Map<unknown, Value>;

    public readonly [Symbol.toStringTag] = '';
    public get size(): number {
        return this.#inner.size;
    }

    public constructor(args?: Iterable<[Key, Value]>) {
        this.#inner = new Map();
        if (args !== undefined)
            for (const entry of args)
                this.set(...entry);
    }

    #fromKey(key: Key): unknown {
        switch (typeof key) {
            case 'object': return key === null
                ? null
                : JSON.stringify(Object.entries(key).sort((a, b) => a[0] < b[0] ? 1 : -1).map(x => [x[0], this.#fromKey(x[1])]));
            case 'string':
                return JSON.stringify(key);
            default:
                return key;
        }
    }

    #toKey(key: unknown): Key {
        return typeof key === 'string'
            ? JSON.parse(key) as Key
            : key as Key;
    }

    public clear(): void {
        this.#inner.clear();
    }
    public delete(key: Key): boolean {
        return this.#inner.delete(this.#fromKey(key));
    }
    public forEach(callbackfn: (value: Value, key: Key, map: Map<Key, Value>) => void, thisArg?: unknown): void {
        for (const entry of this)
            callbackfn.call(thisArg, entry[1], entry[0], this);
    }
    public get(key: Key): Value | undefined {
        return this.#inner.get(this.#fromKey(key));
    }
    public has(key: Key): boolean {
        return this.#inner.has(this.#fromKey(key));
    }
    public set(key: Key, value: Value): this {
        this.#inner.set(this.#fromKey(key), value);
        return this;
    }
    public * entries(): IterableIterator<[Key, Value]> {
        for (const entry of this.#inner)
            yield [this.#toKey(entry[0]), entry[1]];
    }
    public * keys(): IterableIterator<Key> {
        for (const key of this.#inner.keys())
            yield this.#toKey(key);
    }
    public * values(): IterableIterator<Value> {
        for (const value of this.#inner.values())
            yield value;
    }
    public [Symbol.iterator](): IterableIterator<[Key, Value]> {
        return this.entries();
    }

}
