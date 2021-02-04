const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const config = require('../config.json');

const r = require('rethinkdbdash')({
  host: config.db.host,
  db: config.db.database,
  password: config.db.password,
  user: config.db.user,
  port: config.db.port,
  max: 8,
  buffer: 4,
  timeoutError: 10000
});

let queuedWrites = [];
async function q(query) {
  queuedWrites.push(query);

  if (queuedWrites.length > 10000) {
    await flush();
  }
}

async function flush() {
  console.log('flushing %i records...', queuedWrites.length);
  await prisma.$transaction(queuedWrites);
  queuedWrites = [];
  console.log('finished flushing.');
}

async function main() {
  const feedbackBlacklist = await r.table('vars').get('blacklist');

  console.group('migrating users...');
  const userReports = {};
  const userIds = [];
  const userCursor = await await r.table('user').run({ cursor: true });
  await userCursor.eachAsync(async function(row) {
    if (row.reports) {
      userReports[row.userid] = row.reports;
    }
    userIds.push(row.userid);
    await q(prisma.user.create({
      data: {
        id: row.userid.toString(),
        isBot: !!row.isbot,
        timezone: row.timezone,
        username: row.username,
        discriminator: row.discriminator,
        avatarURL: row.avatarURL,
        prefixes: row.prefixes,
        blacklisted: row.blacklisted,
        feedbackBlacklisted: feedbackBlacklist.users.includes(row.userid),

        todos: {
          create: (row.todo || []).map(t => ({
            active: !!t.active,
            content: t.content
          }))
        },
        usernames: {
          create: (row.usernames || []).map(u => ({
            date: u.date,
            name: u.name
          }))
        }
      }
    }));

  });
  await flush();
  console.log('complete.');
  console.groupEnd();

  console.group('migrating tags...');
  const tagCursor = await await r.table('tag').run({ cursor: true });
  await tagCursor.eachAsync(async function(row) {
    if (!userIds.includes(row.author)) {
      console.log('Could not find a user corresponding to %s (%s), skipping', row.author, row.name);
      return;
    }
    await q(prisma.tag.create({
      data: {
        name: row.name,
        authorId: row.author.toString(),
        content: row.content,
        cooldown: row.cooldown || 0,
        uses: row.uses,
        updatedAt: typeof row.lastmodified === 'number' ? new Date(row.lastmodified) : row.lastmodified,
        lastUse: row.lastuse,

        favourites: {
          create: Object.entries(row.favourites || {}).filter(f => f[1]).map(f => ({
            userId: f[0]
          }))
        }
      }
    }));
  });
  for (const userId of Object.keys(userReports)) {
    const reports = userReports[userId];
    for (const name of Object.keys(reports)) {
      await q(prisma.userTagReport.create({
        data: {
          userId,
          tagName: name,
          message: reports[name]
        }
      }));
    }
  }
  await flush();
  console.log('complete.');
  console.groupEnd();

  console.group('migrating guilds...');
  const guildBlacklist = await r.table('vars').get('guildBlacklist');
  const arWhitelist = await r.table('vars').get('arwhitelist');
  const changelogChannels = await r.table('vars').get('changelog');

  const guildCursor = await await r.table('guild').run({ cursor: true });
  await guildCursor.eachAsync(async function(row) {
    const settings = row.settings || {};
    const announce = row.announce || {};

    const farewell = row.farewell;
    const greeting = row.greeting;
    const censor = row.censor || {};

    const customCommands = {};
    if (row.ccommands) {
      for (const [key, value] of Object.entries(row.ccommands)) {
        customCommands[key] = {
          name: key,
          author: value.author || value.authorizer || '1',
          authorizer: value.authorizer || value.author || '1',
          content: value.content,
          alias: value.alias,
          roles: value.roles,
          hidden: value.hidden,
          managed: value.managed,
          flags: value.flags
        };
      }
    }

    if (farewell) {
      const obj = {
        author: farewell.author || farewell.authorizer || '1',
        authorizer: farewell.authorizer || farewell.author || '1',
        content: farewell.content,
        hidden: true
      };
      if (customCommands._farewell) {
        console.log('In guild %s _farewell exists, falling back', row.guildid);
        if (!customCommands._original_farewell) {
          customCommands._original_farewell = {
            name: '_original_farewell',
            ...obj
          };
        } else {
          console.log('  Could not fall back');
        }
      } else {
        customCommands._farewell = {
          name: '_farewell',
          ...obj
        };
      }
    }

    if (greeting) {
      const obj = {
        author: greeting.author || greeting.authorizer || '1',
        authorizer: greeting.authorizer || greeting.author || '1',
        content: greeting.content,
        hidden: true
      };
      if (customCommands._greeting) {
        console.log('In guild %s _greeting exists, falling back', row.guildid);
        if (!customCommands._original_greeting) {
          customCommands._original_farewell = {
            name: '_original_greeting',
            ...obj
          };
        } else {
          console.log('  Could not fall back');
        }
      } else {
        customCommands._greeting = {
          name: '_greeting',
          ...obj
        };
      }
    }

    const votebans = [];
    if (row.voteban) {
      for (const key of Object.keys(row.voteban)) {
        for (const vote of row.voteban[key]) {
          votebans.push({
            userId: key,
            voterId: vote.id,
            reason: vote.reason
          });
        }
      }
    }

    const autoresponses = [];
    if (row.autoresponse) {
      const ar = row.autoresponse;
      if (ar.everything) {
        autoresponses.push({
          id: Number(ar.everything.executes.match(/_autoresponse_(\d+)/)[1]),
          executes: ar.everything.executes,
          regex: false,
          term: "",
          everything: true
        });
      }
      for (const response of ar.list) {
        if (response) {
          autoresponses.push({
            id: Number(response.executes.match(/_autoresponse_(\d+)/)[1]),
            executes: response.executes,
            regex: response.regex,
            term: response.term,
            everything: false
          });
        }
      }
    }

    await q(prisma.guild.create({
      data: {
        id: row.guildid,
        name: row.name || "unknown guild",
        active: row.active === true || row.active === 1,
        blacklisted: !!guildBlacklist.values[row.guildid],
        feedbackBlacklisted: feedbackBlacklist.guilds.includes(row.userid),

        autoresponseWhitelisted: arWhitelist.values.includes(row.guildid),
        autoresponseApplied: false,

        antiMention: Number(settings.antimention || 0),
        banAt: Number(settings.banat || 0),
        kickAt: Number(settings.kickat || 0),
        deleteNotif: settings.deletenotif == '1' || settings.deletenotif === true,
        dmHelp: settings.dmhelp === true || settings.dmhelp == '1',
        farewellChannel: settings.farewellchan,
        greetingChannel: settings.greetchan,
        makeLogs: settings.makelogs,
        modlog: settings.modlog,
        social: settings.social,
        permOverride: settings.permoverride,
        adminRole: settings.adminrole,
        staffPerms: settings.staffperms ? Number(settings.staffperms) || undefined : undefined,
        kickOverride: settings.kickoverride ? parseInt(settings.kickoveride) || undefined : undefined,
        banOverride: settings.banoverride ? parseInt(settings.banoveride) || undefined : undefined,
        cahNSFW: settings.cahnsfw === true || settings.cahnsfw == '1',
        tableflip: settings.tableflip === true || settings.tableflip == '1',
        disableNoPerms: settings.disablenoperms,
        disableEveryonePings: settings.disableeveryone,
        disableCleverbot: settings.nocleverbot,
        announcementChannel: announce.channel,
        announcementRole: announce.role,
        changelogChannel: changelogChannels.guilds[row.guildid],
        prefixes: settings.prefix,

        censorChannelExceptions: censor.exception && censor.exception.channel,
        censorRoleExceptions: censor.exception && censor.exception.role,
        censorUserExceptions: censor.exception && censor.exception.user,
        censorDeleteMessage: censor.rule && censor.rule.deleteMessage,
        censorKickMessage: censor.rule && censor.rule.kickMessage,
        censorBanMessage: censor.rule && censor.rule.banMessage,

        logIgnore: row.logIgnore,

        customCommands: {
          create: Object.values(customCommands)
        },
        modlogEntries: {
          create: (row.modlog || []).map(m => ({
            id: m.caseid,
            msgId: m.msgid,
            type: m.type,
            reason: m.reason,
            userId: m.userid,
            modId: m.modid
          }))
        },
        rolemes: {
          create: (row.roleme || []).map(m => ({
            add: m.add,
            remove: m.remove,
            channels: m.channels,
            message: m.message,
            caseSensitive: m.casesensitive
          }))
        },
        votebans: {
          create: votebans
        },
        warnings: {
          create: Object.entries(row.warnings || {}).map(m => ({
            userId: m[0],
            warnings: parseInt(m[1]) || 0
          }))
        },
        censors: {
          create: (censor.list || []).map(m => ({
            regex: m.regex,
            term: m.term,
            deleteMessage: m.deleteMessage,
            kickMessage: m.kickMessage,
            banMessage: m.banMessage,
            weight: Number(m.weight)
          }))
        },
        channels: {
          create: Object.entries(row.channels || {}).map(m => ({
            channelId: m[0],
            blacklisted: !!m[1].blacklisted
          }))
        },
        commands: {
          create: Object.entries(row.commands || {}).map(m => ({
            name: m[0],
            disabled: m[1].disabled,
            permission: m[1].permission ? Number(m[1].permission) : undefined,
            roles: m[1].rolename
          }))
        },
        logs: {
          create: Object.entries(row.log || {}).map(m => ({
            event: m[0],
            channelId: m[1]
          }))
        },
        autoresponses: {
          create: autoresponses
        }
      }
    }));
  });
  for (const userId of Object.keys(userReports)) {
    const reports = userReports[userId];
    for (const name of Object.keys(reports)) {
      await q(prisma.userTagReport.create({
        data: {
          userId,
          tagName: name,
          message: reports[name]
        }
      }));
    }
  }
  await flush();
  console.log('complete.');
  console.groupEnd();

  console.group('migrating compiled chatlogs...');
  const chatlogsCursor = await await r.table('tag').run({ cursor: true });
  await chatlogsCursor.eachAsync(async function(row) {
    if (!row.keycode || !row.channel) return;
    await q(prisma.compiledChatLog.create({
      data: {
        key: row.keycode.toString(),
        channel: row.channel,
        limit: row.limit || 0,
        types: row.types,
        users: row.users,
        ids: row.ids
      }
    }));
  });
  await flush();
  console.log('complete.');
  console.groupEnd();

  console.group('migrating everything else...');
  const domains = await r.table('vars').get('whitelistedDomains');
  for (const key of Object.keys(domains)) {
    if (domains[key]) {
      await q(prisma.domainWhitelist.create({
        data: {
          domain: key,
          allowed: true
        }
      }));
    }
  }

  const version = await r.table('vars').get('version');
  await q(prisma.global.create({
    data: {
      id: 0,
      versionMajor: version.major,
      versionMinor: version.minor,
      versionPatch: version.patch
    }
  }));

  const pg = await r.table('vars').get('pg');
  if (pg) {
    await q(prisma.misc.create({
      data: {
        key: 'pg',
        value: pg.value.toString()
      }
    }));
  }
  await flush();
  console.log('complete.');
  console.groupEnd();
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit();
  });