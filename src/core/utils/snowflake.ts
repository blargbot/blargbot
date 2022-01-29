import Catflake, { Snowflake } from 'catflake';

const workerId = process.env.CLUSTER_ID !== undefined
    ? parseInt(process.env.CLUSTER_ID)
    : 31;

const catflake = new Catflake({
    processBits: 0,
    workerBits: 8,
    incrementBits: 14,
    workerId
});

const bounds = {
    '10^17': 10n ** 17n,
    '10^24': 10n ** 24n
};

export const snowflake = {
    create(this: void, date?: number | string | bigint): Snowflake {
        return catflake._generate(date);
    },
    deconstruct(this: void, snowflake: Snowflake): BigInt {
        const decon = catflake.deconstruct(snowflake);
        return decon.timestamp.valueOf();
    },
    parse(this: void, value: string): Snowflake {
        if (snowflake.test(value))
            return value;
        throw new Error(`${JSON.stringify(value)} is not a valid snowflake`);
    },
    test(this: void, value: unknown): value is Snowflake {
        switch (typeof value) {
            case 'bigint':
                return value > bounds['10^17'] && value < bounds['10^24'];
            case 'string':
                return /^\d{17,23}$/.test(value);
            default:
                return false;
        }
    }
};
