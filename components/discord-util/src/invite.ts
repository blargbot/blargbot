export const invite = {
    test
};

const inviteRegex = /(?:discord.(?:gg|io|me|li|club)|discord(?:app)?\.com\/invite)\/(?<code>[a-z0-9])+/ig;

function test(content: string): boolean {
    return inviteRegex.test(content);
}
