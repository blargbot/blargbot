export function defineBitFlags<Name extends string | symbol>(
    options: Record<Name, number>,
    zero: number
): BitFlagsConstructor<number, Name>;
export function defineBitFlags<Name extends string | symbol>(
    options: Record<Name, bigint>,
    zero: bigint
): BitFlagsConstructor<bigint, Name>;
export function defineBitFlags<Flag extends number | bigint, Name extends string | symbol>(
    options: Record<Name, Flag>,
    zero: Flag
): BitFlagsConstructor<Flag, Name> {
    const mapping = new Map(Reflect.ownKeys(options).map(k => [k as Name, options[k as Name]]));
    const allSet = mapping.values().reduce(or);

    function getOrThrow(value: Name): Flag {
        const result = mapping.get(value);
        if (result === undefined)
            throw new Error(`Unknown flag ${String(value)}`);
        return result;
    }
    function toFlag(values: Array<BitFlagConvertable<Flag, Name>>): Flag {
        return values.values().map(value => {
            if (typeof value === typeof zero)
                return value as typeof zero;
            if (typeof value === 'string' || typeof value === 'symbol')
                return getOrThrow(value);
            if (typeof value === 'object') {
                const other = value.valueOf();
                if (typeof other === typeof zero)
                    return other;
            }
            throw new Error(`Value ${String(value)} is not a valid flag.`);
        }).reduce(or);
    }

    class BitFlags implements IType<Flag, Name> {
        readonly #value: Flag;

        public constructor(...flags: Array<BitFlagConvertable<Flag, Name>>) {
            this.#value = toFlag(flags);
        }
        public has(...flags: Array<BitFlagConvertable<Flag, Name>>): boolean {
            const f = toFlag(flags);
            return and(this.#value, f) === f;
        }
        public hasAny(...flags: Array<BitFlagConvertable<Flag, Name>>): boolean {
            const f = toFlag(flags);
            return f === zero || and(this.#value, f) !== zero;
        }
        public or(...flags: Array<BitFlagConvertable<Flag, Name>>): BitFlags {
            const f = toFlag(flags);
            return new BitFlags(or(this.#value, f));
        }
        public and(...flags: Array<BitFlagConvertable<Flag, Name>>): BitFlags {
            const f = toFlag(flags);
            return new BitFlags(and(this.#value, f));
        }
        public not(): BitFlags {
            return new BitFlags(not(this.#value));
        }
        public valueOf(): Flag {
            return this.#value;
        }
        public toArray(): Name[] {
            const result: Name[] = [];
            for (const [name, value] of mapping)
                if (this.has(value))
                    result.push(name);
            return result;
        }
        public toSet(): Set<Name> {
            const result = new Set<Name>();
            for (const [name, value] of mapping)
                if (this.has(value))
                    result.add(name);
            return result;
        }
        public normalize(): BitFlags {
            if (!this.hasExtra())
                return this;
            return new BitFlags(and(this.#value, allSet));
        }
        public hasExtra(): boolean {
            return and(this.#value, not(allSet)) !== zero;
        }
    };
    for (const [name, value] of mapping)
        Object.defineProperty(BitFlags, name, { configurable: false, writable: false, value: new BitFlags(value) });
    Object.freeze(BitFlags);
    return BitFlags as BitFlagsConstructor<Flag, Name>;
}
function or<T extends number | bigint>(a: T, b: T): T {
    return (a | b) as T;
}
function and<T extends number | bigint>(a: T, b: T): T {
    return (a & b) as T;
}
function not<T extends number | bigint>(a: T): T {
    return (~a) as T;
}

type BitFlagConvertable<Flag extends number | bigint, Name extends string | symbol> = Flag | Name | { valueOf(): Flag; };
export type BitFlagsConstructor<Flag extends number | bigint, Name extends string | symbol = string | symbol> = {
    new(...values: Array<BitFlagConvertable<Flag, Name>>): BitFlags<Flag, Name>;
} & {
    [P in Name]: BitFlags<Flag, Name>;
}
type IType<Flag extends number | bigint, Name extends string | symbol = string | symbol> = BitFlags<Flag, Name>;
export interface BitFlags<Flag extends number | bigint, Name extends string | symbol = never> {
    has(...flags: Array<BitFlagConvertable<Flag, Name>>): boolean;
    hasAny(...flag: Array<BitFlagConvertable<Flag, Name>>): boolean;
    or(...flags: Array<BitFlagConvertable<Flag, Name>>): BitFlags<Flag, Name>;
    and(...flags: Array<BitFlagConvertable<Flag, Name>>): BitFlags<Flag, Name>;
    not(): BitFlags<Flag, Name>;
    valueOf(): Flag;
    toArray(): Name[];
    toSet(): Set<Name>;
    normalize(): BitFlags<Flag, Name>;
    hasExtra(): boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BitFlagNames<T extends BitFlags<any, any>> = T extends BitFlags<infer _, infer Name> ? Name : never;
