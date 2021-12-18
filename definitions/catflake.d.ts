declare module 'catflake' {
    export interface CatflakeOptions {
        readonly epoch?: number;
        readonly incrementBits?: number;
        readonly workerBits?: number;
        readonly processBits?: number;
        readonly processId?: number;
        readonly workerId?: number;
        readonly stringify?: boolean;
    }

    export interface DeconstructedSnowflake {
        readonly timestamp: BigInt;
        readonly workerId: BigInt;
        readonly processId: BigInt;
        readonly increment: BigInt;
    }

    export type Snowflake = string | BigInt;

    export default class Catflake {
        public constructor(options: CatflakeOptions);

        public generate(): Snowflake | Promise<Snowflake>;
        public _generate(date?: number | string | bigint, increment?: number): Snowflake;
        public deconstruct(snowflake: Snowflake): DeconstructedSnowflake;
    }
}
