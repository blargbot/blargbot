const bigInt = require('big-integer');

let increment = bigInt.zero;
// assign shard id to the current shard's ID, or to the max value if master shard 
const shard_id = bigInt(process.env.CLUSTER_ID ? parseInt(process.env.CLUSTER_ID) : 0b1111111111)
    .shiftLeft(12);

bu.makeSnowflake = function (date = Date.now()) {
    let ts = bigInt(date).minus(1420070400000).shiftLeft(22);
    let inc = increment = increment.next().mod(0b111111111111);
    // console.log('\n' + [ts.toString(2), shard_id.toString(2), inc.toString(2)].map(s => s.padStart(64, '0')).join('\n'));

    return ts.add(shard_id).add(inc).toString();
};

bu.unmakeSnowflake = function (snowflake) {
    return (snowflake / 4194304) + 1420070400000;
};
