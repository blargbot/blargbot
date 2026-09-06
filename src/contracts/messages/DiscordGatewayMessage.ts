import z from 'zod';

type DiscordGatewayMessage = z.infer<typeof DiscordGatewayMessage>;
// eslint-disable-next-line @typescript-eslint/naming-convention
const DiscordGatewayMessage = z.object({
    d: z.unknown(),
    op: z.int().gte(0),
    t: z.string()
});

export { DiscordGatewayMessage };
