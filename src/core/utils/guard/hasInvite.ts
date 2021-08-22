const inviteRegex = /(discord.(gg|io|me|li|club)|discord(app)?\.com\/invite)\/[a-z0-9]+/i;

export function hasInvite(content: string): boolean {
    return inviteRegex.test(content);
}
