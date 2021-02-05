declare module 'catflake' {
    export interface CatflakeOptions {
        epoch?: number,
        incrementBits?: number,
        workerBits?: number,
        processBits?: number,
        processId?: number,
        workerId?: number,
        stringify?: boolean
    }

    export interface DeconstructedSnowflake {
        timestamp: BigInt;
        workerId: BigInt;
        processId: BigInt;
        increment: BigInt;
    }

    export type Snowflake = string | BigInt;

    export default class Catflake {
        constructor(options: CatflakeOptions);

        generate(): Snowflake | Promise<Snowflake>;
        _generate(date?: Date, increment?: number): Snowflake;
        deconstruct(snowflake: Snowflake): DeconstructedSnowflake;
    }
}