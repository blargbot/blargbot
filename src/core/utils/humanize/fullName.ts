export function fullName(user: { username?: string, discriminator?: string } | undefined | null): string {
    return `${user?.username ?? 'unknown'}#${user?.discriminator ?? '0000'}`;
}