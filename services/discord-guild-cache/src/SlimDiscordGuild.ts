import type Discord from '@blargbot/discord-types';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SlimDiscordGuild extends SlimDiscordGuildHelper {

}

export function toSlimDiscordGuild(guild: Discord.APIGuild): SlimDiscordGuild {
    return Object.fromEntries(
        Object.entries(guild)
            .filter(isWhitelistedProp)
    );
}

type WhitelistedTypes = null | boolean | string | number | undefined;
type WhitelistedProps = typeof whitelistedProps[number];

type AllowedProps = keyof Discord.APIGuild extends infer P ? P extends keyof Discord.APIGuild ?
    | (P extends WhitelistedProps ? P : never)
    | (Discord.APIGuild[P] extends WhitelistedTypes ? P : never)
    : never : never

type SlimDiscordGuildHelper = {
    [P in AllowedProps]: Discord.APIGuild[P]
}

type SlimDiscordGuildProp = { [P in keyof SlimDiscordGuild]: [P, SlimDiscordGuild[P]] }[keyof SlimDiscordGuild];

function isWhitelistedProp(prop: [key: PropertyKey, value: unknown]): prop is SlimDiscordGuildProp {
    return whitelistedPropSet.has(prop[0]) || isWhitelistedPropValue(prop[1]);
}

const whitelistedProps = ['features'] as const;
const whitelistedPropSet = new Set(whitelistedProps);
function isWhitelistedPropValue(value: unknown): value is WhitelistedTypes {
    switch (typeof value) {
        case 'undefined': return true;
        case 'string': return true;
        case 'number': return true;
        case 'boolean': return true;
        case 'object': return value === null;
        default: return false;
    }
}
