import z from 'zod';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Snowflake = z.codec(
    z.union([
        z.bigint(),
        z.string().regex(/^(?:0|-?[1-9]\d*)$/)
    ]),
    z.bigint(),
    {
        encode: v => v,
        decode: BigInt
    }
);
export type Snowflake = z.infer<typeof Snowflake>;
