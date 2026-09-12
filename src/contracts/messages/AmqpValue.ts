import z from 'zod';

export type AmqpTable = { [x: string]: AmqpValue; };
export type AmqpValue = boolean | number | string | Buffer | Date | null | AmqpValue[] | AmqpTable;
// eslint-disable-next-line @typescript-eslint/naming-convention
export const AmqpTable: z.ZodType<AmqpTable> = z.record(z.string(), z.lazy(() => AmqpValue));
// eslint-disable-next-line @typescript-eslint/naming-convention
export const AmqpValue: z.ZodType<AmqpValue> = z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.instanceof(Buffer),
    z.date(),
    z.null(),
    z.lazy(() => AmqpValue).array(),
    AmqpTable
]);
