import Catflake, { Snowflake } from 'catflake';

const workerId = process.env.CLUSTER_ID
    ? parseInt(process.env.CLUSTER_ID)
    : 31;

const catflake = new Catflake({
    processBits: 0,
    workerBits: 8,
    incrementBits: 14,
    workerId
});

export const snowflake = {
    create(date?: Date) {
        return catflake._generate(date);
    },
    deconstruct(snowflake: Snowflake) {
        let decon = catflake.deconstruct(snowflake);
        return decon.timestamp.valueOf();
    }
}