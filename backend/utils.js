var e = module.exports = {};

e.commands = [];
e.tags = [];
e.config = require('./config.json');
e.r = require('rethinkdbdash')({
    host     : e.config.rdb.host,
    db       : e.config.rdb.database,
    password : e.config.rdb.password,
    user     : e.config.rdb.user,
    port     : e.config.rdb.port
});

e.update = async () => {
    e.commands = await e.r.table('command').orderBy({index: 'typeAndName'}).run();
    e.tags = await e.r.table('rawtag').orderBy({index: 'typeAndName'}).run();
};