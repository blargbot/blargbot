const discordEpoch = 1_420_070_400_000n;
const minSnowflake = BigInt(Date.UTC(2015, 4, 13)) - discordEpoch << 22n;
const maxSnowflake = 2n ** 64n;
export function isSnowflake(value: string | bigint): value is `${bigint}` | bigint {
    if (typeof value === 'string') {
        if (!/^(0|[1-9]\d*)$/.test(value))
            return false;
        value = BigInt(value);
    }
    return minSnowflake <= value && value <= maxSnowflake;
}
