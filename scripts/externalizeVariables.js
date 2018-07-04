global.config = require('../config.json');
const rethinkdbdash = require('rethinkdbdash');

global.r = require('rethinkdbdash')({
    host: config.db.host,
    db: config.db.database,
    password: config.db.password,
    user: config.db.user,
    port: config.db.port,
    max: 50,
    buffer: 5,
    timeoutError: 10000
});

console.database = console.module = console.init = () => { };

const client = {
    models: {},
    database: null
};

const Database = require('../src/core/Database');
client.database = new Database(client);

const s = client.database.sequelize;

let values = [];
async function prepare(type, name, scope, content) {
    if (content) {
        if (typeof content === 'object')
            content = JSON.stringify(content);
        if (typeof content !== 'string')
            content = content.toString();

        values.push({
            name: name.substring(0, 255), type, scope: scope.substring(0, 255), content
        });
    }
}
async function bulkInsert() {
    await client.models.BBTagVariable.bulkCreate(values);
    values = [];
}

async function error(err) {
    console.error(err.stack);
    if (err.errors) {
        for (const e of err.errors) {
            console.error(e.path, e.validatorKey, e.value);
        }
    }
    values = [];
}

async function externalize() {
    // guilds
    console.log('Loading guilds...');
    let curr = await r.table('guild').run({ cursor: true });
    console.log('Loaded guilds.');
    let id;
    let i;
    try {
        let guild;
        i = 0;
        while (guild = await curr.next()) {
            id = guild.guildid;
            let toSet = {
                vars: null,
                tagVars: null,
                ccommands: {}
            };
            if (guild.vars) {
                for (const key in guild.vars) {
                    let v = guild.vars[key];
                    await prepare('GUILD_CC', key, guild.guildid, v);
                }
            }
            if (guild.tagVars) {
                for (const key in guild.tagVars) {
                    let v = guild.tagVars[key];
                    await prepare('GUILD_TAG', key, guild.guildid, v);
                }
            }
            if (guild.ccommands) {
                for (const cckey in guild.ccommands) {
                    let cc = guild.ccommands[cckey];
                    if (cc.vars) {
                        toSet.ccommands[cckey] = {};
                        toSet.ccommands[cckey].vars = null;
                        for (const key in cc.vars) {
                            let v = cc.vars[key];
                            await prepare('LOCAL_CC', key, guild.guildid + '_' + cckey, v);
                        }
                    }
                }
            }
            if (values.length > 0) {
                await bulkInsert();
                // await r.table('guild').get(guild.guildid).update(toSet);
            }
            if (++i % 100000 === 0)
                console.log('Processed', i, 'guilds.');
        }
        console.log('Finished guilds.');
    } catch (err) {
        await error(err);
    }

    // users
    console.log('Loading users...');
    curr = await r.table('user').run({ cursor: true });
    console.log('Loaded users.');
    try {
        let user;
        i = 0;
        while (user = await curr.next()) {
            id = user.userid;
            let toSet = {
                vars: null
            };
            if (user.vars) {
                for (const key in user.vars) {
                    let v = user.vars[key];
                    await prepare('AUTHOR', key, user.userid, v);
                }
            }
            if (values.length > 0) {
                await bulkInsert();
                // await r.table('user').get(user.userid).update(toSet);
            }
            if (++i % 100000 === 0)
                console.log('Processed', i, 'users.');
        }
        console.log('Finished users.');
    } catch (err) {
        await error(err);
    }

    // users
    console.log('Loading tags...');
    curr = await r.table('tag').run({ cursor: true });
    console.log('Loaded tags.');
    try {
        let tag;
        i = 0;
        while (tag = await curr.next()) {
            id = tag.userid;
            let toSet = {
                vars: null
            };
            if (tag.vars) {
                for (const key in tag.vars) {
                    let v = tag.vars[key];
                    await prepare('LOCAL_TAG', key, tag.name, v);
                }
            }
            if (values.length > 0) {
                await bulkInsert();
                // await r.table('tag').get(tag.name).update(toSet);
            }
            if (++i % 100000 === 0)
                console.log('Processed', i, 'tags.');
        }
        console.log('Finished tags.');
    } catch (err) {
        await error(err);
    }

    // globals
    console.log('Loading globals...');
    let globs = await r.table('vars').get('tagVars');
    console.log('Loaded globals.');
    try {
        if (globs.values) {
            for (const key in globs.values) {
                let v = globs.values[key];
                await prepare('GLOBAL', key, '', v);
            }
        }
        if (values.length > 0) {
            await bulkInsert();
            // await r.table('vars').get('tagVars').update({
            //     values: null
            // });
        }
        console.log('Finished tags.');
    } catch (err) {
        await error(err);
    }

}

async function main() {
    await client.database.authenticate();
    await externalize();
}

main().then(() => { console.log('Done!'); process.exit() }).catch(err => { console.error(err); process.exit() });