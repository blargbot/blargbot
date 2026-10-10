import { random } from '@blargbot/util';

export function randomSnowflake(name: string): bigint {
    return `${name}<${random.bigint(10n ** 10n, 10n ** 20n)}>` as unknown as bigint;
}
