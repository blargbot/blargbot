import { Cluster } from '@cluster';
import { BBTagContext, BBTagEngine, Subtag } from '@cluster/bbtag';
import { BBTagContextOptions } from '@cluster/types';
import { bbtagUtil, guard } from '@cluster/utils';
import { Logger } from '@core/Logger';
import { ModuleLoader } from '@core/modules';
import { APIChannel, APIGuild, APIGuildMember, APIMessage, APIUser, ChannelType, GuildDefaultMessageNotifications, GuildExplicitContentFilter, GuildMFALevel, GuildNSFWLevel, GuildPremiumTier, GuildVerificationLevel } from 'discord-api-types';
import { BaseData, Client as Discord, Collection, Constants, Guild, KnownGuildTextableChannel, Message, Shard, ShardManager, User } from 'eris';
import { describe, it } from 'mocha';
import { instance, mock, setStrict, when } from 'ts-mockito';
import { MethodStubSetter } from 'ts-mockito/lib/MethodStubSetter';

export interface SubtagTestCase {
    readonly code: string;
    readonly subtagName?: string;
    readonly expected?: string;
    readonly setup?: (context: SubtagTestContext) => Awaitable<void>;
    readonly assert?: (context: SubtagTestContext, result: string) => Awaitable<void>;
    readonly teardown?: (context: SubtagTestContext) => Awaitable<void>;
}

export class Mock<T> {
    #mock: T;

    // eslint-disable-next-line @typescript-eslint/ban-types
    public constructor(clazz?: (new (...args: never[]) => T) | (Function & { prototype: T; }), strict = true) {
        this.#mock = mock(clazz);
        if (!strict)
            setStrict(this.#mock, false);
    }

    public setup<R>(action: (instance: T) => Promise<R>): MethodStubSetter<Promise<R>, R, Error>
    public setup<R>(action: (instance: T) => R): MethodStubSetter<R>
    public setup(action: (instance: T) => unknown): MethodStubSetter<unknown, unknown, unknown> {
        return when(action(this.#mock));
    }

    public get instance(): T {
        return instance(this.#mock);
    }
}

/* eslint-disable @typescript-eslint/naming-convention */
export class SubtagTestContext {
    public readonly cluster: Mock<Cluster>;
    public readonly shard: Mock<Shard>;
    public readonly shards: Mock<ShardManager>;
    public readonly discord: Mock<Discord>;
    public readonly options: Mutable<Partial<BBTagContextOptions>>;
    public readonly logger: Mock<Logger>;
    public readonly message: APIMessage = { ...SubtagTestContext.#messageDefaults() };
    public readonly guild: APIGuild = { ...SubtagTestContext.#guildDefaults() };

    public constructor() {
        this.logger = new Mock<Logger>(undefined, false);
        this.discord = new Mock(Discord);
        this.cluster = new Mock(Cluster);
        this.shard = new Mock(Shard);
        this.shards = new Mock(ShardManager);
        this.options = {};

        this.cluster.setup(m => m.discord)
            .thenReturn(this.discord.instance);
        this.discord.setup(m => m.shards)
            .thenReturn(this.shards.instance);
        this.discord.setup(m => m.guildShardMap)
            .thenReturn({});
        this.discord.setup(m => m.channelGuildMap)
            .thenReturn({});
        this.discord.setup(m => m.options)
            .thenReturn({ intents: [] });
        this.shards.setup(m => m.get(0))
            .thenReturn(this.shard.instance);
        this.shard.setup(m => m.client)
            .thenReturn(this.discord.instance);

        this.discord.setup(m => m.guilds).thenReturn(new Collection(Guild));
        this.discord.setup(m => m.users).thenReturn(new Collection(User));

        this.cluster.setup(c => c.subtags)
            .thenReturn(new ModuleLoader(
                `${__dirname}/../../../../src/workers/cluster/subtags`,
                Subtag,
                [],
                this.logger.instance,
                s => [s.name, ...s.aliases]
            ));
    }

    public createContext(): BBTagContext {
        const engine = new BBTagEngine(this.cluster.instance);

        const guild = new Guild(<BaseData><unknown><APIGuild>{
            ...this.guild
        }, this.discord.instance);
        this.discord.instance.guilds.add(guild);

        for (const channel of guild.channels.values())
            this.discord.setup(m => m.getChannel(channel.id)).thenReturn(channel);

        const channel = guild.channels.find(guard.isTextableChannel);
        if (channel === undefined)
            throw new Error('No text channels were added');

        const sender = [...guild.members.values()][0];

        const message = new Message<KnownGuildTextableChannel>(<BaseData><unknown><APIMessage>{
            ...this.message,
            channel_id: channel.id,
            guild_id: guild.id,
            author: sender.user
        }, this.discord.instance);

        return new BBTagContext(engine, {
            author: sender.id,
            inputRaw: '',
            isCC: false,
            limit: 'tagLimit',
            message: message,
            ...this.options
        });
    }
    static #messageDefaults(): APIMessage {
        return {
            id: '0',
            channel_id: '0',
            guild_id: '0',
            author: this.#userDefaults(),
            member: this.#memberDefaults(),
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
            type: Constants.MessageTypes.DEFAULT
        };
    }
    static #userDefaults(): APIUser {
        return {
            avatar: null,
            discriminator: '0000',
            id: '0',
            username: 'Test User'
        };
    }
    static #memberDefaults(): APIGuildMember {
        return {
            deaf: false,
            joined_at: '1970-01-01T00:00:00Z',
            mute: false,
            roles: [],
            user: this.#userDefaults()
        };
    }
    static #guildDefaults(): APIGuild {
        return {
            id: '0',
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
            owner_id: '0',
            preferred_locale: 'en-US',
            premium_progress_bar_enabled: false,
            premium_tier: GuildPremiumTier.None,
            roles: [],
            public_updates_channel_id: null,
            rules_channel_id: null,
            splash: null,
            stickers: [],
            system_channel_flags: 0,
            system_channel_id: null,
            vanity_url_code: null,
            verification_level: GuildVerificationLevel.None,
            region: '',
            channels: [
                this.#channelDefaults()
            ],
            members: [
                this.#memberDefaults()
            ]
        };
    }
    static #channelDefaults(): APIChannel {
        return {
            id: '0',
            guild_id: '0',
            name: 'Test Channel',
            type: ChannelType.GuildText,
            position: 0,
            permission_overwrites: [],
            nsfw: false,
            topic: 'Test channel!'
        };
    }
}
/* eslint-enable @typescript-eslint/naming-convention */

export class SubtagTestSuite {
    readonly #global: {
        setup: Array<Required<SubtagTestCase>['setup']>;
        assert: Array<Required<SubtagTestCase>['assert']>;
        teardown: Array<Required<SubtagTestCase>['teardown']>;
    } = { setup: [], assert: [], teardown: [] };
    readonly #testCases: SubtagTestCase[] = [];
    readonly #subtag: string;

    public constructor(subtag: string) {
        this.#subtag = subtag;
    }

    public setup(setup: Required<SubtagTestCase>['setup']): this {
        this.#global.setup.push(setup);
        return this;
    }

    public assert(assert: Required<SubtagTestCase>['assert']): this {
        this.#global.assert.push(assert);
        return this;

    }

    public teardown(teardown: Required<SubtagTestCase>['teardown']): this {
        this.#global.teardown.push(teardown);
        return this;

    }

    public addTestCase(testCase: SubtagTestCase): this {
        this.#testCases.push(testCase);
        return this;
    }

    public run(): void {
        describe(`{${this.#subtag}}`, () => {
            for (const testCase of this.#testCases) {
                it(`should handle ${testCase.code}`, async () => {
                    const test = new SubtagTestContext();
                    try {
                        // arrange
                        for (const setup of this.#global.setup)
                            await setup(test);
                        await testCase.setup?.(test);
                        const code = bbtagUtil.parse(testCase.code);
                        const context = test.createContext();

                        // act
                        const result = await context.eval(code);

                        // assert
                        await testCase.assert?.(test, result);
                        for (const assert of this.#global.assert)
                            await assert(test, result);

                    } finally {
                        for (const teardown of this.#global.teardown)
                            await teardown(test);
                    }
                });
            }
        });
    }
}
