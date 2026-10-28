import { random } from '@blargbot/util';

export function createSnowflake(name?: undefined): `${bigint}`
export function createSnowflake(name: string): `${string}<${bigint}>`
export function createSnowflake(name?: string): `${bigint}` | `${string}<${bigint}>`
export function createSnowflake(name?: string): `${bigint}` | `${string}<${bigint}>` {
    const id = random.bigint(10n ** 10n, 10n ** 20n).toString();
    return name === undefined ? id : `${name}<${id}>`;
}
