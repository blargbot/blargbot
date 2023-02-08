export type Snowflake = `${bigint}`;

export const snowflake = {
    test,
    parse,
    tryParse,
    create,
    fromTime,
    nextFactory,
    createFactory
};

function test(snowflake: string): snowflake is Snowflake {
    return tryParse(snowflake) !== undefined;
}
function parse(snowflake: string): SnowflakeDetails {
    const result = tryParse(snowflake);
    if (result === undefined)
        throw new SyntaxError(`Value ${JSON.stringify(snowflake)} is not a valid snowflake`);

    return result;
}
function tryParse(snowflake: string): SnowflakeDetails | undefined {
    const value = tryParseBigint(snowflake);
    if (value === undefined)
        return undefined;

    return fromBigint(value);
}
function create(details: SnowflakeDetails): Snowflake {
    return (
        timestamp.set(details.timestampMs - discordEpochMs)
        + workerId.set(details.workerId)
        + processId.set(details.processId)
        + index.set(details.index)
    ).toString();
}
function fromTime(timestampMs: number | Date = new Date()): Snowflake {
    return create({
        timestampMs: timestampMs.valueOf(),
        index: 0,
        processId: 0,
        workerId: 0
    });
}
function createFactory(workerId: number, processId: number): SnowflakeFactory {
    let index = 0;
    return (timestampMs = new Date()) => create({
        timestampMs: timestampMs.valueOf(),
        processId,
        workerId,
        index: index++
    });
}
let i = 0;
function nextFactory(): SnowflakeFactory {
    return createFactory(i++, process.pid);
}
function tryParseBigint(snowflake: string): bigint | undefined {
    try {
        return BigInt(snowflake);
    } catch {
        return undefined;
    }
}
function fromBigint(snowflake: bigint): SnowflakeDetails | undefined {
    if (snowflake > maxSnowflake || snowflake < 0n)
        return undefined;
    return {
        timestampMs: timestamp.get(snowflake) + discordEpochMs,
        workerId: workerId.get(snowflake),
        processId: processId.get(snowflake),
        index: index.get(snowflake)
    };
}

const discordEpochMs = 1420070400000;
const blocks = [42n, 5n, 5n, 12n];
const maxSnowflake = ~(-1n << blocks.reduce((p, c) => p + c));
const { accessors: [timestamp, workerId, processId, index] } = blocks.reduceRight(
    (p, c) => {
        const mask = ~(-1n << c);
        const shift = p.end;
        p.end += c;
        p.accessors.unshift({
            get: snowflake => Number(snowflake >> shift & mask),
            set: value => (BigInt(value) & mask) << shift
        });
        return p;
    },
    {
        end: 0n,
        accessors: [] as SnowflakePartAccessor[]
    }
);

export interface SnowflakeDetails {
    readonly timestampMs: number;
    readonly workerId: number;
    readonly processId: number;
    readonly index: number;
}

export interface SnowflakeFactory {
    (timestampMs?: number | Date): Snowflake;
}

interface SnowflakePartAccessor {
    get: (snowflake: bigint) => number;
    set: (value: number) => bigint;
}
