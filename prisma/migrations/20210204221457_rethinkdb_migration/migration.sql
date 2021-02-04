-- AlterTable
ALTER TABLE "bbtag_variables" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Guild" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "blacklisted" BOOLEAN NOT NULL DEFAULT false,
    "feedbackBlacklisted" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "autoresponseWhitelisted" BOOLEAN NOT NULL DEFAULT false,
    "autoresponseApplied" BOOLEAN NOT NULL DEFAULT false,
    "antiMention" INTEGER NOT NULL DEFAULT 0,
    "banAt" INTEGER NOT NULL DEFAULT 0,
    "kickAt" INTEGER NOT NULL DEFAULT 0,
    "deleteNotif" BOOLEAN NOT NULL DEFAULT false,
    "dmHelp" BOOLEAN NOT NULL DEFAULT false,
    "farewellChannel" TEXT,
    "greetingChannel" TEXT,
    "makeLogs" BOOLEAN NOT NULL DEFAULT false,
    "modlog" TEXT,
    "mutedRole" TEXT,
    "social" BOOLEAN NOT NULL DEFAULT true,
    "permOverride" BOOLEAN NOT NULL DEFAULT true,
    "adminRole" TEXT,
    "staffPerms" INTEGER,
    "kickOverride" INTEGER,
    "banOverride" INTEGER,
    "cahNSFW" BOOLEAN NOT NULL DEFAULT false,
    "tableflip" BOOLEAN NOT NULL DEFAULT false,
    "disableNoPerms" BOOLEAN NOT NULL DEFAULT false,
    "disableEveryonePings" BOOLEAN NOT NULL DEFAULT false,
    "disableCleverbot" BOOLEAN NOT NULL DEFAULT true,
    "announcementChannel" TEXT,
    "announcementRole" TEXT,
    "changelogChannel" TEXT,
    "prefixes" TEXT[],
    "censorChannelExceptions" TEXT[],
    "censorRoleExceptions" TEXT[],
    "censorUserExceptions" TEXT[],
    "censorDeleteMessage" TEXT,
    "censorKickMessage" TEXT,
    "censorBanMessage" TEXT,
    "logIgnore" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuildCustomCommand" (
    "guildId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "authorizer" TEXT NOT NULL,
    "content" TEXT,
    "alias" TEXT,
    "roles" TEXT[],
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "managed" BOOLEAN NOT NULL DEFAULT false,
    "flags" JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("name","guildId")
);

-- CreateTable
CREATE TABLE "GuildModlogEntry" (
    "guildId" TEXT NOT NULL,
    "id" SERIAL NOT NULL,
    "msgId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "modId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("guildId","id")
);

-- CreateTable
CREATE TABLE "GuildRoleme" (
    "guildId" TEXT NOT NULL,
    "id" SERIAL NOT NULL,
    "add" TEXT[],
    "remove" TEXT[],
    "channels" TEXT[],
    "message" TEXT NOT NULL,
    "caseSensitive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("guildId","id")
);

-- CreateTable
CREATE TABLE "GuildVoteban" (
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("guildId","userId","voterId")
);

-- CreateTable
CREATE TABLE "GuildWarning" (
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "warnings" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("guildId","userId")
);

-- CreateTable
CREATE TABLE "GuildCensor" (
    "guildId" TEXT NOT NULL,
    "id" SERIAL NOT NULL,
    "regex" BOOLEAN NOT NULL DEFAULT false,
    "term" TEXT NOT NULL,
    "deleteMessage" TEXT,
    "kickMessage" TEXT,
    "banMessage" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("guildId","id")
);

-- CreateTable
CREATE TABLE "GuildChannel" (
    "guildId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "blacklisted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("guildId","channelId")
);

-- CreateTable
CREATE TABLE "GuildCommand" (
    "guildId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "permission" INTEGER,
    "roles" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("guildId","name")
);

-- CreateTable
CREATE TABLE "GuildLog" (
    "guildId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("guildId","event")
);

-- CreateTable
CREATE TABLE "GuildAutoresponse" (
    "guildId" TEXT NOT NULL,
    "id" SERIAL NOT NULL,
    "executes" TEXT NOT NULL,
    "regex" BOOLEAN NOT NULL DEFAULT false,
    "term" TEXT NOT NULL,
    "everything" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("guildId","id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT,
    "username" TEXT,
    "discriminator" TEXT,
    "avatarURL" TEXT,
    "prefixes" TEXT[],
    "blacklisted" TEXT,
    "feedbackBlacklisted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roles" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "UserTodo" (
    "userId" TEXT NOT NULL,
    "id" SERIAL NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("userId","id")
);

-- CreateTable
CREATE TABLE "UserName" (
    "userId" TEXT NOT NULL,
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("userId","id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "name" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "uses" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "cooldown" INTEGER NOT NULL DEFAULT 0,
    "lastUse" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "UserTagFavourite" (
    "userId" TEXT NOT NULL,
    "tagName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("userId","tagName")
);

-- CreateTable
CREATE TABLE "UserTagReport" (
    "userId" TEXT NOT NULL,
    "tagName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("userId","tagName")
);

-- CreateTable
CREATE TABLE "DomainWhitelist" (
    "domain" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("domain")
);

-- CreateTable
CREATE TABLE "Global" (
    "id" INTEGER NOT NULL,
    "versionMajor" INTEGER NOT NULL,
    "versionMinor" INTEGER NOT NULL,
    "versionPatch" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Misc" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "CompiledChatLog" (
    "key" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "limit" INTEGER NOT NULL,
    "types" INTEGER[],
    "users" TEXT[],
    "ids" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("key")
);

-- AddForeignKey
ALTER TABLE "GuildCustomCommand" ADD FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildModlogEntry" ADD FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildRoleme" ADD FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildVoteban" ADD FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildWarning" ADD FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildCensor" ADD FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildChannel" ADD FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildCommand" ADD FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildLog" ADD FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildAutoresponse" ADD FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTodo" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserName" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTagFavourite" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTagFavourite" ADD FOREIGN KEY ("tagName") REFERENCES "Tag"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTagReport" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTagReport" ADD FOREIGN KEY ("tagName") REFERENCES "Tag"("name") ON DELETE CASCADE ON UPDATE CASCADE;
