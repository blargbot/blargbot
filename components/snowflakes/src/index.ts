export type Snowflake = `${bigint}`;

const snowflake = Object.freeze({
    test,
    parse,
    tryParse,
    create,
    createRaw,
    fromTime,
    nextFactory,
    createFactory
});

export default snowflake;

function test(snowflake: string): snowflake is Snowflake {
    return tryParseBigint(snowflake) !== undefined;
}
function parse(snowflake: string | bigint): SnowflakeDetails {
    const result = tryParse(snowflake);
    if (result === undefined)
        throw new SyntaxError(`Value ${JSON.stringify(snowflake)} is not a valid snowflake`);

    return result;
}
function tryParse(snowflake: string | bigint): SnowflakeDetails | undefined {
    if (typeof snowflake === 'bigint')
        return fromBigint(snowflake);

    const value = tryParseBigint(snowflake);
    if (value !== undefined)
        return fromBigint(value);

    return undefined;
}
function createRaw(details: SnowflakeDetails): bigint {
    return (
        timestamp.set(details.timestampMs - discordEpochMs)
        + workerId.set(details.workerId)
        + processId.set(details.processId)
        + index.set(details.index)
    );
}
function create(details: SnowflakeDetails): Snowflake {
    return createRaw(details).toString();
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
    return {
        create(timestampMs = new Date()) {
            return create({
                timestampMs: timestampMs.valueOf(),
                processId,
                workerId,
                index: index++
            });
        },
        createRaw(timestampMs = new Date()) {
            return createRaw({
                timestampMs: timestampMs.valueOf(),
                processId,
                workerId,
                index: index++
            });
        }
    };
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
function xorClamp(value: bigint, shift: bigint, mask: bigint): bigint {
    let res = 0n;
    while (value !== 0n) {
        res ^= value & mask;
        value >>= shift;
    }
    return res;
}

const discordEpochMs = 1420070400000;
const blocks = [42n, 5n, 5n, 12n];
const maxSnowflake = ~(-1n << blocks.reduce((p, c) => p + c));
const { accessors: [timestamp, workerId, processId, index] } = blocks
    .reduceRight<{ end: bigint; accessors: SnowflakePartAccessor[]; }>(
        (p, c) => {
            const mask = ~(-1n << c);
            const shift = p.end;
            p.end += c;
            p.accessors.unshift({
                get: snowflake => Number(snowflake >> shift & mask),
                set: value => xorClamp(BigInt(value), c, mask) << shift
            });
            return p;
        },
        { end: 0n, accessors: [] }
    );

export interface SnowflakeDetails {
    readonly timestampMs: number;
    readonly workerId: number;
    readonly processId: number;
    readonly index: number;
}

export interface SnowflakeFactory {
    create(this: void, timestampMs?: number | Date): Snowflake;
    createRaw(this: void, timestampMs?: number | Date): bigint;
}

interface SnowflakePartAccessor {
    get: (snowflake: bigint) => number;
    set: (value: number) => bigint;
}
