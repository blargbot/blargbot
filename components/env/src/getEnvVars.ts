export default function getEnvVars<T>(reader: (value: string) => T, name: RegExp, sort?: (a: RegExpMatchArray, b: RegExpMatchArray) => number): T[] {
    return Object.entries(process.env)
        .filter((x): x is [string, string] => x[1] !== undefined)
        .map(x => [x[0].match(name), x[1]] as const)
        .filter((x): x is [RegExpMatchArray, string] => x[0] !== null)
        .sort((a, b) => sort?.(a[0], b[0]) ?? 0)
        .map(x => reader(x[1]));
}
