export function defineBitFlags<Name extends string | symbol>(
    options: Record<Name, number>
): BitFlagsConstructor<number, Name>;
export function defineBitFlags<Name extends string | symbol>(
    options: Record<Name, bigint>
): BitFlagsConstructor<bigint, Name>;
export function defineBitFlags<Flag extends number | bigint, Name extends string | symbol>(
    options: Record<Name, Flag>
): BitFlagsConstructor<Flag, Name> {
    const mapping = new Map<Name, Flag>(Reflect.ownKeys(options).map(k => [k as Name, options[k as Name]]));
    const first = mapping.values().next();
    if (first.done === true)
        throw new Error('Cannot have an empty bit set');
    const zero = xor(first.value, first.value);
    if (mapping.values().some(v => typeof v !== typeof zero))
        throw new Error('Cannot mix number and bigint flags.');
    if (mapping.values().some(v => not(not(v)) !== v))
        throw new Error('Flags must be 32 bit signed integers.');
    if (mapping.values().some(v => v !== zero && !hasOneBitSet(v, zero)))
        throw new Error('Flags must each represent a single bit.');
    if (new Set(mapping.values()).size !== mapping.size)
        throw new Error('Each bit pattern may only be represented by one flag name.');
    const none = mapping.entries().find(v => v[1] === zero)?.[0];

    const knownBits = mapping.values().reduce(or);

    function getOrThrow(value: Name): Flag {
        const result = mapping.get(value);
        if (result === undefined)
            throw new Error(`Unknown flag ${String(value)}`);
        return result;
    }
    function toFlag(values: Array<BitFlagConvertible<Flag, Name>>): Flag {
        return values.values().map(value => {
            if (typeof value === typeof zero)
                return value as typeof zero;
            if (typeof value === 'string' || typeof value === 'symbol')
                return getOrThrow(value);
            if (typeof value === 'object' && Symbol.toPrimitive in value) {
                const other = value[Symbol.toPrimitive]();
                if (typeof other === typeof zero)
                    return other;
            }
            throw new Error(`Value ${String(value)} is not a valid flag.`);
        }).reduce(or, zero);
    }

    class BitFlags implements IType<Flag, Name> {
        readonly #value: Flag;

        public get raw(): Flag {
            return this.#value;
        }

        public constructor(...flags: Array<BitFlagConvertible<Flag, Name>>) {
            this.#value = toFlag(flags);
        }
        public has(...flags: Array<BitFlagConvertible<Flag, Name>>): boolean {
            const f = toFlag(flags);
            return and(this.#value, f) === f;
        }
        public hasAny(...flags: Array<BitFlagConvertible<Flag, Name>>): boolean {
            const f = toFlag(flags);
            return and(this.#value, f) !== zero;
        }
        public or(...flags: Array<BitFlagConvertible<Flag, Name>>): BitFlags {
            const f = toFlag(flags);
            return new BitFlags(or(this.#value, f));
        }
        public and(...flags: Array<BitFlagConvertible<Flag, Name>>): BitFlags {
            const f = toFlag(flags);
            return new BitFlags(and(this.#value, f));
        }
        public xor(...flags: Array<BitFlagConvertible<Flag, Name>>): BitFlags {
            const f = toFlag(flags);
            return new BitFlags(xor(this.#value, f));
        }
        public not(): BitFlags {
            return new BitFlags(not(this.#value));
        }
        * #iterateNames(): Generator<Name, void, void> {
            if (this.#value === zero) {
                if (none !== undefined)
                    yield none;
                return;
            }
            for (const [name, value] of mapping)
                if (value !== zero && and(this.#value, value) === value)
                    yield name;
        }
        public toArray(): Name[] {
            return [...this.#iterateNames()];
        }
        public toSet(): Set<Name> {
            return new Set(this.#iterateNames());
        }
        public normalize(): BitFlags {
            if (!this.hasExtra())
                return this;
            return new BitFlags(and(this.#value, knownBits));
        }
        public hasExtra(): boolean {
            return and(this.#value, not(knownBits)) !== zero;
        }
        public toString(radix?: number): string {
            return this.#value.toString(radix);
        }
        public [Symbol.toPrimitive](): Flag {
            return this.#value;
        }
    };
    for (const [name, value] of mapping) {
        if (Reflect.has(BitFlags, name) || Reflect.has(BitFlags.prototype, name))
            throw new Error(`Bit flag name ${String(name)} collides with a built in member. Please rename it`);
        Reflect.defineProperty(BitFlags, name, { configurable: false, writable: false, value: new BitFlags(value) });
    }
    Object.freeze(BitFlags);
    return BitFlags as BitFlagsConstructor<Flag, Name>;
}
function or<T extends number | bigint>(a: T, b: T): T {
    return (a | b) as T;
}
function xor<T extends number | bigint>(a: T, b: T): T {
    return (a ^ b) as T;
}
function and<T extends number | bigint>(a: T, b: T): T {
    return (a & b) as T;
}
function not<T extends number | bigint>(a: T): T {
    return ~a as T;
}
function neg<T extends number | bigint>(a: T): T {
    return -a as T;
}
function hasOneBitSet<T extends number | bigint>(v: T, zero: T): boolean {
    return v !== zero && and(v, neg(v)) === v;
}

type BitFlagConvertible<Flag extends number | bigint, Name extends string | symbol> = Flag | Name | { [Symbol.toPrimitive](): Flag; };
export type BitFlagsConstructor<Flag extends number | bigint, Name extends string | symbol = string | symbol> = {
    new(...values: Array<BitFlagConvertible<Flag, Name>>): BitFlags<Flag, Name>;
} & {
    [P in Name]: BitFlags<Flag, Name>;
}
type IType<Flag extends number | bigint, Name extends string | symbol = string | symbol> = BitFlags<Flag, Name>;
export interface BitFlags<Flag extends number | bigint, Name extends string | symbol = never> {
    get raw(): Flag;
    has(...flags: Array<BitFlagConvertible<Flag, Name>>): boolean;
    hasAny(...flag: Array<BitFlagConvertible<Flag, Name>>): boolean;
    or(...flags: Array<BitFlagConvertible<Flag, Name>>): BitFlags<Flag, Name>;
    and(...flags: Array<BitFlagConvertible<Flag, Name>>): BitFlags<Flag, Name>;
    xor(...flags: Array<BitFlagConvertible<Flag, Name>>): BitFlags<Flag, Name>;
    not(): BitFlags<Flag, Name>;
    [Symbol.toPrimitive](): Flag;
    toArray(): Name[];
    toSet(): Set<Name>;
    normalize(): BitFlags<Flag, Name>;
    hasExtra(): boolean;
    toString(radix?: number): string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BitFlagNames<T extends BitFlags<any, any>> = T extends BitFlags<infer _, infer Name> ? Name : never;
