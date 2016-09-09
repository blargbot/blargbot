var mysql = require('mysql');
var fs = require('fs');
var path = require('path');
var util = require('util');
if (fs.existsSync(path.join(__dirname, 'config.json'))) {
    var configFile = fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8');
    var config = JSON.parse(configFile);
}

var databaseFile;
if (config.general.databasedir) {
    if (config.general.databasedir.startsWith('/'))
        databaseFile = config.general.databasedir;
    else
        databaseFile = path.join(__dirname, config.general.databasedir);
} else
    databaseFile = path.join(__dirname, 'data.db');
var exists = fs.existsSync(databaseFile);
var sqlite3 = require('sqlite3').verbose();
var olddb = new sqlite3.Database(databaseFile);
var db = mysql.createConnection({
    host: config.sql.host,
    user: config.sql.user,
    password: config.sql.pass,
    database: config.sql.database,
    charset: 'utf8mb4_general_ci'
});
//users()
init();
//db.query('select * from modlog', (err, row) => {
//    console.log(util.inspect(row))
//})
function init() {
    console.log('Initializing. Thing will start in ~10 seconds.');
    db.query(`create table if not exists vars (
        varname VARCHAR(30) PRIMARY KEY,
        varvalue TEXT
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);

    db.query(`CREATE TABLE if not exists user (
        userid VARCHAR(30) PRIMARY KEY, 
        username TEXT,
        isbot INTEGER,
        lastspoke DATETIME,
        lastchannel TEXT,
        lastcommand TEXT,
        lastcommanddate DATETIME,
        messagecount INTEGER DEFAULT 0
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);

    db.query(`CREATE TABLE IF NOT EXISTS modlog (
            guildid VARCHAR(30),
            caseid INTEGER,
            userid VARCHAR(30),
            modid VARCHAR(30),
            type TEXT,
            reason TEXT,
            msgid TEXT,
            primary key (guildid, caseid),
            foreign key (userid) references user(userid),
            foreign key (modid) references user(userid)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);

    db.query(`CREATE TABLE IF NOT EXISTs chatlogs (
            id INTEGER PRIMARY KEY AUTO_INCREMENT,
            content TEXT,
            attachment TEXT,
            userid VARCHAR(30),
            msgid TEXT,
            channelid TEXT,
            guildid TEXT,
            msgtime DATETIME,
            nsfw INTEGER,
            mentions TEXT,
            foreign key (userid) references user(userid)            
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);

    db.query(`CREATE TABLE IF NOT EXISTs catchat (
            id INTEGER PRIMARY KEY AUTO_INCREMENT,
            content TEXT,
            attachment TEXT,
            msgid TEXT,
            channelid TEXT,
            guildid TEXT,
            msgtime DATETIME,
            nsfw INTEGER
                    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);

    db.query(`create table if not exists tag (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        author VARCHAR(30),
        contents TEXT,
        title TEXT,
        lastmodified DATETIME,
        foreign key (author) references user(userid)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);

    db.query(`create table if not exists username (
            id INTEGER PRIMARY KEY AUTO_INCREMENT,
            userid VARCHAR(30),
            username TEXT,
            namedate DATETIME DEFAULT CURRENT_TIMESTAMP,
            foreign key (userid) references user(userid)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);
    setTimeout(function () {
        users();
    }, 10000);
}
function users() {
    console.log('Migrating users');
    olddb.all(`select * from user`, (err, rows) => {
        if (err) {
            console.log(err);
            return;
        }
        var count = rows.length;
        function done() {
            usernames();
        }
        for (var i = 0; i < rows.length; i++) {
            db.query(`insert into user 
                        (userid, username, isbot, lastchannel, lastspoke, lastcommand, lastcommanddate, messagecount)
                        values (?, ?, ?, ?, ?, ?, ?, ?)`,
                [rows[i].userid, rows[i].username, rows[i].isbot, rows[i].lastchannel, rows[i].lastspoke, rows[i].lastcommand, rows[i].lastcommanddate, rows[i].messagecount],
                (err, result) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    count--;
                    console.log(count);
                    if (count == 0) {
                        done();
                    }
                });
        }
    });
}


function usernames() {
    console.log('Migrating usernames');

    olddb.all(`select * from username`, (err, rows) => {
        if (err) {
            console.log(err);
            return;
        }
        var count = rows.length;
        function done() {
            catchat();
        }
        for (var i = 0; i < rows.length; i++) {
            db.query(`insert into username
                        (id, userid, username, namedate)
                        values (?, ?, ?, ?)`,
                [rows[i].id, rows[i].userid, rows[i].username, rows[i].namedate],
                (err, result) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    count--;
                    console.log(count);

                    if (count == 0) {
                        done();
                    }
                })
        }
        //catchat()
    })
}

function catchat() {
    console.log('Migrating catchat')

    olddb.all(`select * from catchat`, (err, rows) => {
        if (err) {
            console.log(err)
            return
        }
        var count = rows.length
        function done() {
            modlog()
        }
        for (var i = 0; i < rows.length; i++) {
            db.query(`insert into catchat
                        (id, content, attachment, msgid, channelid, guildid, msgtime, nsfw)
                        values (?, ?, ?, ?, ?, ?, ?, ?)`,
                [rows[i].id, rows[i].content, rows[i].attachment, rows[i].msgid,
                    rows[i].channelid, rows[i].guildid, rows[i].msgtime, rows[i].nsfw],
                (err, result) => {
                    if (err) {
                        console.log(err)
                        return;
                    }
                    count--;
                    console.log(count)

                    if (count == 0) {
                        done()
                    }
                })
        }
        //  modlog()
    })
}

function modlog() {
    console.log('Migrating modlog')

    olddb.all(`select * from modlog`, (err, rows) => {
        if (err) {
            console.log(err)
            return
        }
        var count = rows.length
        function done() {
            //chatlogs()
            tag()
        }
        for (var i = 0; i < rows.length; i++) {
            db.query(`insert into modlog
                        (guildid, caseid, userid, modid, type, reason, msgid)
                        values (?, ?, ?, ?, ?, ?, ?)`,
                [rows[i].guildid, rows[i].caseid, rows[i].userid, rows[i].modid, rows[i].type,
                    rows[i].reason, rows[i].msgid],
                (err, result) => {
                    if (err) {
                        console.log(err)
                        return;
                    }
                    count--;
                    console.log(count)

                    if (count == 0) {
                        done()
                    }
                })
        }
        //   chatlogs()
    })
}

function chatlogs() {
    console.log('Migrating chatlogs')

    olddb.all(`select * from chatlogs`, (err, rows) => {
        if (err) {
            console.log(err)
            return
        }
        var count = rows.length
        function done() {
            tag()
        }
        for (var i = 0; i < rows.length; i++) {
            db.query(`insert into chatlogs
                        (id, content, attachment, userid, msgid, channelid, guildid, msgtime, nsfw, mentions)
                        values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [rows[i].id, rows[i].content, rows[i].attachment, rows[i].userid, rows[i].msgid, rows[i].channelid,
                    rows[i].guildid, rows[i].msgtime, rows[i].nsfw, rows[i].mentions],
                (err, result) => {
                    if (err) {
                        console.log(err)
                        return;
                    }
                    count--;
                    console.log(count)

                    if (count == 0) {
                        done()
                    }
                })
        }
        //    tag()
    })
}

function tag() {
    console.log('Migrating tags')

    olddb.all(`select * from tag`, (err, rows) => {
        if (err) {
            console.log(err)
            return
        }
        var count = rows.length
        function done() {
            vars()
        }
        for (var i = 0; i < rows.length; i++) {
            db.query(`insert into tag
                        (id, author, contents, title, lastmodified)
                        values (?, ?, ?, ?, ?)`,
                [rows[i].id, rows[i].author, rows[i].contents, rows[i].title, rows[i].lastmodified],
                (err, result) => {
                    if (err) {
                        console.log(err)
                        return;
                    }
                    count--;
                    console.log(count)

                    if (count == 0) {
                        done()
                    }
                })
        }
        //   vars()
    })
}

function vars() {
    console.log('Migrating vars')

    olddb.all(`select * from vars`, (err, rows) => {
        if (err) {
            console.log(err)
            return
        }
        var count = rows.length
        function done() {
            console.log('We\'re all done here!')
        }
        for (var i = 0; i < rows.length; i++) {
            db.query(`insert into vars
                        (varname, varvalue)
                        values (?, ?)`,
                [rows[i].varname, rows[i].varvalue],
                (err, result) => {
                    if (err) {
                        console.log(err)
                        return;
                    }
                    count--;
                    console.log(count)

                    if (count == 0) {
                        done()
                    }
                })
        }
    })
}