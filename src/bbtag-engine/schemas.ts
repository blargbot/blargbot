import z from 'zod';

export const integerish = z.preprocess(
    v => typeof v === 'string' ? parseInt(v) : v,
    z.number().int()
);

export const booleanish = z.union([
    z.boolean(),
    z.literal('true').transform(() => true),
    z.literal('false').transform(() => false)
]);

export const bigintish = z
    .string()
    .regex(/^\d+$/)
    .transform(BigInt);

export const jsonSchema = <T extends z.ZodType>(schema: T): z.ZodType<z.infer<T>> =>
    z.preprocess(
        value => {
            if (typeof value !== 'string') {
                return value;
            }

            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        },
        schema
    );

export const enumish = <T extends Record<string, unknown>>(
    enumOptions: T
): z.ZodType<T[keyof T]> => {
    const values = new Set(Object.values(enumOptions) as Array<T[keyof T]>);
    return z.preprocess(
        value => {
            if (typeof value !== 'string') {
                return value;
            }

            if (value.trim().length > 0) {
                const asNumber = Number(value);
                if (!isNaN(asNumber)) {
                    return asNumber;
                }
            }

            const key = value
                .replaceAll(/([a-z])([A-Z])/g, '$1_$2')
                .replaceAll(/([a-zA-Z])(0-9)/g, '$1_$2')
                .replaceAll(/([0-9])([a-zA-Z])/g, '$1_$2')
                .replaceAll(/-/g, '_')
                .toUpperCase();

            return Object.hasOwn(enumOptions, key)
                ? enumOptions[key]
                : value;
        },
        z.custom<T[keyof T]>(v => values.has(v))
    );
};
