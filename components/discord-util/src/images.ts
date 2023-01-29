export const images = {
    defaultUserAvatar,
    userAvatar,
    memberAvatar,
    guildIcon
};

function defaultUserAvatar(discriminator: string): string
function defaultUserAvatar(discriminator?: string): string | undefined
function defaultUserAvatar(discriminator?: string): string | undefined {
    if (discriminator === undefined)
        return undefined;
    return `https://cdn.discordapp.com/embed/avatars/${Number(discriminator) % 5}.png`;
}

function userAvatar(user: { id: string; avatar?: string | null; discriminator: string; }): string
function userAvatar(user?: { id: string; avatar?: string | null; discriminator?: string; }): string | undefined
function userAvatar(user?: { id: string; avatar?: string | null; discriminator?: string; }): string | undefined {
    if (typeof user?.avatar !== 'string')
        return defaultUserAvatar(user?.discriminator);

    return user.avatar.startsWith('a_')
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.gif`
        : `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
}

function memberAvatar(guildId: string, memberAvatar: string | null | undefined, user: { id: string; avatar?: string | null; discriminator: string; }): string
function memberAvatar(guildId: string, memberAvatar: string | null | undefined, user: { id: string; avatar?: string | null; discriminator?: string; }): string | undefined
function memberAvatar(guildId: string, memberAvatar: string | null | undefined, user: { id: string; avatar?: string | null; discriminator?: string; }): string | undefined {
    if (typeof memberAvatar !== 'string')
        return userAvatar(user);

    return memberAvatar.startsWith('a_')
        ? `https://cdn.discordapp.com/guilds/${guildId}/users/${user.id}/avatars/${memberAvatar}.gif`
        : `https://cdn.discordapp.com/guilds/${guildId}/users/${user.id}/avatars/${memberAvatar}.png`;
}

function guildIcon(guild: { id: string; icon: string | null; }): string | null {
    if (guild.icon === null)
        return null;
    return guild.icon.startsWith('a_')
        ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.gif`
        : `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
}
