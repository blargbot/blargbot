import { inspect } from 'node:util';

import type { BBTagArray, BBTagArrayTools, BBTagRuntimeConfig, BBTagRuntimeScope, BBTagScope, BBTagScript, BBTagScriptOptions, BBTagValueConverter, CooldownService, Entities, InjectionContext, LocatedRuntimeError, SourceProvider, SubtagDescriptor, VariablesStore } from '@bbtag/blargbot';
import { BaseRuntimeLimit, BBTagRuntime, BBTagRuntimeError, createBBTagArrayTools, createBBTagJsonTools, createBBTagOperators, createValueConverter, InternalServerError, NotEnoughArgumentsError, smartStringCompare, Subtag, SubtagType, tagVariableScopeProviders, TooManyArgumentsError } from '@bbtag/blargbot';
import type { SourceMarker } from '@bbtag/language';
import type { IVariableStore } from '@bbtag/variables';
import { VariableNameParser, VariableProvider } from '@bbtag/variables';
import Discord from '@blargbot/discord-types';
import snowflake from '@blargbot/snowflakes';
import { argument, Mock } from '@blargbot/test-util/mock.js';
import { Timer } from '@blargbot/timer';
import chai from 'chai';
import chaiBytes from 'chai-bytes';
import chaiDateTime from 'chai-datetime';
import chaiExclude from 'chai-exclude';
import mocha from 'mocha';
import tsMockito from 'ts-mockito';

import type { BBTagCall } from '../../src/BBTagCall.js';

chai.use(chaiExclude);
chai.use(chaiBytes);
chai.use(chaiDateTime);

type SourceMarkerResolvable = SourceMarker | number | `${number}:${number}:${number}` | `${number}:${number}` | `${number}`;
type IdPropertiesOf<T> = { [P in AnyPropertyKey<T>]-?: [P, T[P]] extends [`${string}_id` | 'id', string] ? P : never }[AnyPropertyKey<T>];
type RequireIds<T, OtherProps extends AnyPropertyKey<T> = never> = T extends infer R ? RequiredProps<Partial<R>, IdPropertiesOf<R> | OtherProps> : never;

export interface SubtagTestCase {
    readonly title?: string;
    readonly code: string;
    readonly subtagName?: string;
    readonly expected?: string | RegExp | (() => string | RegExp);
    readonly setup?: (this: this, context: SubtagTestContext) => Awaitable<void>;
    readonly postSetup?: (this: this, context: BBTagScript, mocks: SubtagTestContext) => Awaitable<void>;
    readonly assert?: (this: this, context: BBTagScript, result: string, test: SubtagTestContext) => Awaitable<void>;
    readonly teardown?: (this: this, context: SubtagTestContext) => Awaitable<void>;
    readonly expectError?: {
        required?: boolean;
        handle: (error: unknown) => Awaitable<void>;
    };
    readonly errors?: ReadonlyArray<{ start?: SourceMarkerResolvable; end?: SourceMarkerResolvable; error: BBTagRuntimeError; }> | ((errors: LocatedRuntimeError[]) => void);
    readonly subtags?: ReadonlyArray<new (...args: never) => Subtag>;
    readonly skip?: boolean | (() => Awaitable<boolean>);
    readonly retries?: number;
    readonly timeout?: number;
    readonly setupSaveVariables?: boolean;
}

interface TestSuiteConfig<T extends SubtagTestCase> {
    readonly setup: Array<() => Awaitable<void>>;
    readonly teardown: Array<() => Awaitable<void>>;
    readonly setupEach: Array<(this: T, context: SubtagTestContext) => Awaitable<void>>;
    readonly assertEach: Array<(this: T, context: BBTagScript, result: string, test: SubtagTestContext) => Awaitable<void>>;
    readonly teardownEach: Array<(this: T, context: SubtagTestContext) => Awaitable<void>>;
    readonly postSetupEach: Array<(this: T, context: BBTagScript, mocks: SubtagTestContext) => Awaitable<void>>;
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
    readonly subtag: new (...args: never) => T;
    readonly runOtherTests?: (subtag: new (...args: never) => T) => void;
    readonly argCountBounds: { min: ArgCountBound; max: ArgCountBound; };
    readonly setup?: (this: void) => Awaitable<void>;
    readonly teardown?: (this: void) => Awaitable<void>;
}

type ArgCountBound = number | { count: number; noEval: number[]; };

const createSnowflake = snowflake.nextFactory().create;

/* eslint-disable @typescript-eslint/naming-convention */
export class SubtagTestContext {
    readonly #allMocks: Array<Mock<unknown>> = [];
    #isCreated = false;
    public readonly timer = new Timer();
    public readonly code: string;
    public readonly subtags: Array<new (...args: never) => Subtag>;
    public readonly variables = this.createMock<IVariableStore<BBTagScope>>();
    public readonly cooldowns = this.createMock<CooldownService>();
    public readonly sources = this.createMock<SourceProvider>();
    get #converter(): BBTagValueConverter {
        return this.inject.converter;
    }
    get #arrayTools(): BBTagArrayTools {
        return this.inject.arrayTools;
    }
    public readonly inject = {
        converter: createValueConverter({
            colors: {
                blue: 0x0000ff,
                green: 0x008001,
                red: 0xff0000
            },
            regexMaxLength: 2000
        }),
        arrayTools: createBBTagArrayTools({
            convertToInt: v => this.#converter.int(v)
        }),
        operators: createBBTagOperators({
            compare: smartStringCompare,
            convertToString: v => this.#converter.string(v),
            parseArray: v => this.#arrayTools.deserialize(v)?.v
        }),
        jsonTools: createBBTagJsonTools({
            convertToInt: v => this.#converter.int(v),
            isTagArray: (v): v is BBTagArray => this.#arrayTools.isTagArray(v)
        }),
        users: this.createMock(),
        channels: this.createMock(),
        guild: this.createMock(),
        roles: this.createMock(),
        lock: this.createMock(),
        messages: this.createMock(),
        timezones: this.createMock(),
        warnings: this.createMock(),
        modLog: this.createMock(),
        dump: this.createMock(),
        defer: this.createMock(),
        staff: this.createMock(),
        logger: this.createMock(),
        fetch: this.createMock()
    } satisfies { [P in keyof InjectionContext]-?: Mock<NonNullable<InjectionContext[P]>> | InjectionContext[P] };
    public readonly limit = this.createMock(BaseRuntimeLimit);
    public isStaff = false;
    public readonly ownedMessages: string[] = [];

    public readonly ccommands: Record<string, { content: string; cooldown: number; }>;
    public readonly tags: Record<string, { content: string; cooldown: number; }>;
    public readonly tagVariables: MapByValue<{ scope: BBTagScope; name: string; }, JToken>;
    public readonly rootScope: BBTagRuntimeScope = { inLock: false };

    public readonly options: Mutable<Partial<Omit<BBTagRuntimeConfig, 'entrypoint'>>>;
    public readonly entrypoint: Mutable<Partial<BBTagScriptOptions>>;

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

    public constructor(public readonly testCase: SubtagTestCase, subtags: Iterable<new (...args: never) => Subtag>, code: string) {
        this.tagVariables = new MapByValue();
        this.tags = {};
        this.ccommands = {};
        this.options = {};
        this.entrypoint = {};
        this.code = code;

        const args = new Array(100).fill(argument.any().value) as unknown[];
        for (let i = 0; i < args.length; i++) {
            this.inject.logger.setup(m => m.error(...args.slice(0, i)), false).thenCall((...args: unknown[]) => {
                throw args.find(x => x instanceof Error) ?? new Error(`Unexpected logger error: ${inspect(args)}`);
            });
        }

        this.limit.setup(m => m.id).thenReturn('tagLimit');
        this.variables.setup(m => m.get(tsMockito.anything() as never, tsMockito.anything() as never), false)
            .thenCall((...[scope, name]: Parameters<VariablesStore['get']>) => this.tagVariables.get({ scope, name }));
        if (this.testCase.setupSaveVariables !== false) {
            this.variables.setup(m => m.set(tsMockito.anything() as never), false)
                .thenCall((...[values]: Parameters<IVariableStore<BBTagScope>['set']>) => {
                    for (const { name, scope, value } of values) {
                        if (value !== undefined)
                            this.tagVariables.set({ scope, name }, value);
                        else
                            this.tagVariables.delete({ scope, name });
                    }
                });
        }

        this.subtags = [...subtags];
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

    public createRuntime(): BBTagRuntime {
        if (this.#isCreated)
            throw new Error('Cannot create multiple contexts from 1 mock');
        this.#isCreated = true;

        const injectionContext = Object.fromEntries(
            Object.entries(this.inject)
                .map(([key, val]) => [key, val instanceof Mock ? val.instance : val])
        ) as InjectionContext;

        const runtime = new BBTagRuntime({
            ...injectionContext,
            subtags: this.subtags.map(s => Subtag.createInstance(s, injectionContext)),
            cooldowns: this.cooldowns.instance,
            variables: new VariableProvider(new VariableNameParser(tagVariableScopeProviders), this.variables.instance),
            sources: this.sources.instance,
            middleware: []
        }, {
            authorId: this.message.author.id,
            authorizer: this.users.authorizer,
            bot: this.users.bot,
            channel: this.channels.command,
            guild: this.guild,
            type: 'tag',
            isStaff: this.isStaff,
            limit: this.limit.instance,
            message: this.message,
            prefix: 'b!',
            silent: false,
            get allowMentions() {
                return this.type !== 'tag';
            },
            get isTrusted() {
                return this.type !== 'tag';
            },
            user: this.users.command,
            ...this.options,
            entrypoint: {
                flags: [],
                inputRaw: '',
                name: `testTag_${createSnowflake()}`,
                source: this.code,
                cooldownMs: 0,
                ...this.entrypoint
            },
            locale: 'en-GB',
            lookupCount: 0,
            queryCache: {
                channel: {},
                role: {},
                user: {},
                ...this.options.queryCache
            }
        });

        this.inject.users.setup(m => m.querySingle(runtime, ''), false).thenResolve(this.users.command);
        this.inject.users.setup(m => m.querySingle(runtime, '', argument.any().value as undefined), false).thenResolve(this.users.command);
        this.inject.users.setup(m => m.querySingle(runtime, this.users.command.id), false).thenResolve(this.users.command);
        this.inject.users.setup(m => m.querySingle(runtime, this.users.command.id, argument.any().value as undefined), false).thenResolve(this.users.command);
        this.inject.channels.setup(m => m.querySingle(runtime, ''), false).thenResolve(this.channels.command);
        this.inject.channels.setup(m => m.querySingle(runtime, '', argument.any().value as undefined), false).thenResolve(this.channels.command);
        this.inject.channels.setup(m => m.querySingle(runtime, this.channels.command.id), false).thenResolve(this.channels.command);
        this.inject.channels.setup(m => m.querySingle(runtime, this.channels.command.id, argument.any().value as undefined), false).thenResolve(this.channels.command);
        this.inject.messages.setup(m => m.get(runtime, this.channels.command.id, ''), false).thenResolve(this.message);
        this.inject.messages.setup(m => m.get(runtime, this.channels.command.id, this.message.id), false).thenResolve(this.message);
        this.sources.setup(m => m.get(runtime, 'tag', argument.isTypeof('string').value), false)
            .thenCall((...args: Parameters<SourceProvider['get']>) => this.tags[args[2]]);
        this.sources.setup(m => m.get(runtime, 'cc', argument.isTypeof('string').value), false)
            .thenCall((...args: Parameters<SourceProvider['get']>) => this.ccommands[args[2]]);

        for (const id of this.ownedMessages)
            runtime.ownedMessageIds.add(id);
        Object.assign(runtime.scopes.root, this.rootScope);

        return runtime;
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
                flags: 0,
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

    const descriptor = Subtag.getDescriptor(data.subtag);
    suite.addTestCases(notEnoughArgumentsTestCases(descriptor.id, min.count, min.noEval));
    suite.addTestCases(data.cases);
    if (max.count < Infinity)
        suite.addTestCases(tooManyArgumentsTestCases(descriptor.id, max.count, max.noEval));

    suite.run(() => data.runOtherTests?.(data.subtag));
}

function sourceMarker(location: SourceMarkerResolvable): SourceMarker
function sourceMarker(location: SourceMarkerResolvable | undefined): SourceMarker | undefined
function sourceMarker(location: SourceMarkerResolvable | undefined): SourceMarker | undefined {
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

export function makeTestDataSubtag(values: Record<string, string | undefined>): new (...args: never) => Subtag {
    @Subtag.id('testdata')
    @Subtag.ctorArgs()
    class TestDataSubtag extends Subtag {
        public constructor() {
            super({
                category: SubtagType.SIMPLE,
                signatures: []
            });
        }

        public override async execute(_: unknown, __: unknown, subtag: BBTagCall): Promise<string> {
            if (subtag.args.length !== 1)
                throw new RangeError(`Subtag ${this.id} must be given 1 argument!`);
            const key = subtag.args[0].ast.source;
            const value = values[key];
            if (value === undefined)
                throw new RangeError(`Subtag ${this.id} doesnt have test data set up for ${JSON.stringify(value)}`);

            await Promise.resolve();
            return value;
        }
    }
    return TestDataSubtag;
}

@Subtag.id('eval')
@Subtag.ctorArgs()
export class EvalSubtag extends Subtag {
    public constructor() {
        super({
            category: SubtagType.SIMPLE,
            hidden: true,
            signatures: []
        });
    }

    public override execute(_context: BBTagScript, _subtagName: string, subtag: BBTagCall): never {
        throw new MarkerError('eval', subtag.ast.start.index);
    }
}

export function makeAssertSubtag(assertion: (...args: Parameters<Subtag['execute']>) => Awaitable<string>): new () => Subtag {
    @Subtag.id('assert')
    @Subtag.ctorArgs()
    class AssertSubtag extends Subtag {
        public constructor() {
            super({
                category: SubtagType.SIMPLE,
                hidden: true,
                signatures: []
            });
        }

        public override async execute(context: BBTagScript, subtagName: string, subtag: BBTagCall): Promise<string> {
            return await assertion(context, subtagName, subtag);
        }
    }
    return AssertSubtag;
}

@Subtag.id('fail')
@Subtag.ctorArgs()
export class FailTestSubtag extends Subtag {
    public constructor() {
        super({
            category: SubtagType.SIMPLE,
            signatures: [],
            hidden: true
        });
    }

    public override execute(_context: BBTagScript, _subtagName: string, subtag: BBTagCall): never {
        throw new RangeError(`Subtag ${subtag.ast.source} was evaluated when it wasnt supposed to!`);
    }
}

@Subtag.id('limit')
export class LimitedTestSubtag extends Subtag {
    readonly #counts = new WeakMap<BBTagScript, number>();
    readonly #limit: number;

    public constructor(limit = 1) {
        super({
            category: SubtagType.SIMPLE,
            hidden: true,
            signatures: []
        });
        this.#limit = limit;
    }

    public override execute(context: BBTagScript): never {
        const count = this.#counts.get(context) ?? 0;
        this.#counts.set(context, count + 1);

        if (count >= this.#limit)
            throw new Error(`Subtag {limit} cannot be called more than ${this.#limit} time(s)`);
        throw new MarkerError('limit', count + 1);
    }
}

@Subtag.ctorArgs()
@Subtag.id('echoargs')
export class EchoArgsSubtag extends Subtag {
    public constructor() {
        super({
            category: SubtagType.SIMPLE,
            hidden: true,
            signatures: []
        });
    }

    public override async execute(_: BBTagScript, __: string, subtag: BBTagCall): Promise<string> {
        await Promise.resolve();
        return JSON.stringify([subtag.ast.name, ...subtag.args.map(a => a.ast)].map(x => x.source));
    }
}

export class SubtagTestSuite<TestCase extends SubtagTestCase> {
    readonly #config: TestSuiteConfig<TestCase> = { setup: [], teardown: [], setupEach: [], assertEach: [], postSetupEach: [], teardownEach: [] };
    readonly #testCases: TestCase[] = [];
    readonly #subtag: new (...args: never) => Subtag;
    readonly #descriptor: SubtagDescriptor;

    public constructor(subtag: new (...args: never) => Subtag) {
        this.#subtag = subtag;
        this.#descriptor = Subtag.getDescriptor(subtag);
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
        const suite = mocha.describe(`{${this.#descriptor.id}}`, () => {
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

async function runTestCase<TestCase extends SubtagTestCase>(context: mocha.Context, subtag: new (...args: never) => Subtag, testCase: TestCase, config: TestSuiteConfig<TestCase>): Promise<void> {
    if (typeof testCase.skip === 'boolean' ? testCase.skip : await testCase.skip?.() ?? false)
        context.skip();

    const subtags = [subtag, EvalSubtag, FailTestSubtag, ...testCase.subtags ?? []];
    const test = new SubtagTestContext(testCase, subtags, testCase.code);

    try {
        // arrange
        for (const s of subtags) {
            const descriptor = Subtag.getDescriptor(s);
            test.limit.setup(m => m.check(argument.isInstanceof(BBTagRuntime).value, descriptor.id), s === subtag).thenResolve(undefined);
        }
        for (const setup of config.setupEach)
            await setup.call(testCase, test);
        await testCase.setup?.(test);
        const context = test.createRuntime();
        for (const postSetup of config.postSetupEach)
            await postSetup.call(testCase, context.entrypoint, test);
        await testCase.postSetup?.(context.entrypoint, test);

        const expected = getExpectation(testCase);

        // act
        test.timer.start(true);
        const [result] = await Promise.allSettled([context.execute()]);
        test.timer.end();
        if (result.status === 'rejected') {
            if (testCase.expectError === undefined)
                throw result.reason;
            await testCase.expectError.handle(result.reason);
            return;
        } else if (testCase.expectError?.required === true) {
            throw new Error('Expected an error to be thrown!');
        } else {
            for (const error of context.errors) {
                if (error.error instanceof InternalServerError) {
                    if (testCase.expectError === undefined)
                        throw error.error.error;
                    await testCase.expectError.handle(error.error.error);
                }
            }
        }

        if (testCase.setupSaveVariables !== false)
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

        await testCase.assert?.(context.entrypoint, result.value, test);
        for (const assert of config.assertEach)
            await assert.call(testCase, context.entrypoint, result.value, test);

        if (typeof testCase.errors === 'function') {
            testCase.errors(context.errors);
        } else {
            chai.expect(context.errors.map(err => ({ error: err.error, start: err.token.start, end: err.token.end })))
                .excludingEvery('stack')
                .to.deep.equal(testCase.errors?.map(err => ({ error: err.error, start: sourceMarker(err.start), end: sourceMarker(err.end) })) ?? [],
                    'Error details didnt match the expectation');
        }
        test.verifyAll();
    } finally {
        for (const teardown of config.teardownEach)
            await teardown.call(testCase, test);
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
        const codeParts = Array.from({ length: i }, (_, j) => {
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
    const codeParts = Array.from({ length: minArgCount }, (_, j) => {
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
    const codeParts = Array.from({ length: maxArgCount + 1 }, (_, j) => {
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
                : JSON.stringify(
                    Object.entries(key)
                        .sort((a, b) => a[0] < b[0] ? 1 : -1)
                        .map(x => [x[0], this.#fromKey(x[1])]),
                    (_, v: unknown) => typeof v === 'bigint' ? `${v}n` : v
                );
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
