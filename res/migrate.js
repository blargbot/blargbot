const config = require('../config.json');
const BigNumber = require('big-number')
const r = require('rethinkdbdash')({
    host: config.db.host,
    db: config.db.database,
    password: config.db.password,
    user: config.db.user,
    port: config.db.port,
    max: 50,
    buffer: 5,
    timeoutError: 10000
});

const cassandra = require('cassandra-driver');
const cclient = new cassandra.Client({
    contactPoints: config.cassandra.contactPoints, keyspace: config.cassandra.keyspace,
    authProvider: new cassandra.auth.PlainTextAuthProvider(config.cassandra.username, config.cassandra.password)
});

function makeSnowflake(date = Date.now()) {
    return BigNumber(date).minus(1420070400000).multiply(4194304).toString();
}

const date = makeSnowflake(Date.now() - (1 * 24 * 60 * 60 * 1000));

const insertQuery = `
    INSERT INTO chatlogs (id, content, attachment, userid, msgid, channelid, guildid, msgtime, type, embeds)
        VALUES (:id, :content, :attachment, :userid, :msgid, :channelid, :guildid, :msgtime, :type, :embeds)
`;
const queries = [];
const queryOptions = { prepare: true, consistency: cassandra.types.consistencies.quorum };
let i = 0;
async function send() {
    try {
        await cclient.batch(queries, queryOptions);
    } catch (err) {
        console.error(err.stack, err.message);
    }
    queries.length = 0;
}
async function process() {
    let msgs = await r.table('chatlogs')
        .between(date, r.maxval, {
            index: 'id'
        });
    let count = msgs.length;
    console.log(count, 'messages.');

    for (const m of msgs) {
        m.embeds = JSON.stringify(m.embeds);
        m.attachment = m.attachment || null;
        cclient.execute(insertQuery, m, { prepare: true });
        // console.log(m);
        // queries.push({ query: insertQuery, params: m });
        if (++i % 10000 === 0) {
            console.log('Completed', Math.floor(i / 10000), '/', count);
            // i = 0;
            // await send();
        }
    }
    console.log('Done!');
    // await send();
}
process();