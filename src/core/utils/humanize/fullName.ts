export function fullName(user: { username?: string | null; discriminator?: string | null; } | undefined | null): string {
    return `${user?.username ?? 'unknown'}#${user?.discriminator ?? '0000'}`;
}
