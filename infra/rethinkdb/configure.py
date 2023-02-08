from rethinkdb import RethinkDB
import time
import os

def ensure_database(r, conn, database):
    databases = r.db_list().run(conn)
    if database not in databases:
        r.db_create(database).run(conn)

def seedUser(r, conn, userid, password):
    r.db('rethinkdb').table('users').insert({'id': userid, 'password': password}).run(conn)
    r.grant(userid, {'read': True, 'write': True, 'config': False}).run(conn)

def createTable(r, conn, table, key, indexes=[]):
    r.table_create(table, primary_key = key).run(conn)
    for entry in indexes:
        index = entry[0]
        func = entry[1]
        multi = entry[2] if len(entry) > 2 else False
        r.table(table).index_create(index, func, multi=multi).run(conn)

def createTables(r, conn):
    createTable(r, conn, 'events', 'id', [
        ('endtime', lambda doc: doc['endtime']),
        ('msg', lambda doc: doc['msg']),
        ('type', lambda doc: doc['type'])
    ])
    createTable(r, conn, 'guild', 'guildid', [
        ('interval', lambda doc: doc.has_fields('interval'))
    ])
    createTable(r, conn, 'logs', 'keycode')
    createTable(r, conn, 'snippet', 'id')
    createTable(r, conn, 'stats', 'id', [('uses', lambda doc: doc['uses'])])
    createTable(r, conn, 'tag', 'name', [
        ('author', lambda doc: doc['author']), 
        ('user_favourite', lambda doc: r.branch(doc.has_fields('favourites'), doc['favourites'].keys().filter(lambda key: doc['favourites'][key]), []), True)
    ])
    createTable(r, conn, 'user', 'userid', [
        ('favourite_tag', lambda doc: r.branch(doc.has_fields('favourites'), doc['favourites'].keys(), []))
    ])
    createTable(r, conn, 'vars', 'varname')

def seedTables(r, conn):
    r.table('vars').insert({'varname': 'tagVars', 'values': {}}).run(conn)
    r.table('vars').insert({'varname': 'arwhitelist', 'values': []}).run(conn)
    r.table('vars').insert({'varname': 'guildBlacklist', 'values': []}).run(conn)
    r.table('vars').insert({'varname': 'blacklist', 'users': [], 'guilds': []}).run(conn)
    r.table('vars').insert({'varname': 'whitelistedDomains', 'values': {}}).run(conn)
    r.table('vars').insert({'varname': 'changelog', 'guilds': {}}).run(conn)
    r.table('vars').insert({'varname': 'pg', 'value': 0}).run(conn)
    r.table('vars').insert({'varname': 'police', 'value': []}).run(conn)
    r.table('vars').insert({'varname': 'support', 'value': []}).run(conn)
    r.table('vars').insert({'varname': 'version', 'major': 0, 'minor': 0, 'patch': 0}).run(conn)

time.sleep(1)

userid = os.getenv('RETHINKDB_USERNAME')
password = os.getenv('RETHINKDB_PASSWORD')
database = os.getenv('RETHINKDB_DATABASE')

if database == None:
    database = 'test'

r = RethinkDB()
with r.connect() as conn:
    ensure_database(r, conn, database)

with r.connect(db = database) as conn:
    try:
        if userid != None and password != None:
            seedUser(r, conn, userid, password)
        createTables(r, conn)
        seedTables(r, conn)
    except:
        pass