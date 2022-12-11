export default function getEnvVar<T>(reader: (value: string) => T, name: string, fallback?: string): T {
    const result = process.env[name] ?? fallback;
    if (result === undefined)
        throw new Error(`Missing environment variable ${name}`);
    return reader(result);
}
