import type { Snowflake } from './snowflake.js';
import { snowflake } from './snowflake.js';

const userFindRegex = /<@!?(\d+)>/g;
const userNicknameFindRegex = /<@(\d+)>/g;
const roleFindRegex = /<@&(\d+)>/g;
const channelFindRegex = /<#(\d+)>/g;
const slashCommandNameRegex = /^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u;
const n = `(${slashCommandNameRegex.source.slice(1, -1)})`;
const slashCommandFindRegex = new RegExp(`<\\/${n}(?: ${n}(?: ${n})?)?:(\\d+)>`, 'g');
const customEmojiNameRegex = /^[a-zA-Z0-9_]{2,32}$/;
const customEmojiFindRegex = new RegExp(`<(a)?:(${customEmojiNameRegex.source.slice(1, -1)}):(\\d+)>`, 'g');

export const markup = Object.freeze({
    everyone: '@everyone',
    here: '@here',
    user: createMarkupTool(
        createUserMention,
        userFindRegex,
        m => m[1] as Snowflake,
        {
            nickname: createMarkupTool(
                createNicknameMention,
                userNicknameFindRegex,
                m => m[1] as Snowflake
            )
        }
    ),
    role: createMarkupTool(
        createRoleMention,
        roleFindRegex,
        m => m[1] as Snowflake
    ),
    channel: createMarkupTool(
        createChannelMention,
        channelFindRegex,
        m => m[1] as Snowflake
    ),
    slashCommand: createMarkupTool(
        createSlashCommandMention,
        slashCommandFindRegex,
        m => ({
            name: m.slice(1, -1).filter(x => x.length > 0) as SlashCommandName,
            id: m[m.length - 1] as Snowflake
        })
    ),
    customEmoji: createMarkupTool(
        createCustomEmojiMention,
        customEmojiFindRegex,
        m => ({
            animated: m[1] === 'a',
            name: m[2],
            id: m[3] as Snowflake
        })
    ),
    timestamp: createMarkupTool(
        createTimestampMention,
        createTimestampRegex('[tTdDfFR]?'),
        m => ({
            timeMs: new Date(Number(m[1])),
            style: m[2] === '' ? undefined : m[2] as DiscordTimeStyle
        }),
        {
            ...createStyledTimestampMarkupTools('t', 'shortTime'),
            ...createStyledTimestampMarkupTools('T', 'longTime'),
            ...createStyledTimestampMarkupTools('d', 'shortDate'),
            ...createStyledTimestampMarkupTools('D', 'longDate'),
            ...createStyledTimestampMarkupTools('f', 'shortDateTime'),
            ...createStyledTimestampMarkupTools('F', 'longDateTime'),
            ...createStyledTimestampMarkupTools('R', 'relative'),
            isStyle: (value: string): value is DiscordTimeStyle => {
                return value.length > 0 && markup.timestamp.pattern.exact.test(`<t:0:${value}>`);
            }
        }
    )
});

// eslint-disable-next-line @typescript-eslint/ban-types
export type MarkupTool<Impl extends (...args: never) => string, Result, Rest extends object = {}> = Impl & Rest & {
    findAll(content: string): Result[];
    parse(content: string): Result;
    tryParse(content: string): Result | undefined;
    pattern: {
        readonly exact: RegExp;
        readonly start: RegExp;
        readonly end: RegExp;
        readonly anywhere: RegExp;
    };
}

// eslint-disable-next-line @typescript-eslint/ban-types
function createMarkupTool<Impl extends (...args: never) => string, Result, Rest extends object = {}>(
    impl: Impl,
    test: RegExp,
    selector: (match: RegExpMatchArray) => Result,
    rest: Rest = {} as Rest
): MarkupTool<Impl, Result, Rest> {
    const exact = new RegExp(`^${test.source}$`, test.flags);
    return Object.assign(impl, {
        findAll: (content: string) => [...content.matchAll(test)].map(selector),
        parse: (content: string) => {
            for (const match of content.matchAll(exact))
                return selector(match);
            throw new Error('No valid markup found');
        },
        tryParse: (content: string) => {
            for (const match of content.matchAll(exact))
                return selector(match);
            return undefined;
        },
        pattern: {
            get anywhere() {
                return new RegExp(`${test.source}`, test.flags);
            },
            get exact() {
                return new RegExp(`^${test.source}$`, test.flags);
            },
            get start() {
                return new RegExp(`^${test.source}`, test.flags);
            },
            get end() {
                return new RegExp(`${test.source}$`, test.flags);
            }
        },
        ...rest
    });
}
function createStyledTimestampMarkupTools<Style extends DiscordTimeStyle, Alias extends PropertyKey>(
    style: Style,
    ...aliases: Alias[]
): { [P in Style | Alias]: MarkupTool<(timeMs: number | Date) => `<t:${number}:${Style}>`, Date> } {
    const tool = createMarkupTool(
        (timeMs: number | Date) => `<t:${Math.floor(timeMs.valueOf() / 1000)}:${style}>` as const,
        createTimestampRegex(style),
        m => new Date(Number(m[1]) * 1000)
    );
    return Object.fromEntries([style, ...aliases].map(x => [x, tool] as const));
}
function createTimestampRegex<T extends string>(style: T): RegExp {
    return new RegExp(`<t:(\\d+):(${style})>`, 'g');
}
function createUserMention(userId: string | bigint): `<@${Snowflake}>` {
    if (typeof userId === 'string' && !snowflake.test(userId))
        throw new Error('Invalid user id');
    return `<@${userId}>`;
}
function createNicknameMention(userId: string | bigint): `<@!${Snowflake}>` {
    if (typeof userId === 'string' && !snowflake.test(userId))
        throw new Error('Invalid user id');
    return `<@!${userId}>`;
}
function createRoleMention(roleId: string | bigint): `<@&${Snowflake}>` {
    if (typeof roleId === 'string' && !snowflake.test(roleId))
        throw new Error('Invalid role id');
    return `<@&${roleId}>`;
}
function createChannelMention(channelId: string | bigint): `<#${Snowflake}>` {
    if (typeof channelId === 'string' && !snowflake.test(channelId))
        throw new Error('Invalid channel id');
    return `<#${channelId}>`;
}
type SlashCommandName = [name: string] | [name: string, group: string] | [name: string, group: string, subcommand: string];
function createSlashCommandMention(name: SlashCommandName, id: string | bigint): `</${string}:${Snowflake}>` {
    for (const n of name)
        if (!slashCommandNameRegex.test(n))
            throw new Error(`Invalid slash command name ${JSON.stringify(n)}`);
    if (typeof id === 'string' && !snowflake.test(id))
        throw new Error('Invalid role id');

    return `</${name.join(' ')}:${id}>`;
}
function createCustomEmojiMention(name: string, id: string | bigint, animated: boolean): `<${'a' | ''}:${string}:${Snowflake}>` {
    if (!customEmojiNameRegex.test(name))
        throw new Error('Invalid emoji name');
    if (typeof id === 'string' && !snowflake.test(id))
        throw new Error('Invalid emoji id');
    return `<${animated ? 'a' : ''}:${name}:${id}>`;
}
export type DiscordTimeStyle = 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R';
function createTimestampMention(timeMs: number | Date, style?: undefined): `<t:${number}>`
function createTimestampMention<Style extends DiscordTimeStyle>(timeMs: number | Date, style: Style): `<t:${number}:${Style}>`
function createTimestampMention<Style extends DiscordTimeStyle>(timeMs: number | Date, style?: Style): `<t:${number}>` | `<t:${number}:${Style}>`
function createTimestampMention<Style extends DiscordTimeStyle>(timeMs: number | Date, style?: Style): `<t:${number}>` | `<t:${number}:${Style}>` {
    const v = Math.floor(timeMs.valueOf() / 1000);
    return style === undefined
        ? `<t:${v}>`
        : `<t:${v}:${style}>`;
}
