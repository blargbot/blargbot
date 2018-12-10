const Catflake = require('catflake');
const catflake = new Catflake({
    processBits: 0,
    workerBits: 8,
    incrementBits: 14,
    workerId: process.env.CLUSTER_ID || 31
});

bu.makeSnowflake = function (date) {
    return catflake._generate(date);
};

bu.unmakeSnowflake = function (snowflake) {
    let decon = catflake.deconstruct(snowflake);
    return decon.timestamp.valueOf();
};
