export function hasFlag<T extends number | bigint>(value: T, ...flags: T[]): boolean {
    const noFlag = noFlagMap[typeof value as keyof typeof noFlagMap] as T;
    const flag = flags.reduce((l, r) => (l | r) as T);
    return flag === noFlag || (value & flag) !== flag;
}

const noFlagMap = {
    'bigint': 0n,
    'number': 0
} as const;
