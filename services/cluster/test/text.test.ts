import { Command } from '@blargbot/cluster/command/index.js';
import templates from '@blargbot/cluster/text.js';
import { CommandType } from '@blargbot/cluster/utils/index.js';
import * as coreTransformers from '@blargbot/core/formatting/index.js';
import { transformers, util } from '@blargbot/formatting';
import { quickMock } from '@blargbot/test-util/quickMock.js';
import { runFormatTreeTests } from '@blargbot/test-util/runFormatTreeTests.js';
import chai from 'chai';
import * as Eris from 'eris';
import mocha from 'mocha';
import moment from 'moment-timezone';

class TestCommand extends Command {
    public isVisible: Command['isVisible'] = () => {
        throw new Error('Method not implemented.');
    };
    public execute: Command['execute'] = () => {
        throw new Error('Method not implemented.');
    };
}
const command = (): Command => new TestCommand({
    category: CommandType.GENERAL,
    name: '',
    signatures: []
});
const client = (): Eris.Client => new Eris.Client('');
const guild = (): Eris.Guild => Object.assign(new Eris.Guild({ id: '' }, client()), {
    shard: new Eris.Shard(0, client())
});
const user = (): Eris.User => new Eris.User({ id: '' }, client());
const member = (): Eris.Member => new Eris.Member({ id: '', user: { id: '' } }, guild(), client());
const role = (): Eris.Role => new Eris.Role({ id: '' }, guild());
const channel = (): Eris.Channel => new Eris.Channel({ id: '' }, client());
const guildChannel = (): Eris.GuildChannel => new Eris.GuildChannel({ id: '' }, client());
const members = (): Eris.Collection<Eris.Member> => new Eris.Collection<Eris.Member>(Eris.Member);
const activity: () => Eris.Activity = () => ({
    created_at: 0,
    name: '',
    type: 0
});
const webhook: () => Eris.Webhook = () => ({
    application_id: '',
    avatar: '',
    channel_id: '',
    guild_id: '',
    id: '',
    name: '',
    source_guild: {
        icon: null,
        id: '',
        name: ''
    },
    type: 1
});

mocha.describe('Cluster format strings', () => {
    runFormatTreeTests(templates, {
        transformers: {
            ...transformers,
            ...coreTransformers
        }
    }, {
        common: {
            query: {
                cancel: 'Cancel',
                cantUse: '❌ This isn\'t for you to use!',
                choose: {
                    paged: [
                        {
                            name: 'with content',
                            input: [{ content: util.literal('some content'), page: 123, pageCount: 456 }],
                            expected: 'some content\nPage 123/456'
                        },
                        {
                            name: 'no content',
                            input: [{ page: 123, pageCount: 456 }],
                            expected: 'Page 123/456'
                        }
                    ]
                },
                user: {
                    prompt: {
                        default: 'ℹ️ Please select a user from the drop down',
                        filtered: [
                            {
                                name: 'default',
                                input: [{ filter: 'my cool filter' }],
                                expected: 'ℹ️ Multiple users matching `my cool filter` found! Please select one from the drop down.'
                            }
                        ]
                    },
                    placeholder: 'Select a user',
                    choice: {
                        label: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { username: 'userUsername', discriminator: 'userDiscriminator' }) }],
                                expected: 'userUsername#userDiscriminator'
                            }
                        ],
                        description: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { id: 'userId' }) }],
                                expected: 'Id: userId'
                            }
                        ]
                    }
                },
                member: {
                    prompt: {
                        default: 'ℹ️ Please select a user from the drop down',
                        filtered: [
                            {
                                name: 'default',
                                input: [{ filter: 'my cool filter' }],
                                expected: 'ℹ️ Multiple users matching `my cool filter` found! Please select one from the drop down.'
                            }
                        ]
                    },
                    placeholder: 'Select a user',
                    choice: {
                        label: [
                            {
                                name: 'with nickname',
                                input: [{ member: quickMock(member, { nick: 'memberNickHere', username: 'memberUsername', discriminator: 'memberDiscriminatorHere' }) }],
                                expected: 'memberNickHere (memberUsername#memberDiscriminatorHere)'
                            },
                            {
                                name: 'without nickname',
                                input: [{ member: quickMock(member, { username: 'memberUsername', discriminator: 'memberDiscriminatorHere' }) }],
                                expected: 'memberUsername (memberUsername#memberDiscriminatorHere)'
                            }
                        ],
                        description: [
                            {
                                name: 'default',
                                input: [{ member: quickMock(member, { id: 'memberId' }) }],
                                expected: 'Id: memberId'
                            }
                        ]
                    }
                },
                sender: {
                    prompt: {
                        default: 'ℹ️ Please select a user or webhook from the drop down',
                        filtered: [
                            {
                                name: 'default',
                                input: [{ filter: 'my cool filter' }],
                                expected: 'ℹ️ Multiple users or webhooks matching `my cool filter` found! Please select one from the drop down.'
                            }
                        ]
                    },
                    placeholder: 'Select a user or webhook',
                    choice: {
                        label: {
                            user: [
                                {
                                    name: 'default',
                                    input: [{ user: quickMock(user, { username: 'userUsername', discriminator: 'userDiscriminator' }) }],
                                    expected: 'userUsername#userDiscriminator'
                                }
                            ],
                            webhook: [
                                {
                                    name: 'default',
                                    input: [{ webhook: quickMock(webhook, { name: 'webhookName' }) }],
                                    expected: 'webhookName'
                                }
                            ]
                        },
                        description: [
                            {
                                name: 'with user',
                                input: [{ sender: quickMock(user, { id: 'senderAsUserId' }) }],
                                expected: 'Id: senderAsUserId'
                            },
                            {
                                name: 'with webhook',
                                input: [{ sender: quickMock(webhook, { id: 'senderAsWebhookId' }) }],
                                expected: 'Id: senderAsWebhookId'
                            }
                        ]
                    }
                },
                role: {
                    prompt: {
                        default: 'ℹ️ Please select a role from the drop down',
                        filtered: [
                            {
                                name: 'default',
                                input: [{ filter: 'my cool filter' }],
                                expected: 'ℹ️ Multiple roles matching `my cool filter` found! Please select one from the drop down.'
                            }
                        ]
                    },
                    placeholder: 'Select a role',
                    choice: {
                        label: [
                            {
                                name: 'default',
                                input: [{ role: quickMock(role, { name: 'roleName' }) }],
                                expected: 'roleName'
                            }
                        ],
                        description: [
                            {
                                name: 'default',
                                input: [{ role: quickMock(role, { id: 'roleId', color: 12345678 }) }],
                                expected: 'Id: roleId Color: bc614e'
                            }
                        ]
                    }
                },
                channel: {
                    prompt: {
                        default: 'ℹ️ Please select a channel from the drop down',
                        filtered: [
                            {
                                name: 'default',
                                input: [{ filter: 'my cool filter' }],
                                expected: 'ℹ️ Multiple channel matching `my cool filter` found! Please select one from the drop down.'
                            }
                        ]
                    },
                    placeholder: 'Select a channel',
                    choice: {
                        label: {
                            guild: [
                                {
                                    name: 'default',
                                    input: [{ channel: quickMock(guildChannel, { name: 'channelName' }) }],
                                    expected: 'channelName'
                                }
                            ],
                            dm: 'DM'
                        },
                        description: [
                            {
                                name: 'with parent',
                                input: [{ channel: quickMock(channel, { id: 'channelId' }), parent: { label: util.literal('parent label'), emoji: '🤔' } }],
                                expected: 'Id: channelId🤔 parent label'
                            },
                            {
                                name: 'without parent',
                                input: [{ channel: quickMock(channel, { id: 'channelId' }) }],
                                expected: 'Id: channelId'
                            }
                        ]
                    }
                },
                paged: {
                    prompt: [
                        {
                            name: 'with header',
                            input: [{ header: util.literal('header text'), page: 123, pageCount: 456, content: util.literal('some content') }],
                            expected: 'header text\nPage **#123/456**\nsome content\nType a number between **1 and 456** to view that page.'
                        },
                        {
                            name: 'without header',
                            input: [{ page: 123, pageCount: 456, content: util.literal('some content') }],
                            expected: 'Page **#123/456**\nsome content\nType a number between **1 and 456** to view that page.'
                        }
                    ]
                }
            }
        },
        regex: {
            tooLong: '❌ Regex is too long!',
            invalid: '❌ Regex is invalid!',
            unsafe: '❌ Regex is unsafe!\nIf you are 100% sure your regex is valid, it has likely been blocked due to how I detect catastrophic backtracking.\nYou can find more info about catastrophic backtracking here: <https://www.regular-expressions.info/catastrophic.html>',
            matchesEverything: '❌ Your regex cannot match everything!'
        },
        respawn: {
            success: [
                {
                    name: 'default',
                    input: [{ duration: moment.duration(1234567) }],
                    expected: 'Ok I\'m back. It took me 20 minutes, 34 seconds and 567 milliseconds'
                }
            ]
        },
        roleme: {
            failed: 'A roleme was triggered, but I don\'t have the permissions required to give you your role!'
        },
        poll: {
            embed: {
                footer: {
                    text: 'The poll will end'
                }
            },
            success: {
                noVotes: 'The votes are in! A total of **0** votes were collected!\n\n No one voted, how sad 😦',
                tie: [
                    {
                        name: 'single',
                        input: [{ total: 1, count: 1, winners: ['😦', '🤔'] }],
                        expected: 'The votes are in! A total of **1** vote was collected!\n\n It was a tie between these choices at **1** vote each:\n\n😦 and 🤔'
                    },
                    {
                        name: 'multiple',
                        input: [{ total: 456, count: 123, winners: ['😦', '🤔'] }],
                        expected: 'The votes are in! A total of **456** votes were collected!\n\n It was a tie between these choices at **123** votes each:\n\n😦 and 🤔'
                    }
                ],
                single: [
                    {
                        name: 'single',
                        input: [{ total: 1, count: 1, winner: '🤔' }],
                        expected: 'The votes are in! A total of **1** vote was collected!\n\n At **1** vote, the winner is:\n\n🤔'
                    },
                    {
                        name: 'multiple',
                        input: [{ total: 456, count: 123, winner: '🤔' }],
                        expected: 'The votes are in! A total of **456** votes were collected!\n\n At **123** votes, the winner is:\n\n🤔'
                    }
                ]
            }
        },
        guild: {
            blacklisted: [
                {
                    name: 'default',
                    input: [{ guild: quickMock(guild, { name: 'guildName', id: 'guildId' }) }],
                    expected: 'Greetings! I regret to inform you that your guild, **guildName** (guildId), is on my blacklist. Sorry about that! I\'ll be leaving now. I hope you have a nice day.'
                }
            ],
            joined: [
                {
                    name: 'normal guild',
                    input: [{ guild: quickMock(guild, { name: 'guildName', id: 'guildId' }), botGuild: false, size: 789, userCount: 456, botCount: 123, botFraction: 0.8 }],
                    expected: '☑️ Guild: `guildName` (`guildId`)! \n    Total: **789** | Users: **456** | Bots: **123** | Percent: **80%**'
                },
                {
                    name: 'bot guild',
                    input: [{ guild: quickMock(guild, { name: 'guildName', id: 'guildId' }), botGuild: true, size: 789, userCount: 123, botCount: 456, botFraction: 0.8 }],
                    expected: '☑️ Guild: `guildName` (`guildId`)! - ***BOT GUILD***\n    Total: **789** | Users: **123** | Bots: **456** | Percent: **80%**'
                }
            ]
        },
        autoresponse: {
            prompt: [
                {
                    name: 'default',
                    input: [{ guild: quickMock(guild, { name: 'guildName', id: 'guildId', members: quickMock(members, { size: 123 }) }), channelId: 'channelId', reason: 'my cool reason', code: 'super secret code', user: quickMock(user, { username: 'userUsername', discriminator: 'userDiscriminator', mention: '<@userId>' }) }],
                    expected: 'New AR request from **userUsername#userDiscriminator** (<@userId>):\n**Guild**: guildName (guildId)\n**Channel**: channelId\n**Members**: 123\n\nmy cool reason\n\n```js\nsuper secret code\n```'
                }
            ],
            whitelist: {
                approved: '✅ Congratz, your guild has been whitelisted for autoresponses! 🎉\n*It may take up to 15 minutes for them to become available*',
                rejected: '❌ Sorry, your guild has been rejected for autoresponses. 😿'
            }
        },
        announcements: {
            prompt: {
                channel: 'ℹ️ Please select the channel that announcements should be put in.',
                role: 'ℹ️ Please select the role to mention when announcing.'
            }
        },
        modlog: {
            defaultReason: [
                {
                    name: 'default',
                    input: [{ prefix: '~', caseId: 123 }],
                    expected: 'Responsible moderator, please do `~reason 123` to set.'
                }
            ],
            types: {
                generic: 'Generic',
                pardon: 'Pardon',
                timeout: 'Timeout',
                timeoutClear: 'Timeout Clear',
                softBan: 'Soft Ban',
                ban: 'Ban',
                massBan: 'Mass Ban',
                unban: 'Unban',
                kick: 'Kick',
                unmute: 'Unmute',
                mute: 'Mute',
                temporaryMute: 'Temporary Mute',
                warning: 'Warning'
            },
            embed: {
                title: [
                    {
                        name: 'default',
                        input: [{ caseId: 123 }],
                        expected: 'Case 123'
                    }
                ],
                description: [
                    {
                        name: 'default',
                        input: [{
                            users: [
                                quickMock(user, { username: 'user1Username', discriminator: 'user1Discriminator', id: 'user1Id' }),
                                quickMock(user, { username: 'user2Username', discriminator: 'user2Discriminator', id: 'user2Id' }),
                                quickMock(user, { username: 'user3Username', discriminator: 'user3Discriminator', id: 'user3Id' })
                            ]
                        }],
                        expected: 'user1Username#user1Discriminator (user1Id)\nuser2Username#user2Discriminator (user2Id)\nuser3Username#user3Discriminator (user3Id)'
                    }
                ],
                footer: {
                    text: [
                        {
                            name: 'default',
                            input: [{ user: quickMock(user, { username: 'userUsername', discriminator: 'userDiscriminator', id: 'userId' }) }],
                            expected: 'userUsername#userDiscriminator (userId)'
                        }
                    ]
                },
                field: {
                    type: {
                        name: 'Type'
                    },
                    reason: {
                        name: 'Reason',
                        value: [
                            {
                                name: 'default',
                                input: [{ reason: util.literal('My cool reason') }],
                                expected: 'My cool reason'
                            }
                        ]
                    },
                    pardons: {
                        name: 'Pardons',
                        value: [
                            {
                                name: 'default',
                                input: [{ count: 123, warnings: 456 }],
                                expected: 'Assigned: 123\nNew Total: 456'
                            }
                        ]
                    },
                    warnings: {
                        name: 'Warnings',
                        value: [
                            {
                                name: 'default',
                                input: [{ count: 123, warnings: 456 }],
                                expected: 'Assigned: 123\nNew Total: 456'
                            }
                        ]
                    },
                    duration: {
                        name: 'Duration',
                        value: [
                            {
                                name: 'default',
                                input: [{ duration: moment.duration(1234567) }],
                                expected: '20 minutes, 34 seconds and 567 milliseconds'
                            }
                        ]
                    },
                    user: {
                        name: 'User',
                        value: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { username: 'userUsername', discriminator: 'userDiscriminator', id: 'userId' }) }],
                                expected: 'userUsername#userDiscriminator (userId)'
                            }
                        ]
                    }
                }
            }
        },
        eventLog: {
            disabled: [
                {
                    name: 'default',
                    input: [{ event: 'eventName', channel: quickMock(channel, { mention: '<#channelId>' }) }],
                    expected: '❌ Disabled logging of the `eventName` event because the channel <#channelId> doesn\'t exist or I don\'t have permission to post messages in it!'
                }
            ],
            events: {
                timeoutAdded: 'ℹ️ User Was Timed Out',
                timeoutRemoved: 'ℹ️ User Timeout Was Removed',
                banned: 'ℹ️ User was banned',
                unbanned: 'ℹ️ User Was Unbanned',
                joined: 'ℹ️ User Joined',
                left: 'ℹ️ User Left',
                messageDeleted: 'ℹ️ Message Deleted',
                messageUpdated: 'ℹ️ Message Updated',
                roleRemoved: 'ℹ️ Special Role Removed',
                roleAdded: 'ℹ️ Special Role Added',
                nicknameUpdated: 'ℹ️ Nickname Updated',
                usernameUpdated: 'ℹ️ Username Updated',
                avatarUpdated: 'ℹ️ Avatar Updated'
            },
            embed: {
                description: {
                    avatarUpdated: '➡️ Old avatar\n⬇️ New avatar',
                    bulkDelete: 'Bulk Message Delete',
                    userUpdated: {
                        username: 'Username changed.',
                        discriminator: 'Discriminator changed.',
                        both: 'Username changed.\nDiscriminator changed.'
                    }
                },
                field: {
                    reason: {
                        name: 'Reason',
                        value: [
                            {
                                name: 'default',
                                input: [{ reason: 'My cool reason' }],
                                expected: 'My cool reason'
                            }
                        ]
                    },
                    message: {
                        name: 'Message Id',
                        value: [
                            {
                                name: 'default',
                                input: [{ messageId: 'someMessageId' }],
                                expected: 'someMessageId'
                            }
                        ]
                    },
                    channel: {
                        name: 'Channel',
                        value: [
                            {
                                name: 'default',
                                input: [{ channelIds: ['channelId1', 'channelId2', 'channelId3'] }],
                                expected: '<#channelId1>\n<#channelId2>\n<#channelId3>'
                            }
                        ]
                    },
                    oldUsername: {
                        name: 'Old Name',
                        value: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { username: 'userUsername', discriminator: 'userDiscriminator' }) }],
                                expected: 'userUsername#userDiscriminator'
                            }
                        ]
                    },
                    newUsername: {
                        name: 'New Name',
                        value: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { username: 'userUsername', discriminator: 'userDiscriminator' }) }],
                                expected: 'userUsername#userDiscriminator'
                            }
                        ]
                    },
                    oldNickname: {
                        name: 'Old Nickname',
                        value: [
                            {
                                name: 'default',
                                input: [{ nickname: 'someNickname' }],
                                expected: 'someNickname'
                            }
                        ]
                    },
                    newNickname: {
                        name: 'New Nickname',
                        value: [
                            {
                                name: 'default',
                                input: [{ nickname: 'someNickname' }],
                                expected: 'someNickname'
                            }
                        ]
                    },
                    role: {
                        name: 'Role',
                        value: [
                            {
                                name: 'default',
                                input: [{ roleId: 'roleId' }],
                                expected: '<@&roleId> (roleId)'
                            }
                        ]
                    },
                    updatedBy: {
                        name: 'Updated By',
                        value: [
                            {
                                name: 'default',
                                input: [{ userId: 'userId' }],
                                expected: '<@userId> (userId)'
                            }
                        ]
                    },
                    created: {
                        name: 'Created',
                        value: [
                            {
                                name: 'default',
                                input: [{ time: moment(1234567890) }],
                                expected: '<t:1234567:f>'
                            }
                        ]
                    },
                    until: {
                        name: 'Until',
                        value: [
                            {
                                name: 'default',
                                input: [{ time: moment(1234567890) }],
                                expected: '<t:1234567:f>'
                            }
                        ]
                    },
                    count: {
                        name: 'Count',
                        value: [
                            {
                                name: 'default',
                                input: [{ count: 123 }],
                                expected: '123'
                            }
                        ]
                    },
                    content: {
                        name: {
                            old: {
                                unavailable: 'Old Message (Unavailable)',
                                empty: 'Old Message (Empty)',
                                default: 'Old Message'
                            },
                            new: {
                                unavailable: 'New Message (Unavailable)',
                                empty: 'New Message (Empty)',
                                default: 'New Message'
                            },
                            current: {
                                unavailable: 'Content (Unavailable)',
                                empty: 'Content (Empty)',
                                default: 'Content'
                            }
                        },
                        value: {
                            chatLogsOff: 'This message wasn\'t logged. ChatLogging is currently turned off',
                            unknown: 'This message wasn\'t logged. ChatLogging was off when it was sent, or it is older than 2 weeks',
                            expired: 'This message is no longer logged as it is older than 2 weeks',
                            notLogged: 'This message wasn\'t logged. ChatLogging was off when it was sent.',
                            empty: 'This message has no content. It had either an attachment or an embed',
                            default: [
                                {
                                    name: 'default',
                                    input: [{ content: 'this is some content' }],
                                    expected: 'this is some content'
                                },
                                {
                                    name: 'too long',
                                    input: [{ content: [...new Array(1100).keys()].join('') }],
                                    expected: `${[...new Array(1100).keys()].join('').slice(0, 999)}... (too long to display)`
                                }
                            ]
                        }
                    }
                }

            }
        },
        warning: {
            autoBan: [
                {
                    name: 'default',
                    input: [{ warnings: 123, limit: 456 }],
                    expected: '[ Auto-Ban ] Exceeded ban limit (123/456)'
                }
            ],
            autoKick: [
                {
                    name: 'default',
                    input: [{ warnings: 123, limit: 456 }],
                    expected: '[ Auto-Ban ] Exceeded ban limit (123/456)'
                }
            ],
            autoTimeout: [
                {
                    name: 'default',
                    input: [{ warnings: 123, limit: 456 }],
                    expected: '[ Auto-Ban ] Exceeded ban limit (123/456)'
                }
            ]
        },
        mute: {
            autoUnmute: [
                {
                    name: 'with duration',
                    input: [{ duration: moment.duration(1234567) }],
                    expected: 'Automatically unmuted after 20 minutes, 34 seconds and 567 milliseconds.'
                },
                {
                    name: 'without duration',
                    input: [{}],
                    expected: 'Automatically unmuted after some time.'
                }
            ],
            createReason: 'Automatic muted role configuration'
        },
        moderation: {
            auditLog: [
                {
                    name: 'without reason',
                    input: [{ moderator: quickMock(user, { username: 'moderatorUsername', discriminator: 'moderatorDiscriminator' }) }],
                    expected: '[moderatorUsername#moderatorDiscriminator]'
                },
                {
                    name: 'with reason',
                    input: [{ moderator: quickMock(user, { username: 'moderatorUsername', discriminator: 'moderatorDiscriminator' }), reason: util.literal('My cool reason') }],
                    expected: '[moderatorUsername#moderatorDiscriminator] My cool reason'
                }
            ]
        },
        censor: {
            warnReason: 'Said a blacklisted phrase.',
            mentionSpam: {
                ban: {
                    reason: 'Mention Spam',
                    failed: [
                        {
                            name: 'default',
                            input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                            expected: '<@userId> is mention spamming, but I lack the permissions to ban them!'
                        }
                    ]
                }
            }
        },
        ban: {
            autoUnban: [
                {
                    name: 'without duration',
                    input: [{}],
                    expected: 'Automatically unbanned after some time.'
                },
                {
                    name: 'with duration',
                    input: [{ duration: moment.duration(1234567) }],
                    expected: 'Automatically unbanned after 20 minutes, 34 seconds and 567 milliseconds.'
                }
            ]
        },
        documentation: {
            loading: 'Loading...',
            name: {
                flat: [
                    {
                        name: 'default',
                        input: [{ parent: util.literal('parent documentation'), child: util.literal('child documentation') }],
                        expected: 'parent documentation - child documentation'
                    }
                ]
            },
            query: {
            },
            paging: {
                parent: [
                    {
                        name: 'default',
                        input: [{ parent: util.literal('parent documentation') }],
                        expected: 'Back to parent documentation'
                    }
                ],
                select: {
                    placeholder: [
                        {
                            name: 'default',
                            input: [{ text: util.literal('some text'), page: 123, pageCount: 456 }],
                            expected: 'some text - Page 123/456'
                        }
                    ]
                }
            },
            command: {
                unknown: '❌ Oops, I couldn\'t find that command! Try using `b!help` for a list of all commands',
                invalid: '❌ This help page isn\'t valid any more!',
                prompt: [
                    {
                        name: 'default',
                        input: [{ term: 'my search term' }],
                        expected: 'Multiple help pages match `my search term`'
                    }
                ],
                index: {
                    name: 'Help',
                    footer: [
                        {
                            name: 'default',
                            input: [{ commandsLink: 'https://blargbot.xyz/commands', donateLink: 'https://blargbot.xyz/donate' }],
                            expected: 'For more information about commands, do `b!help <commandname>` or visit <https://blargbot.xyz/commands>.\nWant to support the bot? Donation links are available at <https://blargbot.xyz/donate> - all donations go directly towards recouping hosting costs.'
                        }
                    ],
                    prompt: 'Pick a command category'
                },
                list: {
                    none: 'No commands',
                    excess: [
                        {
                            name: 'default',
                            input: [{ items: [util.literal('cmd1'), util.literal('cmd2'), util.literal('cmd3')], excess: 123 }],
                            expected: '```\ncmd1, cmd2, cmd3\n```+ 123 more'
                        }
                    ],
                    count: [
                        {
                            name: 'multiple',
                            input: [{ count: 123 }],
                            expected: '123 commands'
                        },
                        {
                            name: 'single',
                            input: [{ count: 1 }],
                            expected: '1 command'
                        }
                    ],
                    default: [
                        {
                            name: 'default',
                            input: [{ items: [util.literal('cmd1'), util.literal('cmd2'), util.literal('cmd3')] }],
                            expected: '```\ncmd1, cmd2, cmd3\n```'
                        }
                    ]
                },
                categories: {
                    prompt: 'Pick a command',
                    displayName: [
                        {
                            name: 'default',
                            input: [{ category: util.literal('Cool') }],
                            expected: 'Cool commands'
                        }
                    ],
                    custom: {
                        noHelp: '_No help set_'
                    }
                },
                command: {
                    prompt: 'Pick a command signature',
                    noPerms: [
                        {
                            name: 'with description',
                            input: [{ name: 'myCommand', description: util.literal('Because I said so') }],
                            expected: '```\n❌ You cannot use b!myCommand\n```Because I said so'
                        },
                        {
                            name: 'without description',
                            input: [{ name: 'myCommand' }],
                            expected: '```\n❌ You cannot use b!myCommand\n```'
                        }
                    ],
                    aliases: {
                        name: '**Aliases**',
                        value: [
                            {
                                name: 'default',
                                input: [{ aliases: ['alias1', 'alias2', 'alias3'] }],
                                expected: 'alias1, alias2, alias3'
                            }
                        ]
                    },
                    flags: {
                        name: '**Flags**',
                        value: [
                            {
                                name: 'default',
                                input: [{
                                    flags: [
                                        { flag: '1', word: 'flag1', description: 'Hmmmmm' },
                                        { flag: '2', word: 'flag2', description: util.literal('AAAAAAA') }
                                    ]
                                }],
                                expected: '`-1`/`--flag1`: Hmmmmm\n`-2`/`--flag2`: AAAAAAA'
                            }
                        ]
                    },
                    usage: {
                        name: [
                            {
                                name: 'default',
                                input: [{ usage: 'some command usage' }],
                                expected: 'ℹ️  some command usage'
                            }
                        ],
                        value: [
                            {
                                name: 'with notes',
                                input: [{
                                    notes: [
                                        util.literal('note 1'),
                                        util.literal('note 2'),
                                        util.literal('note 3')
                                    ],
                                    description: util.literal('This is a description')
                                }],
                                expected: '> note 1\n> note 2\n> note 3\n\nThis is a description'
                            },
                            {
                                name: 'no notes',
                                input: [{
                                    notes: [],
                                    description: util.literal('This is a description')
                                }],
                                expected: 'This is a description'
                            }
                        ]
                    },
                    notes: {
                        alias: [
                            {
                                name: 'default',
                                input: [{ parameter: 'parameter name', aliases: ['abc', 'def', 'ghi'] }],
                                expected: '`parameter name` can be replaced with `abc`, `def` or `ghi`'
                            }
                        ],
                        type: {
                            string: {
                                single: [
                                    {
                                        name: 'default',
                                        input: [{ name: 'parameter name', default: 'default value' }],
                                        expected: '`parameter name` defaults to `default value`'
                                    }
                                ]
                            },
                            literal: {
                                single: [
                                    {
                                        name: 'with default',
                                        input: [{ name: 'parameter name', choices: ['abc', 'def', 'ghi'], default: 'default value' }],
                                        expected: '`parameter name` should be `abc`, `def` or `ghi` and defaults to `default value`'
                                    },
                                    {
                                        name: 'without default',
                                        input: [{ name: 'parameter name', choices: ['abc', 'def', 'ghi'] }],
                                        expected: '`parameter name` should be `abc`, `def` or `ghi`'
                                    }
                                ],
                                greedy: [
                                    {
                                        name: 'optional',
                                        input: [{ name: 'parameter names', choices: ['abc', 'def', 'ghi'], min: 0 }],
                                        expected: '`parameter names` are `abc`, `def` or `ghi`'
                                    },
                                    {
                                        name: 'required',
                                        input: [{ name: 'parameter names', choices: ['abc', 'def', 'ghi'], min: 1 }],
                                        expected: '`parameter names` are `abc`, `def` or `ghi`'
                                    },
                                    {
                                        name: 'multiple',
                                        input: [{ name: 'parameter names', choices: ['abc', 'def', 'ghi'], min: 123 }],
                                        expected: '`parameter names` are 123 or more of `abc`, `def` or `ghi`'
                                    }
                                ]
                            },
                            boolean: {
                                single: [
                                    {
                                        name: 'with default',
                                        input: [{ name: 'parameter name', default: 'default value' }],
                                        expected: '`parameter name` should be true or false and defaults to `default value`'
                                    },
                                    {
                                        name: 'without default',
                                        input: [{ name: 'parameter name' }],
                                        expected: '`parameter name` should be true or false'
                                    }
                                ],
                                greedy: [
                                    {
                                        name: 'optional',
                                        input: [{ name: 'parameter names', min: 0 }],
                                        expected: '`parameter names` are true or false'
                                    },
                                    {
                                        name: 'required',
                                        input: [{ name: 'parameter names', min: 1 }],
                                        expected: '`parameter names` are true or false'
                                    },
                                    {
                                        name: 'multiple',
                                        input: [{ name: 'parameter names', min: 123 }],
                                        expected: '`parameter names` are 123 or more true or false'
                                    }
                                ]
                            },
                            channel: {
                                single: [
                                    {
                                        name: 'with default',
                                        input: [{ name: 'parameter name', default: 'default value' }],
                                        expected: '`parameter name` should be a channel id, mention or name and defaults to `default value`'
                                    },
                                    {
                                        name: 'without default',
                                        input: [{ name: 'parameter name' }],
                                        expected: '`parameter name` should be a channel id, mention or name'
                                    }
                                ],
                                greedy: [
                                    {
                                        name: 'optional',
                                        input: [{ name: 'parameter names', min: 0 }],
                                        expected: '`parameter names` are channel ids, mentions or names'
                                    },
                                    {
                                        name: 'required',
                                        input: [{ name: 'parameter names', min: 1 }],
                                        expected: '`parameter names` are channel ids, mentions or names'
                                    },
                                    {
                                        name: 'multiple',
                                        input: [{ name: 'parameter names', min: 123 }],
                                        expected: '`parameter names` are 123 or more channel ids, mentions or names'
                                    }
                                ]
                            },
                            duration: {
                                single: [
                                    {
                                        name: 'with default',
                                        input: [{ name: 'parameter name', default: 'default value' }],
                                        expected: '`parameter name` should be a duration and defaults to `default value`'
                                    },
                                    {
                                        name: 'without default',
                                        input: [{ name: 'parameter name' }],
                                        expected: '`parameter name` should be a duration'
                                    }
                                ],
                                greedy: [
                                    {
                                        name: 'optional',
                                        input: [{ name: 'parameter names', min: 0 }],
                                        expected: '`parameter names` are durations'
                                    },
                                    {
                                        name: 'required',
                                        input: [{ name: 'parameter names', min: 1 }],
                                        expected: '`parameter names` are durations'
                                    },
                                    {
                                        name: 'multiple',
                                        input: [{ name: 'parameter names', min: 123 }],
                                        expected: '`parameter names` are 123 or more durations'
                                    }
                                ]
                            },
                            bigint: {
                                single: [
                                    {
                                        name: 'with default',
                                        input: [{ name: 'parameter name', default: 'default value' }],
                                        expected: '`parameter name` should be a whole number and defaults to `default value`'
                                    },
                                    {
                                        name: 'without default',
                                        input: [{ name: 'parameter name' }],
                                        expected: '`parameter name` should be a whole number'
                                    }
                                ],
                                greedy: [
                                    {
                                        name: 'optional',
                                        input: [{ name: 'parameter names', min: 0 }],
                                        expected: '`parameter names` are whole numbers'
                                    },
                                    {
                                        name: 'required',
                                        input: [{ name: 'parameter names', min: 1 }],
                                        expected: '`parameter names` are whole numbers'
                                    },
                                    {
                                        name: 'multiple',
                                        input: [{ name: 'parameter names', min: 123 }],
                                        expected: '`parameter names` are 123 or more whole numbers'
                                    }
                                ]
                            },
                            integer: {
                                single: [
                                    {
                                        name: 'with default',
                                        input: [{ name: 'parameter name', default: 'default value' }],
                                        expected: '`parameter name` should be a whole number and defaults to `default value`'
                                    },
                                    {
                                        name: 'without default',
                                        input: [{ name: 'parameter name' }],
                                        expected: '`parameter name` should be a whole number'
                                    }
                                ],
                                greedy: [
                                    {
                                        name: 'optional',
                                        input: [{ name: 'parameter names', min: 0 }],
                                        expected: '`parameter names` are whole numbers'
                                    },
                                    {
                                        name: 'required',
                                        input: [{ name: 'parameter names', min: 1 }],
                                        expected: '`parameter names` are whole numbers'
                                    },
                                    {
                                        name: 'multiple',
                                        input: [{ name: 'parameter names', min: 123 }],
                                        expected: '`parameter names` are 123 or more whole numbers'
                                    }
                                ]
                            },
                            member: {
                                single: [
                                    {
                                        name: 'with default',
                                        input: [{ name: 'parameter name', default: 'default value' }],
                                        expected: '`parameter name` should be a user id, mention or name and defaults to `default value`'
                                    },
                                    {
                                        name: 'without default',
                                        input: [{ name: 'parameter name' }],
                                        expected: '`parameter name` should be a user id, mention or name'
                                    }
                                ],
                                greedy: [
                                    {
                                        name: 'optional',
                                        input: [{ name: 'parameter names', min: 0 }],
                                        expected: '`parameter names` are user ids, mentions or names'
                                    },
                                    {
                                        name: 'required',
                                        input: [{ name: 'parameter names', min: 1 }],
                                        expected: '`parameter names` are user ids, mentions or names'
                                    },
                                    {
                                        name: 'multiple',
                                        input: [{ name: 'parameter names', min: 123 }],
                                        expected: '`parameter names` are 123 or more user ids, mentions or names'
                                    }
                                ]
                            },
                            number: {
                                single: [
                                    {
                                        name: 'with default',
                                        input: [{ name: 'parameter name', default: 'default value' }],
                                        expected: '`parameter name` should be a number and defaults to `default value`'
                                    },
                                    {
                                        name: 'without default',
                                        input: [{ name: 'parameter name' }],
                                        expected: '`parameter name` should be a number'
                                    }
                                ],
                                greedy: [
                                    {
                                        name: 'optional',
                                        input: [{ name: 'parameter names', min: 0 }],
                                        expected: '`parameter names` are numbers'
                                    },
                                    {
                                        name: 'required',
                                        input: [{ name: 'parameter names', min: 1 }],
                                        expected: '`parameter names` are numbers'
                                    },
                                    {
                                        name: 'multiple',
                                        input: [{ name: 'parameter names', min: 123 }],
                                        expected: '`parameter names` are 123 or more numbers'
                                    }
                                ]
                            },
                            role: {
                                single: [
                                    {
                                        name: 'with default',
                                        input: [{ name: 'parameter name', default: 'default value' }],
                                        expected: '`parameter name` should be a role id, mention or name and defaults to `default value`'
                                    },
                                    {
                                        name: 'without default',
                                        input: [{ name: 'parameter name' }],
                                        expected: '`parameter name` should be a role id, mention or name'
                                    }
                                ],
                                greedy: [
                                    {
                                        name: 'optional',
                                        input: [{ name: 'parameter names', min: 0 }],
                                        expected: '`parameter names` are role ids, mentions or names'
                                    },
                                    {
                                        name: 'required',
                                        input: [{ name: 'parameter names', min: 1 }],
                                        expected: '`parameter names` are role ids, mentions or names'
                                    },
                                    {
                                        name: 'multiple',
                                        input: [{ name: 'parameter names', min: 123 }],
                                        expected: '`parameter names` are 123 or more role ids, mentions or names'
                                    }
                                ]
                            },
                            sender: {
                                single: [
                                    {
                                        name: 'with default',
                                        input: [{ name: 'parameter name', default: 'default value' }],
                                        expected: '`parameter name` should be a user id, mention or name, or a webhook id and defaults to `default value`'
                                    },
                                    {
                                        name: 'without default',
                                        input: [{ name: 'parameter name' }],
                                        expected: '`parameter name` should be a user id, mention or name, or a webhook id'
                                    }
                                ],
                                greedy: [
                                    {
                                        name: 'optional',
                                        input: [{ name: 'parameter names', min: 0 }],
                                        expected: '`parameter names` are user ids, mentions or names, or webhook ids'
                                    },
                                    {
                                        name: 'required',
                                        input: [{ name: 'parameter names', min: 1 }],
                                        expected: '`parameter names` are user ids, mentions or names, or webhook ids'
                                    },
                                    {
                                        name: 'multiple',
                                        input: [{ name: 'parameter names', min: 123 }],
                                        expected: '`parameter names` are 123 or more user ids, mentions or names, or webhook ids'
                                    }
                                ]
                            },
                            user: {
                                single: [
                                    {
                                        name: 'with default',
                                        input: [{ name: 'parameter name', default: 'default value' }],
                                        expected: '`parameter name` should be a user id, mention or name and defaults to `default value`'
                                    },
                                    {
                                        name: 'without default',
                                        input: [{ name: 'parameter name' }],
                                        expected: '`parameter name` should be a user id, mention or name'
                                    }
                                ],
                                greedy: [
                                    {
                                        name: 'optional',
                                        input: [{ name: 'parameter names', min: 0 }],
                                        expected: '`parameter names` are user ids, mentions or names'
                                    },
                                    {
                                        name: 'required',
                                        input: [{ name: 'parameter names', min: 1 }],
                                        expected: '`parameter names` are user ids, mentions or names'
                                    },
                                    {
                                        name: 'multiple',
                                        input: [{ name: 'parameter names', min: 123 }],
                                        expected: '`parameter names` are 123 or more user ids, mentions or names'
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            bbtag: {
                invalid: '❌ This bbtag documentation page isn\'t valid any more!',
                unknown: [
                    {
                        name: 'default',
                        input: [{ commandName: 'myCommand' }],
                        expected: '❌ Oops, I didn\'t recognise that topic! Try using `b!myCommand docs` for a list of all topics'
                    }
                ],
                prompt: [
                    {
                        name: 'default',
                        input: [{ term: 'some search term' }],
                        expected: 'Multiple bbtag documentation pages match `some search term`'
                    }
                ],
                index: {
                    name: 'BBTag',
                    description: [
                        {
                            name: 'default',
                            input: [{ editorLink: 'https://blargbot.xyz/bbtag/editor' }],
                            expected: 'Blargbot is equipped with a system of tags called BBTag, designed to mimic a programming language while still remaining simple. You can use this system as the building-blocks to create your own advanced command system, whether it be through public tags or guild-specific custom commands.\n\nCustomizing can prove difficult via discord, fortunately there is an online [BBTag IDE](https://blargbot.xyz/bbtag/editor) which should make developing a little easier.'
                        }
                    ],
                    prompt: 'Pick a topic',
                    topics: {
                        name: 'Topics',
                        value: [
                            {
                                name: 'default',
                                input: [{ commandName: 'myCommand' }],
                                expected: 'For specific information about a topic, please use `b!myCommand docs <topic>` (like `b!myCommand docs subtags`\n- `terminology`, for more information about terms like \'subtags\', \'tags\', etc.  \n- `variables`, for more information about variables and the different variable scopes.\n- `argTypes`, for more information about the syntax of parameters\n- `dynamic`, for information about dynamic subtags\n- `subtags`, arguably the most important topic on this list. `b!myCommand docs subtags` displays a list of subtag categories.'
                            }
                        ]
                    }
                },
                subtags: {
                    name: 'Subtags',
                    description: [
                        {
                            name: 'default',
                            input: [{
                                categories: [
                                    { name: util.literal('Category 1'), description: util.literal('Cool commands') },
                                    { name: util.literal('Category 2'), description: util.literal('Awesome commands') },
                                    { name: util.literal('Category 3'), description: util.literal('Amazing commands') }
                                ]
                            }],
                            expected: 'Subtags are the building blocks of BBTag, and fall into 3 categories:\n\n**Category 1** - Cool commands\n**Category 2** - Awesome commands\n**Category 3** - Amazing commands'
                        }
                    ],
                    prompt: 'Pick a category'
                },
                subtag: {
                    name: [
                        {
                            name: 'default',
                            input: [{ name: 'tag name' }],
                            expected: '{tag name}'
                        }
                    ],
                    prompt: 'Pick a call signature',
                    description: {
                        deprecated: [
                            {
                                name: 'with replacement',
                                input: [{ replacement: 'some other subtag' }],
                                expected: '**This subtag is deprecated and has been replaced by {some other subtag}**'
                            },
                            {
                                name: 'without replacement',
                                input: [{}],
                                expected: '**This subtag is deprecated**'
                            }
                        ],
                        aliases: [
                            {
                                name: 'none',
                                input: [{ aliases: [] }],
                                expected: ''
                            },
                            {
                                name: 'some',
                                input: [{ aliases: ['alias1', 'alias2', 'alias3'] }],
                                expected: '**Aliases:** ```\nalias1, alias2, alias3\n```'
                            }
                        ],
                        template: [
                            {
                                name: 'default',
                                input: [{ parts: [util.literal('line 1'), util.literal('line 2'), util.literal('line 3')] }],
                                expected: 'line 1\nline 2\nline 3'
                            }
                        ]
                    },
                    pages: {
                        signature: {
                            name: [
                                {
                                    name: 'default',
                                    input: [{ parameters: 'some parameters' }],
                                    expected: 'Usage: some parameters'
                                }
                            ],
                            usage: {
                                name: '**Usage**',
                                value: {
                                    parameters: [
                                        {
                                            name: 'default',
                                            input: [{ parameters: 'some parameters' }],
                                            expected: '```\nsome parameters\n```'
                                        }
                                    ],
                                    modifier: {
                                        maxLength: [
                                            {
                                                name: 'default',
                                                input: [{ name: 'parameter name', maxLength: 123 }],
                                                expected: '`parameter name` can at most be 123 characters long'
                                            }
                                        ],
                                        defaulted: [
                                            {
                                                name: 'required',
                                                input: [{ name: 'parameter name', defaultValue: 'default value', required: true }],
                                                expected: '`parameter name` defaults to `default value` if left blank.'
                                            },
                                            {
                                                name: 'optional',
                                                input: [{ name: 'parameter name', defaultValue: 'default value', required: false }],
                                                expected: '`parameter name` defaults to `default value` if omitted or left blank.'
                                            }
                                        ],
                                        defaultedMaxLength: [
                                            {
                                                name: 'required',
                                                input: [{ name: 'parameter name', defaultValue: 'default value', required: true, maxLength: 123 }],
                                                expected: '`parameter name` can at most be 123 characters long and defaults to `default value` if left blank.'
                                            },
                                            {
                                                name: 'optional',
                                                input: [{ name: 'parameter name', defaultValue: 'default value', required: false, maxLength: 123 }],
                                                expected: '`parameter name` can at most be 123 characters long and defaults to `default value` if omitted or left blank.'
                                            }
                                        ]
                                    },
                                    template: [
                                        {
                                            name: 'default',
                                            input: [{ parts: [util.literal('line 1'), util.literal('line 2'), util.literal('line 3')] }],
                                            expected: 'line 1\nline 2\nline 3'
                                        }
                                    ]
                                }
                            },
                            exampleCode: {
                                name: '**Example code**',
                                value: [
                                    {
                                        name: 'default',
                                        input: [{ code: util.literal('Look at my programming skills') }],
                                        expected: '```\nLook at my programming skills\n```'
                                    }
                                ]
                            },
                            exampleIn: {
                                name: '**Example user input**',
                                value: [
                                    {
                                        name: 'given',
                                        input: [{ text: util.literal('This is my user input\nand is spread across\nmultiple lines') }],
                                        expected: '\n> This is my user input\n> and is spread across\n> multiple lines\n'
                                    },
                                    {
                                        name: 'empty',
                                        input: [{ text: util.literal('') }],
                                        expected: '_no input_\n'
                                    }
                                ]
                            },
                            exampleOut: {
                                name: '**Example output**',
                                value: [
                                    {
                                        name: 'given',
                                        input: [{ text: util.literal('This is the tag output\nand is spread across\nmultiple lines') }],
                                        expected: '\n> This is the tag output\n> and is spread across\n> multiple lines\n'
                                    },
                                    {
                                        name: 'empty',
                                        input: [{ text: util.literal('') }],
                                        expected: '_no output_\n'
                                    }
                                ]
                            },
                            limit: {
                                name: {
                                    customCommandLimit: '**Limits for custom commands:**',
                                    everythingAutoResponseLimit: '**Limits for everything autoresponses:**',
                                    generalAutoResponseLimit: '**Limits for general autoresponses:**',
                                    tagLimit: '**Limits for tags:**'
                                },
                                value: [
                                    {
                                        name: 'default',
                                        input: [{ rules: [util.literal('rule 1'), util.literal('rule 2'), util.literal('rule 3')] }],
                                        expected: '```\nrule 1\nrule 2\nrule 3\n```'
                                    }
                                ]
                            }
                        }
                    }
                },
                subtagCategory: {
                    description: [
                        {
                            name: 'default',
                            input: [{ description: util.literal('Some cool description'), subtags: ['subtag1', 'subtag2', 'subtag3'] }],
                            expected: 'Some cool description\n\n```\nsubtag1, subtag2, subtag3\n```'
                        }
                    ],
                    prompt: 'Pick a subtag'
                },
                variables: {
                    name: 'Variables',
                    description: [
                        {
                            name: 'default',
                            input: [{ scopeCount: 123 }],
                            expected: 'In BBTag there are 123 different scopes that can be used for storing your data. These scopes are determined by the first character of your variable name, so choose carefully!'
                        }
                    ],
                    prompt: 'Pick a variable scope',
                    pages: {
                        variableType: {
                            name: [
                                {
                                    name: 'default',
                                    input: [{ name: util.literal('cool variables'), prefix: '!!' }],
                                    expected: 'cool variables (prefix: !!)'
                                }
                            ]
                        },
                        commitRollback: {
                            name: '{commit} and {rollback}',
                            value: 'For performance reasons, when a value is `{set}` it wont be immediately populated to the database. `{commit}` and `{rollback}` can be used to manipulate when variables are sent to the database, if at all. `{commit}` will force the given variables to be sent to the database immediately. `{rollback}` will revert the given variables to their original value (start of tag or most recent `{commit}`).\nThere is also an additional prefix for {set} and {get} which is `!`. This prefix can be combined with other prefixes and will act the same as if you have called `{set}` and then `{commit}` immediately after. e.g. ```{set;!@varname;value}``` is identical to ```{set;@varname;value}{commit;@varname}```'
                        }
                    }
                },
                arguments: {
                    name: 'Arguments',
                    description: 'As you may have noticed, the various help documentation for subtags will have a usage that often look like this: ```\n{subtag;<arg1>;[arg2];<arg3...>}```This way of formatting arguments is designed to easily be able to tell you what is and is not required.\nAll arguments are separated by `;`\'s and each will be displayed in a way that tells you what kind of argument it is.\nNOTE: Simple subtags do not accept any arguments and so should not be supplied any.',
                    prompt: 'Pick a argument type',
                    pages: {
                        required: {
                            name: 'Required arguments <>',
                            value: 'Example:```\n<arg>```Required arguments must be supplied for a subtag to work. If they are not then you will normally be given a `Not enough args` error\n\u200B'
                        },
                        optional: {
                            name: 'Optional arguments []',
                            value: [
                                {
                                    name: 'default',
                                    input: [{ commandName: 'myCommand' }],
                                    expected: 'Example:```\n[arg]```Optional arguments may or may not be provided. If supplied, optional arguments may either change the functionality of the tag (e.g. `b!myCommand docs shuffle`) or simply replace a default value (e.g. `b!myCommand docs username`).\n\u200B'
                                }
                            ]
                        },
                        multiple: {
                            name: 'Multiple arguments ...',
                            value: [
                                {
                                    name: 'default',
                                    input: [{ commandName: 'myCommand' }],
                                    expected: 'Example:```\n<arg...>```Some arguments can accept multiple values, meaning you are able to list additional values, still separated by `;`, which will be included in the execution. (e.g. `b!myCommand docs randchoose`)'
                                }
                            ]
                        },
                        nested: {
                            name: 'Nested arguments <<> <>>',
                            value: [
                                {
                                    name: 'default',
                                    input: [{ commandName: 'myCommand' }],
                                    expected: 'Example:```\n<<arg1>, [arg2]>```Some subtags may have special rules for how their arguments are grouped (e.g. `b!myCommand docs switch`) and will use nested arguments to show that grouping. When actually calling the subtag, you provide the arguments as normal, however you must obey the grouping rules.\nIn the example of `switch`, you may optionally supply `<case>` and `<then>` as many times as you like but they must always be in pairs. e.g. `{switch;value;case1;then1}` or `{switch;value;case1;then1;case2;then2}` etc'
                                }
                            ]
                        }
                    }
                },
                terminology: {
                    name: 'Terminology',
                    description: 'There are various terms used in BBTag that might not be intuitive, so here is a list of definitions for some of the most important ones:',
                    prompt: 'Pick a term',
                    pages: {
                        bbtag: {
                            name: 'BBTag',
                            value: 'BBTag is a text replacement language. Any text between a `{` and `}` pair (called a subtag) will be taken as code and run, with the output of that replacing the whole subtag. Each subtag does something different, and each accepts its own list of arguments.'
                        },
                        subtag: {
                            name: 'Subtag',
                            value: 'A subtag is a pre-defined function that accepts some arguments and returns a single output. Subtags can be called by placing their name between a pair of `{` and `}`, with any arguments to be passed to the subtag being separated by `;`.\nAs an example:```{math;+;1;2}```Subtag: `math`\nArguments: `+`, `1`, `2`\nResult: `3`'
                        },
                        tag: {
                            name: 'Tag',
                            value: 'A tag is a user-made block of text which may or may not contain subtags. Any subtags that it does contain will be executed and be replaced by their output.'
                        },
                        argument: {
                            name: 'Argument',
                            value: 'An argument is a single value which gets given to a subtag. Arguments can be numbers, text, arrays, anything you can type really. Each subtag will require a different argument pattern, so be sure to check what pattern your subtag needs!'
                        },
                        variable: {
                            name: 'Variable',
                            value: [
                                {
                                    name: 'default',
                                    input: [{ commandName: 'myCommand' }],
                                    expected: 'A variable is a value that is stored in the bots memory ready to access it later on. For more in-depth details about variables, please use `b!myCommand docs variable`.'
                                }
                            ]
                        },
                        array: {
                            name: 'Array',
                            value: 'An array is a collection of values all grouped together, commonly done so by enclosing them inside `[]`. In BBTag, arrays can be assigned to a variable to store them for later use. In this situation, you might see an array displayed like this `{"v":["1","2","3"],"n":"varname"}`. If you do, don\'t worry, nothing is broken! That is just there to allow you to modify the array in place within certain subtags.'
                        }
                    }
                },
                dynamic: {
                    name: 'Dynamic',
                    description: 'In bbtag, even the names of subtags can be dynamic. This can be achieved simply by placing subtags before the first `;` of a subtag. \n e.g. ```{user{get;~action};{userid}}``` If `~action` is set to `name`, then this will run the `username` subtag, if it is set to `avatar` then it will run the `useravatar` subtag, and so on. Because dynamic subtags are by definition not set in stone, it is recommended not to use them, and as such you will receive warnings when editing/creating a tag/cc which contains a dynamic subtag. Your tag will function correctly, however some optimizations employed by bbtag will be unable to run on any such tag.'
                }
            }
        },
        tableflip: {
            flip: v => chai.expect(v).to.be.oneOf([
                'Whoops! Let me get that for you ┬──┬ ¯\\\\_(ツ)',
                '(ヘ･_･)ヘ┳━┳ What are you, an animal?',
                'Can you not? ヘ(´° □°)ヘ┳━┳',
                'Tables are not meant to be flipped ┬──┬ ノ( ゜-゜ノ)',
                '(ﾉ´･ω･)ﾉ ﾐ ┸━┸ Wheee!',
                '┻━┻ ︵ヽ(`Д´)ﾉ︵ ┻━┻ Get these tables out of my face!',
                '┻━┻ミ＼(≧ﾛ≦＼) Hey, catch!',
                'Flipping tables with elegance! (/¯◡ ‿ ◡)/¯ ~ ┻━┻'
            ]),
            unflip: v => chai.expect(v).to.be.oneOf([
                '┬──┬ ¯\\\\_(ツ) A table unflipped is a table saved!',
                '┣ﾍ(≧∇≦ﾍ)… (≧∇≦)/┳━┳ Unflip that table!',
                'Yay! Cleaning up! ┣ﾍ(^▽^ﾍ)Ξ(ﾟ▽ﾟ*)ﾉ┳━┳',
                'ヘ(´° □°)ヘ┳━┳ Was that so hard?',
                '(ﾉ´･ω･)ﾉ ﾐ ┸━┸ Here comes the entropy!',
                'I\'m sorry, did you just pick that up? ༼ﾉຈل͜ຈ༽ﾉ︵┻━┻',
                'Get back on the ground! (╯ರ ~ ರ)╯︵ ┻━┻',
                'No need to be so serious! (ﾉ≧∇≦)ﾉ ﾐ ┸━┸'
            ])
        },
        cleverbot: {
            unavailable: '❌ It seems that my clever brain isn\'t working right now, try again later'
        },
        settings: {
            makelogs: {
                name: 'Make ChatLogs',
                description: 'Whether to record chat logs or not.'
            },
            cahnsfw: {
                name: 'Is CAH NSFW',
                description: 'Whether \'cah\' can only be done in nsfw channels or not.'
            },
            deletenotif: {
                name: 'Delete notifications',
                description: 'If enabled, notifies you if a user deleted their command.'
            },
            modlog: {
                name: 'Modlog channel',
                description: 'The id of the modlog channel. You can also use the <code>modlog</code> command'
            },
            mutedrole: {
                name: 'Muted role',
                description: 'The id of the muted role.'
            },
            tableflip: {
                name: 'Tableflips',
                description: 'Whether the bot should respond to tableflips/unflips.'
            },
            antimention: {
                name: 'Anti-mention',
                description: 'The number of unique mentions required to warrant a ban (for anti-mention spam). Set to \'0\' to disable. Recommended: 25'
            },
            dmhelp: {
                name: 'DM help',
                description: 'Whether or not to dm help messages or output them in channels'
            },
            staffperms: {
                name: 'Staff permissions',
                description: 'The numeric value of permissions that designate a staff member. If a user has any of the permissions and permoverride is enabled, allows them to execute any command regardless of role. See <a href=https://discordapi.com/permissions.html>here</a> for a permission calculator.'
            },
            timeoutoverride: {
                name: 'Timeout override',
                description: 'Same as staffperms, but allows users to use the timeout command regardless of permissions'
            },
            kickoverride: {
                name: 'Kick override',
                description: 'Same as staffperms, but allows users to use the kick command regardless of permissions'
            },
            banoverride: {
                name: 'Ban override',
                description: 'Same as staffperms, but allows users to use the ban/hackban/unban commands regardless of permissions'
            },
            banat: {
                name: 'Ban at',
                description: 'The number of warnings before a ban. Set to 0 or below to disable.'
            },
            kickat: {
                name: 'Kick at',
                description: 'The number of warnings before a kick. Set to 0 or below to disable.'
            },
            timeoutat: {
                name: 'Time Out at',
                description: 'The number of warnings before a timeout. Set to 0 or below to disable.'
            },
            actonlimitsonly: {
                name: 'Act on Limits Only',
                description: 'Whether to kick/ban on a warning count that is in between the kickat and banat values.'
            },
            adminrole: {
                name: 'Admin role',
                description: 'The Admin role.'
            },
            nocleverbot: {
                name: 'No cleverbot',
                description: 'Disables cleverbot functionality'
            },
            disableeveryone: {
                name: 'Disable everyone pings',
                description: 'Disables everyone pings in custom commands.'
            },
            disablenoperms: {
                name: 'Disable no perms',
                description: 'Disables the \'You need the role to use this command\' message.'
            },
            social: {
                name: 'Social commands',
                description: 'Enables social commands.'
            },
            farewellchan: {
                name: 'Farewell channel',
                description: 'Sets the channel for the farewell message to be sent in'
            },
            greetchan: {
                name: 'Greeting channel',
                description: 'Sets the channel for the greeting message to be sent in'
            },
            language: {
                name: 'Blargbot language',
                description: 'Sets the language blargbot should respond in'
            }
        },
        contributors: {
            notFound: [
                {
                    name: 'default',
                    input: [{ userId: 'userId' }],
                    expected: 'A user I cant find! (ID: userId)'
                }
            ]
        },
        commands: {
            $errors: {
                generic: [
                    {
                        name: 'default',
                        input: [{ token: 'ksjdhfkjlshfe8iowu948rurui348ru938' }],
                        expected: '❌ Something went wrong while handling your command!\nError id: `ksjdhfkjlshfe8iowu948rurui348ru938`'
                    }
                ],
                alreadyRunning: '❌ Sorry, this command is already running! Please wait and try again.',
                guildOnly: [
                    {
                        name: 'default',
                        input: [{ prefix: '~', commandName: 'myCommand' }],
                        expected: '❌ `~myCommand` can only be used on guilds.'
                    }
                ],
                privateOnly: [
                    {
                        name: 'default',
                        input: [{ prefix: '~', commandName: 'myCommand' }],
                        expected: '❌ `~myCommand` can only be used in private messages.'
                    }
                ],
                rateLimited: {
                    local: [
                        {
                            name: 'default',
                            input: [{ duration: moment.duration(123000) }],
                            expected: '❌ Sorry, you ran this command too recently! Please try again in 123 seconds.'
                        }
                    ],
                    global: [
                        {
                            name: 'default',
                            input: [{ duration: moment.duration(123000), penalty: moment.duration(765000) }],
                            expected: '❌ Sorry, you\'ve been running too many commands. To prevent abuse, I\'m going to have to time you out for `123s`.\n\nContinuing to spam commands will lengthen your timeout by `765s`!'
                        }
                    ]
                },
                missingPermission: {
                    generic: '❌ Oops, I don\'t seem to have permission to do that!',
                    guild: [
                        {
                            name: 'default',
                            input: [{ channel: quickMock(guildChannel, { mention: '<#channelId>', guild: quickMock(guild, { name: 'guildName' }) }), commandText: 'my command text', prefix: '~' }],
                            expected: '❌ Hi! You asked me to do something, but I didn\'t have permission to do it! Please make sure I have permissions to do what you asked.\nGuild: guildName\nChannel: <#channelId>\nCommand: my command text\n\nIf you wish to stop seeing these messages, do the command `~dmerrors`.'
                        }
                    ]
                },
                arguments: {
                    invalid: [
                        {
                            name: 'default',
                            input: [{ value: 'some argument', types: ['type 1', 'type 2', 'type 3'] }],
                            expected: '❌ Invalid arguments! `some argument` isn\'t `type 1`, `type 2` or `type 3`'
                        }
                    ],
                    missing: [
                        {
                            name: 'default',
                            input: [{ missing: ['arg 1', 'arg 2', 'arg 3'] }],
                            expected: '❌ Not enough arguments! You need to provide `arg 1`, `arg 2` or `arg 3`'
                        }
                    ],
                    unknown: '❌ I couldn\'t understand those arguments!',
                    noneNeeded: [
                        {
                            name: 'default',
                            input: [{ command: quickMock(command, { name: 'commandName' }) }],
                            expected: '❌ Too many arguments! `commandName` doesn\'t need any arguments'
                        }
                    ],
                    tooMany: [
                        {
                            name: 'single',
                            input: [{ max: 1, given: 456 }],
                            expected: '❌ Too many arguments! Expected at most 1 argument, but you gave 456'
                        },
                        {
                            name: 'multiple',
                            input: [{ max: 123, given: 456 }],
                            expected: '❌ Too many arguments! Expected at most 123 arguments, but you gave 456'
                        }
                    ]
                },
                renderFailed: '❌ Something went wrong while trying to render that!',
                messageDeleted: [
                    {
                        name: 'default',
                        input: [{ user: { username: 'userUsername', discriminator: 'userDiscriminator' } }],
                        expected: '**userUsername#userDiscriminator** deleted their command message.'
                    }
                ],
                blacklisted: [
                    {
                        name: 'default',
                        input: [{ reason: 'my cool reason' }],
                        expected: '❌ You have been blacklisted from the bot for the following reason: my cool reason'
                    }
                ],
                roleMissing: [
                    {
                        name: 'default',
                        input: [{ roleIds: ['roleId1', 'roleId2', 'roleId3'] }],
                        expected: '❌ You need the role <@&roleId1>, <@&roleId2> or <@&roleId3> in order to use this command!'
                    }
                ],
                permMissing: [
                    {
                        name: 'single',
                        input: [{ permissions: [util.literal('perm 1')] }],
                        expected: '❌ You need the following permission to use this command:\nperm 1'
                    },
                    {
                        name: 'multiple',
                        input: [{ permissions: [util.literal('perm 1'), util.literal('perm 2'), util.literal('perm 3')] }],
                        expected: '❌ You need any of the following permissions to use this command:\nperm 1\nperm 2\nperm 3'
                    }
                ]
            },
            categories: {
                custom: {
                    name: 'Custom',
                    description: 'Custom commands.'
                },
                general: {
                    name: 'General',
                    description: 'General commands.'
                },
                nsfw: {
                    name: 'NSFW',
                    description: 'Commands that can only be executed in NSFW channels.'
                },
                image: {
                    name: 'Image',
                    description: 'Commands that generate or display images.'
                },
                admin: {
                    name: 'Admin',
                    description: 'Powerful commands that require an `admin` role or special permissions.'
                },
                social: {
                    name: 'Social',
                    description: 'Social commands for interacting with other people.'
                },
                owner: {
                    name: 'Blargbot Owner',
                    description: 'MREOW MEOWWWOW! **purr**'
                },
                developer: {
                    name: 'Blargbot Developer',
                    description: 'Commands that can only be executed by blargbot developers.'
                },
                staff: {
                    name: 'Blargbot Staff',
                    description: 'Commands that can only be executed by staff on the official support server.'
                },
                support: {
                    name: 'Blargbot Support',
                    description: 'Commands that can only be executed by support members on the official support server.'
                }
            },
            i18n: {
                export: {
                    description: 'Generates a JSON file containing all the keys blargbot currently uses for translation'
                },
                reload: {
                    description: 'Loads the latest translations from crowdin',
                    success: '✅ Translation update requested!'
                }
            },
            announce: {
                default: {
                    description: 'Resets the current configuration for announcements',
                    embed: {
                        author: {
                            name: 'Announcement'
                        }
                    },
                    failed: '❌ I wasn\'t able to send that message for some reason!',
                    success: '✅ I\'ve sent the announcement!'
                },
                reset: {
                    description: 'Resets the current configuration for announcements',
                    success: [
                        {
                            name: 'default',
                            input: [{ prefix: '~' }],
                            expected: '✅ Announcement configuration reset! Do `~announce configure` to reconfigure it.'
                        }
                    ]
                },
                configure: {
                    description: 'Resets the current configuration for announcements',
                    state: {
                        ChannelInvalid: '❌ The announcement channel must be a text channel!',
                        ChannelNotFound: '❌ No channel is set up for announcements',
                        ChannelNotInGuild: '❌ The announcement channel must be on this server!',
                        NotAllowed: '❌ You cannot send announcements',
                        RoleNotFound: '❌ No role is set up for announcements',
                        TimedOut: '❌ You must configure a role and channel to use announcements!',
                        Success: '✅ Your announcements have been configured!'
                    }
                },
                info: {
                    description: 'Displays the current configuration for announcements on this server',
                    unconfigured: [
                        {
                            name: 'default',
                            input: [{ prefix: '~' }],
                            expected: 'ℹ️ Announcements are not yet configured for this server. Please use `~announce configure` to set them up'
                        }
                    ],
                    details: [
                        {
                            name: 'complete',
                            input: [{ channel: quickMock(channel, { mention: '<#channelId>' }), role: quickMock(role, { mention: '<@&roleId>' }) }],
                            expected: 'ℹ️ Announcements will be sent in <#channelId> and will mention <@&roleId>'
                        },
                        {
                            name: 'no channel',
                            input: [{ role: quickMock(role, { mention: '<@&roleId>' }) }],
                            expected: 'ℹ️ Announcements will be sent in `<unconfigured>` and will mention <@&roleId>'
                        },
                        {
                            name: 'no role',
                            input: [{ channel: quickMock(channel, { mention: '<#channelId>' }) }],
                            expected: 'ℹ️ Announcements will be sent in <#channelId> and will mention `<unconfigured>`'
                        },
                        {
                            name: 'unconfigured',
                            input: [{}],
                            expected: 'ℹ️ Announcements will be sent in `<unconfigured>` and will mention `<unconfigured>`'
                        }
                    ]
                }
            },
            autoResponse: {
                notWhitelisted: '❌ Sorry, autoresponses are currently whitelisted. To request access, do `b!ar whitelist [reason]`',
                notFoundId: [
                    {
                        name: 'default',
                        input: [{ id: 'arId' }],
                        expected: '❌ There isn\'t an autoresponse with id `arId` here!'
                    }
                ],
                notFoundEverything: '❌ There isn\'t an everything autoresponse here!',
                flags: {
                    regex: 'If specified, parse as /regex/ rather than plaintext. Unsafe and very long (more than 2000 characters) regexes will not parse successfully.',
                    everything: 'Makes the added autoresponse respond to everything. Only one is allowed.'
                },
                whitelist: {
                    description: 'Requests for the current server to have autoresponses whitelisted',
                    alreadyApproved: '❌ This server is already whitelisted!',
                    requested: '✅ Your request has been sent. Please don\'t spam this command.\n\nYou will hear back in this channel if you were accepted or rejected.'
                },
                list: {
                    description: 'Displays information about autoresponses',
                    noAutoresponses: '❌ There are no autoresponses configured for this server!',
                    embed: {
                        title: 'Autoresponses',
                        field: {
                            name: [
                                {
                                    name: 'default',
                                    input: [{ id: 'arId' }],
                                    expected: 'Autoresponse `arId`'
                                }
                            ],
                            value: {
                                regex: [
                                    {
                                        name: 'default',
                                        input: [{ trigger: '/^Some regex$/g' }],
                                        expected: '**Trigger regex:**\n`/^Some regex$/g`'
                                    }
                                ],
                                text: [
                                    {
                                        name: 'default',
                                        input: [{ trigger: 'Some text' }],
                                        expected: '**Trigger text:**\n`Some text`'
                                    }
                                ],
                                any: '**Trigger:**\neverything'
                            }
                        }
                    }
                },
                info: {
                    description: 'Displays information about an autoresponse',
                    embed: {
                        title: {
                            id: [
                                {
                                    name: 'default',
                                    input: [{ id: '123' }],
                                    expected: 'Autoresponse #123'
                                }
                            ],
                            everything: 'Everything Autoresponse'
                        },
                        field: {
                            trigger: {
                                name: {
                                    regex: 'Trigger regex',
                                    text: 'Trigger text'
                                }
                            },
                            author: {
                                name: 'Author',
                                value: [
                                    {
                                        name: 'default',
                                        input: [{ authorId: 'authorId' }],
                                        expected: '<@authorId> (authorId)'
                                    }
                                ]
                            },
                            authorizer: {
                                name: 'Authorizer',
                                value: [
                                    {
                                        name: 'default',
                                        input: [{ authorizerId: 'authorizerId' }],
                                        expected: '<@authorizerId> (authorizerId)'
                                    }
                                ]
                            }
                        }
                    }
                },
                create: {
                    description: 'Adds a autoresponse which matches the given pattern',
                    everythingAlreadyExists: '❌ An autoresponse that responds to everything already exists!',
                    everythingCannotHavePattern: '❌ Autoresponses that respond to everything cannot have a pattern',
                    tooMany: [
                        {
                            name: 'default',
                            input: [{ max: 123 }],
                            expected: '❌ You already have 123 autoresponses!'
                        }
                    ],
                    missingEFlag: '❌ If you want to respond to everything, you need to use the `-e` flag.',
                    success: [
                        {
                            name: 'everything',
                            input: [{ prefix: '~', id: 'everything' }],
                            expected: '✅ Your autoresponse has been added! Use `~autoresponse set everything <bbtag>` to change the code that it runs'
                        },
                        {
                            name: 'filtered',
                            input: [{ prefix: '~', id: 123 }],
                            expected: '✅ Your autoresponse has been added! Use `~autoresponse set 123 <bbtag>` to change the code that it runs'
                        }
                    ]
                },
                delete: {
                    description: 'Deletes an autoresponse. Ids can be seen when using the `list` subcommand',
                    success: {
                        regex: [
                            {
                                name: 'default',
                                input: [{ id: 123, term: '/^Some regex$/g' }],
                                expected: '✅ Autoresponse 123 (Regex: `/^Some regex$/g`) has been deleted'
                            }
                        ],
                        text: [
                            {
                                name: 'default',
                                input: [{ id: 123, term: 'Some text' }],
                                expected: '✅ Autoresponse 123 (Pattern: `Some text`) has been deleted'
                            }
                        ],
                        everything: '✅ The everything autoresponse has been deleted!'
                    }
                },
                setPattern: {
                    description: 'Sets the pattern of an autoresponse',
                    notEmpty: '❌ The pattern cannot be empty',
                    notEverything: '❌ Cannot set the pattern for the everything autoresponse',
                    success: {
                        regex: [
                            {
                                name: 'default',
                                input: [{ id: 123, term: '/^Some regex$/g' }],
                                expected: '✅ The pattern for autoresponse 123 has been set to (regex) `/^Some regex$/g`!'
                            }
                        ],
                        text: [
                            {
                                name: 'default',
                                input: [{ id: 123, term: 'some text' }],
                                expected: '✅ The pattern for autoresponse 123 has been set to `some text`!'
                            }
                        ]
                    }
                },
                set: {
                    description: 'Sets the bbtag code to run when the autoresponse is triggered',
                    success: {
                        id: [
                            {
                                name: 'default',
                                input: [{ id: 123 }],
                                expected: '✅ Updated the code for autoresponse 123'
                            }
                        ],
                        everything: '✅ Updated the code for the everything autoresponse'
                    }
                },
                raw: {
                    description: 'Gets the bbtag that is executed when the autoresponse is triggered',
                    inline: {
                        id: [
                            {
                                name: 'default',
                                input: [{ id: 123, content: 'Some bbtag code' }],
                                expected: '✅ The raw code for autoresponse 123 is: ```\nSome bbtag code\n```'
                            }
                        ],
                        everything: [
                            {
                                name: 'default',
                                input: [{ content: 'Some bbtag code' }],
                                expected: '✅ The raw code for the everything autoresponse is: ```\nSome bbtag code\n```'
                            }
                        ]
                    },
                    attached: {
                        id: [
                            {
                                name: 'default',
                                input: [{ id: 123 }],
                                expected: '✅ The raw code for autoresponse 123 is attached'
                            }
                        ],
                        everything: '✅ The raw code for the everything autoresponse is attached'
                    }
                },
                setAuthorizer: {
                    description: 'Sets the autoresponse to use your permissions for the bbtag when it is triggered',
                    success: {
                        id: [
                            {
                                name: 'default',
                                input: [{ id: 123 }],
                                expected: '✅ You are now the authorizer for autoresponse 123'
                            }
                        ],
                        everything: '✅ You are now the authorizer for the everything autoresponse'
                    }
                },
                debug: {
                    description: 'Sets the autoresponse to send you the debug output when it is next triggered by one of your messages',
                    success: {
                        id: [
                            {
                                name: 'default',
                                input: [{ id: 123 }],
                                expected: '✅ The next message that you send that triggers autoresponse 123 will send the debug output here'
                            }
                        ],
                        everything: '✅ The next message that you send that triggers the everything autoresponse will send the debug output here'
                    }
                }
            },
            ban: {
                flags: {
                    reason: 'The reason for the (un)ban.',
                    time: 'If provided, the user will be unbanned after the period of time. (softban)'
                },
                default: {
                    description: 'Bans a user, where `days` is the number of days to delete messages for.\nIf mod-logging is enabled, the ban will be logged.',
                    state: {
                        alreadyBanned: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '❌ **<@userId>** is already banned!'
                            }
                        ],
                        memberTooHigh: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '❌ I don\'t have permission to ban **<@userId>**! Their highest role is above my highest role.'
                            }
                        ],
                        moderatorTooLow: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '❌ You don\'t have permission to ban **<@userId>**! Their highest role is above your highest role.'
                            }
                        ],
                        noPerms: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '❌ I don\'t have permission to ban **<@userId>**! Make sure I have the `ban members` permission and try again.'
                            }
                        ],
                        moderatorNoPerms: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '❌ You don\'t have permission to ban **<@userId>**! Make sure you have the `ban members` permission or one of the permissions specified in the `ban override` setting and try again.'
                            }
                        ],
                        success: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '✅ **<@userId>** has been banned.'
                            }
                        ]
                    },
                    unbanSchedule: {
                        success: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }), unban: moment.duration(1234567) }],
                                expected: () => `✅ **<@userId>** has been banned and will be unbanned **<t:${moment().add(1234567).unix()}:R>**`
                            }
                        ],
                        invalid: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '⚠️ **<@userId>** has been banned, but the duration was either 0 seconds or improperly formatted so they won\'t automatically be unbanned.'
                            }
                        ]
                    }
                },
                clear: {
                    description: 'Unbans a user.\nIf mod-logging is enabled, the ban will be logged.',
                    userNotFound: '❌ I couldn\'t find that user!',
                    state: {
                        notBanned: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '❌ **<@userId>** is not currently banned!'
                            }
                        ],
                        noPerms: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '❌ I don\'t have permission to unban **<@userId>**! Make sure I have the `ban members` permission and try again.'
                            }
                        ],
                        moderatorNoPerms: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '❌ You don\'t have permission to unban **<@userId>**! Make sure you have the `ban members` permission or one of the permissions specified in the `ban override` setting and try again.'
                            }
                        ],
                        success: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '✅ **<@userId>** has been unbanned.'
                            }
                        ]
                    }
                }
            },
            blacklist: {
                default: {
                    description: 'Blacklists the current channel, or the channel that you mention. The bot will not respond until you do `blacklist` again.',
                    notInServer: '❌ You cannot blacklist a channel outside of this server',
                    success: {
                        added: [
                            {
                                name: 'default',
                                input: [{ channel: quickMock(channel, { mention: '<#channelId>' }) }],
                                expected: '✅ <#channelId> is no longer blacklisted.'
                            }
                        ],
                        removed: [
                            {
                                name: 'default',
                                input: [{ channel: quickMock(channel, { mention: '<#channelId>' }) }],
                                expected: '✅ <#channelId> is now blacklisted'
                            }
                        ]
                    }
                }
            },
            bot: {
                reset: {
                    description: 'Deletes all persistent information that the bot holds. If used in a guild, this includes settings, custom commands and guild variables. If used in a DM this includes user settings, tags and author variables. You can preview exactly what will be deleted by doing `bot dump` first!',
                    unavailable: 'The bot cannot be reset here',
                    guild: {
                        cancelled: '❌ Reset cancelled',
                        success: '✅ I have been reset back to my initial configuration',
                        confirm: {
                            prompt: '⚠️ Are you sure you want to reset the bot to its initial state?\nThis will:\n- Reset all settings back to their defaults\n- Delete all custom commands, autoresponses, rolemes, censors, etc\n- Delete all tag guild variables',
                            cancel: 'No',
                            continue: 'Yes'
                        }
                    },
                    user: {
                        cancelled: '❌ Reset cancelled',
                        success: '✅ I have been reset back to my initial configuration',
                        confirm: {
                            prompt: '⚠️ Are you sure you want to reset the bot to its initial state?\nThis will:\n- Reset all your user settings back to their defaults\n- Delete all tags you have made\n- Delete all author variables',
                            cancel: 'No',
                            continue: 'Yes'
                        }
                    }
                },
                dump: {
                    description: 'Dumps all persistent information that the bot holds. If used',
                    unavailable: 'The bot cannot be reset here',
                    success: '✅ I have attached the data you requested!',
                    cancelled: '❌ Dump cancelled',
                    confirm: {
                        prompt: '⚠️ Are you sure you want to dump all the information blargbot is holding? This could include some sensitive information, so ensure that it is ok for everyone here to see it.',
                        cancel: 'Cancel',
                        continue: 'Show me that data'
                    }
                }
            },
            ccommand: {
                description: [
                    {
                        name: 'default',
                        input: [{ subtags: 'https://blargbot.xyz/subtags', tos: 'https://blargbot.xyz/tos' }],
                        expected: 'Creates a custom command, using the BBTag language.\n\nCustom commands take precedent over all other commands. As such, you can use it to overwrite commands, or disable them entirely. If the command content is "null" (without the quotations), blargbot will have no output whatsoever, allowing you to disable any built-in command you wish. You cannot overwrite the \'ccommand\' command. For more in-depth command customization, see the `editcommand` command.\nFor more information about BBTag, visit <https://blargbot.xyz/subtags>.\nBy creating a custom command, you acknowledge that you agree to the Terms of Service (<https://blargbot.xyz/tos>)'
                    }
                ],
                request: {
                    name: 'Enter the name of the custom command:',
                    content: 'Enter the custom command\'s contents:'
                },
                errors: {
                    isAlias: [
                        {
                            name: 'default',
                            input: [{ commandName: 'myCommand', tagName: 'myTag' }],
                            expected: '❌ The command `myCommand` is an alias to the tag `myTag`'
                        }
                    ],
                    alreadyExists: [
                        {
                            name: 'default',
                            input: [{ name: 'myCommand' }],
                            expected: '❌ The `myCommand` custom command already exists!'
                        }
                    ],
                    doesNotExist: [
                        {
                            name: 'default',
                            input: [{ name: 'myCommand' }],
                            expected: '❌ The `myCommand` custom command doesn\'t exist!'
                        }
                    ],
                    isHidden: [
                        {
                            name: 'default',
                            input: [{ name: 'myCommand' }],
                            expected: '❌ The `myCommand` custom command is a hidden command!'
                        }
                    ],
                    invalidBBTag: [
                        {
                            name: 'default',
                            input: [{ errors: [util.literal('error 1'), util.literal('error 2'), util.literal('error 3')] }],
                            expected: '❌ There were errors with the bbtag you provided!\nerror 1\nerror 2\nerror 3'
                        }
                    ],
                    bbtagError: [
                        {
                            name: 'default',
                            input: [{ location: { line: 123, column: 456, index: 789 }, message: util.literal('Ya dummy!') }],
                            expected: '❌ [123,456]: Ya dummy!'
                        }
                    ],
                    bbtagWarning: [
                        {
                            name: 'default',
                            input: [{ location: { line: 123, column: 456, index: 789 }, message: util.literal('Ya dummy!') }],
                            expected: '⚠️ [123,456]: Ya dummy!'
                        }
                    ],
                    nameReserved: [
                        {
                            name: 'default',
                            input: [{ name: 'myCommand' }],
                            expected: '❌ The command name `myCommand` is reserved and cannot be overwritten'
                        }
                    ],
                    tooLong: [
                        {
                            name: 'default',
                            input: [{ max: 123 }],
                            expected: '❌ Command names cannot be longer than 123 characters'
                        }
                    ],
                    importDeleted: [
                        {
                            name: 'with author',
                            input: [{ commandName: 'myCommand', tagName: 'myTag', author: { username: 'authorUsername', discriminator: 'authorDiscriminator' }, authorId: 'authorId' }],
                            expected: '❌ When the command `myCommand` was imported, the tag `myTag` was owned by **authorUsername#authorDiscriminator** (authorId) but it no longer exists. To continue using this command, please re-create the tag and re-import it.'
                        },
                        {
                            name: 'without author',
                            input: [{ commandName: 'myCommand', tagName: 'myTag', authorId: 'authorId' }],
                            expected: '❌ When the command `myCommand` was imported, the tag `myTag` was owned by **UNKNOWN#????** (authorId) but it no longer exists. To continue using this command, please re-create the tag and re-import it.'
                        }
                    ],
                    importChanged: [
                        {
                            name: 'with both',
                            input: [{ commandName: 'myCommand', tagName: 'myTag', oldAuthor: { username: 'oldAuthorUsername', discriminator: 'oldAuthorDiscriminator' }, oldAuthorId: 'oldAuthorId', newAuthor: { username: 'newAuthorUsername', discriminator: 'newAuthorDiscriminator' }, newAuthorId: 'newAuthorId' }],
                            expected: '❌ When the command `myCommand` was imported, the tag `myTag` was owned by **oldAuthorUsername#oldAuthorDiscriminator** (oldAuthorId) but it is now owned by **newAuthorUsername#newAuthorDiscriminator** (newAuthorId). If this is acceptable, please re-import the tag to continue using this command.'
                        },
                        {
                            name: 'without old author',
                            input: [{ commandName: 'myCommand', tagName: 'myTag', oldAuthorId: 'oldAuthorId', newAuthor: { username: 'newAuthorUsername', discriminator: 'newAuthorDiscriminator' }, newAuthorId: 'newAuthorId' }],
                            expected: '❌ When the command `myCommand` was imported, the tag `myTag` was owned by **UNKNOWN#????** (oldAuthorId) but it is now owned by **newAuthorUsername#newAuthorDiscriminator** (newAuthorId). If this is acceptable, please re-import the tag to continue using this command.'
                        },
                        {
                            name: 'without new author',
                            input: [{ commandName: 'myCommand', tagName: 'myTag', oldAuthor: { username: 'oldAuthorUsername', discriminator: 'oldAuthorDiscriminator' }, oldAuthorId: 'oldAuthorId', newAuthorId: 'newAuthorId' }],
                            expected: '❌ When the command `myCommand` was imported, the tag `myTag` was owned by **oldAuthorUsername#oldAuthorDiscriminator** (oldAuthorId) but it is now owned by **UNKNOWN#????** (newAuthorId). If this is acceptable, please re-import the tag to continue using this command.'
                        },
                        {
                            name: 'without either',
                            input: [{ commandName: 'myCommand', tagName: 'myTag', oldAuthorId: 'oldAuthorId', newAuthorId: 'newAuthorId' }],
                            expected: '❌ When the command `myCommand` was imported, the tag `myTag` was owned by **UNKNOWN#????** (oldAuthorId) but it is now owned by **UNKNOWN#????** (newAuthorId). If this is acceptable, please re-import the tag to continue using this command.'
                        }
                    ]
                },
                test: {
                    default: {
                        description: 'Uses the BBTag engine to execute the content as if it was a custom command'
                    },
                    debug: {
                        description: 'Uses the BBTag engine to execute the content as if it was a custom command and will return the debug output'
                    }
                },
                docs: {
                    description: 'Returns helpful information about the specified topic.'
                },
                debug: {
                    description: 'Runs a custom command with some arguments. A debug file will be sent in a DM after the command has finished.',
                    notOwner: '❌ You cannot debug someone else\'s custom command.',
                    success: 'ℹ️ Ive sent the debug output in a DM'
                },
                create: {
                    description: 'Creates a new custom command with the content you give',
                    success: [
                        {
                            name: 'default',
                            input: [{ name: 'myCommand', errors: [util.literal('error 1'), util.literal('error 2'), util.literal('error 3')] }],
                            expected: '✅ Custom command `myCommand` created.\nerror 1\nerror 2\nerror 3'
                        }
                    ]
                },
                edit: {
                    description: 'Edits an existing custom command to have the content you specify',
                    success: [
                        {
                            name: 'default',
                            input: [{ name: 'myCommand', errors: [util.literal('error 1'), util.literal('error 2'), util.literal('error 3')] }],
                            expected: '✅ Custom command `myCommand` edited.\nerror 1\nerror 2\nerror 3'
                        }
                    ]
                },
                set: {
                    description: 'Sets the custom command to have the content you specify. If the custom command doesn\'t exist it will be created.',
                    success: [
                        {
                            name: 'default',
                            input: [{ name: 'myCommand', errors: [util.literal('error 1'), util.literal('error 2'), util.literal('error 3')] }],
                            expected: '✅ Custom command `myCommand` set.\nerror 1\nerror 2\nerror 3'
                        }
                    ]
                },
                delete: {
                    description: 'Deletes an existing custom command',
                    success: [
                        {
                            name: 'default',
                            input: [{ name: 'myCommand' }],
                            expected: '✅ The `myCommand` custom command is gone forever!'
                        }
                    ]
                },
                rename: {
                    description: 'Renames the custom command',
                    enterOldName: 'Enter the name of the custom command to rename:',
                    enterNewName: 'Enter the new name of the custom command:',
                    success: [
                        {
                            name: 'default',
                            input: [{ oldName: 'oldCommandName', newName: 'newCommandName' }],
                            expected: '✅ The `oldCommandName` custom command has been renamed to `newCommandName`.'
                        }
                    ]
                },
                raw: {
                    description: 'Gets the raw content of the custom command',
                    inline: [
                        {
                            name: 'default',
                            input: [{ name: 'myCommand', content: 'My command content' }],
                            expected: 'ℹ️ The raw code for myCommand is: ```\nMy command content\n```'
                        }
                    ],
                    attached: [
                        {
                            name: 'default',
                            input: [{ name: 'myCommand' }],
                            expected: 'ℹ️ The raw code for myCommand is attached'
                        }
                    ]
                },
                list: {
                    description: 'Lists all custom commands on this server',
                    embed: {
                        title: 'List of custom commands',
                        field: {
                            anyRole: {
                                name: 'Any role'
                            }
                        }
                    }
                },
                cooldown: {
                    description: 'Sets the cooldown of a custom command, in milliseconds',
                    mustBePositive: '❌ The cooldown must be greater than 0ms',
                    success: [
                        {
                            name: 'default',
                            input: [{ name: 'myCommand', cooldown: moment.duration(123456) }],
                            expected: '✅ The custom command `myCommand` now has a cooldown of `123,456ms`.'
                        }
                    ]
                },
                author: {
                    description: 'Displays the name of the custom command\'s author',
                    noAuthorizer: [
                        {
                            name: 'with author',
                            input: [{ name: 'myCommand', author: { username: 'authorUsername', discriminator: 'authorDiscriminator' } }],
                            expected: '✅ The custom command `myCommand` was made by **authorUsername#authorDiscriminator**'
                        },
                        {
                            name: 'without author',
                            input: [{ name: 'myCommand' }],
                            expected: '✅ The custom command `myCommand` was made by **UNKNOWN#????**'
                        }
                    ],
                    withAuthorizer: [
                        {
                            name: 'with both',
                            input: [{ name: 'myCommand', author: { username: 'authorUsername', discriminator: 'authorDiscriminator' }, authorizer: { username: 'authorizerUsername', discriminator: 'authorizerDiscriminator' } }],
                            expected: '✅ The custom command `myCommand` was made by **authorUsername#authorDiscriminator** and is authorized by **authorizerUsername#authorizerDiscriminator**'
                        },
                        {
                            name: 'without authorizer',
                            input: [{ name: 'myCommand', author: { username: 'authorUsername', discriminator: 'authorDiscriminator' } }],
                            expected: '✅ The custom command `myCommand` was made by **authorUsername#authorDiscriminator** and is authorized by **UNKNOWN#????**'
                        },
                        {
                            name: 'without author',
                            input: [{ name: 'myCommand', authorizer: { username: 'authorizerUsername', discriminator: 'authorizerDiscriminator' } }],
                            expected: '✅ The custom command `myCommand` was made by **UNKNOWN#????** and is authorized by **authorizerUsername#authorizerDiscriminator**'
                        },
                        {
                            name: 'without either',
                            input: [{ name: 'myCommand' }],
                            expected: '✅ The custom command `myCommand` was made by **UNKNOWN#????** and is authorized by **UNKNOWN#????**'
                        }
                    ]
                },
                flag: {
                    updated: [
                        {
                            name: 'default',
                            input: [{ name: 'myCommand' }],
                            expected: '✅ The flags for `myCommand` have been updated.'
                        }
                    ],
                    get: {
                        description: 'Lists the flags the custom command accepts',
                        none: [
                            {
                                name: 'default',
                                input: [{ name: 'myCommand' }],
                                expected: '❌ The `myCommand` custom command has no flags.'
                            }
                        ],
                        success: [
                            {
                                name: 'default',
                                input: [{
                                    name: 'myCommand',
                                    flags: [
                                        { flag: '1', word: 'flag1', description: 'Hmmmmm' },
                                        { flag: '2', word: 'flag2', description: 'AAAAAAA' }
                                    ]
                                }],
                                expected: '✅ The `myCommand` custom command has the following flags:\n\n`-1`/`--flag1`: Hmmmmm\n`-2`/`--flag2`: AAAAAAA'
                            }
                        ]
                    },
                    create: {
                        description: 'Adds multiple flags to your custom command. Flags should be of the form `-<f> <flag> [flag description]`\ne.g. `b!cc flags add myCommand -c category The category you want to use -n name Your name`',
                        wordMissing: [
                            {
                                name: 'default',
                                input: [{ flag: '1' }],
                                expected: '❌ No word was specified for the `1` flag'
                            }
                        ],
                        flagExists: [
                            {
                                name: 'default',
                                input: [{ flag: '1' }],
                                expected: '❌ The flag `1` already exists!'
                            }
                        ],
                        wordExists: [
                            {
                                name: 'default',
                                input: [{ word: 'flag1' }],
                                expected: '❌ A flag with the word `flag1` already exists!'
                            }
                        ]
                    },
                    delete: {
                        description: 'Removes multiple flags from your custom command. Flags should be of the form `-<f>`\ne.g. `b!cc flags remove myCommand -c -n`'
                    }
                },
                setHelp: {
                    description: 'Sets the help text to show for the command',
                    success: [
                        {
                            name: 'default',
                            input: [{ name: 'myCommand' }],
                            expected: '✅ Help text for custom command `myCommand` set.'
                        }
                    ]
                },
                hide: {
                    description: 'Toggles whether the command is hidden from the command list or not',
                    success: [
                        {
                            name: 'hidden',
                            input: [{ name: 'myCommand', hidden: true }],
                            expected: '✅ Custom command `myCommand` is now hidden.'
                        },
                        {
                            name: 'visible',
                            input: [{ name: 'myCommand', hidden: false }],
                            expected: '✅ Custom command `myCommand` is now visible.'
                        }
                    ]
                },
                setRole: {
                    description: 'Sets the roles that are allowed to use the command',
                    success: [
                        {
                            name: 'default',
                            input: [{
                                name: 'myCommand',
                                roles: [
                                    quickMock(role, { mention: '<@&role1Id>' }),
                                    quickMock(role, { mention: '<@&role2Id>' }),
                                    quickMock(role, { mention: '<@&role3Id>' })
                                ]
                            }],
                            expected: '✅ Roles for custom command `myCommand` set to <@&role1Id>, <@&role2Id> and <@&role3Id>.'
                        }
                    ]
                },
                shrinkwrap: {
                    description: 'Bundles up the given commands into a single file that you can download and install into another server',
                    confirm: {
                        prompt: [
                            {
                                name: 'default',
                                input: [{ steps: [util.literal('step 1'), util.literal('step 2'), util.literal('step 3')] }],
                                expected: 'Salutations! You have discovered the super handy ShrinkWrapper9000!\n\nIf you decide to proceed, this will:\nstep 1\nstep 2\nstep 3\nThis will not:\n - Export variables\n - Export authors or authorizers\n - Export dependencies'
                            }
                        ],
                        export: [
                            {
                                name: 'default',
                                input: [{ name: 'myCommand' }],
                                expected: ' - Export the custom command `myCommand`'
                            }
                        ],
                        continue: 'Confirm',
                        cancel: 'Cancel'
                    },
                    cancelled: '✅ Maybe next time then.',
                    success: '✅ No problem, my job here is done.'
                },
                install: {
                    description: 'Bundles up the given commands into a single file that you can download and install into another server',
                    fileMissing: '❌ You have to upload the installation file, or give me a URL to one.',
                    malformed: '❌ Your installation file was malformed.',
                    confirm: {
                        unsigned: '⚠️ **Warning**: This installation file is **unsigned**. It did not come from me. Please double check to make sure you want to go through with this.',
                        tampered: '⚠️ **Warning**: This installation file\'s signature is **incorrect**. There is a 100% chance that it has been tampered with. Please double check to make sure you want to go through with this.',
                        prompt: [
                            {
                                name: 'with warning',
                                input: [{ warning: util.literal('My cool warning'), steps: [util.literal('step 1'), util.literal('step 2'), util.literal('step 3')] }],
                                expected: 'My cool warning\n\nSalutations! You have discovered the super handy CommandInstaller9000!\n\nIf you decide to proceed, this will:\nstep 1\nstep 2\nstep 3\nThis will also:\n - Set you as the author for all imported commands'
                            },
                            {
                                name: 'no warning',
                                input: [{ steps: [util.literal('step 1'), util.literal('step 2'), util.literal('step 3')] }],
                                expected: 'Salutations! You have discovered the super handy CommandInstaller9000!\n\nIf you decide to proceed, this will:\nstep 1\nstep 2\nstep 3\nThis will also:\n - Set you as the author for all imported commands'
                            }
                        ],
                        import: [
                            {
                                name: 'default',
                                input: [{ name: 'myCommand' }],
                                expected: '✅ Import the command `myCommand`'
                            }
                        ],
                        skip: [
                            {
                                name: 'default',
                                input: [{ name: 'myCommand' }],
                                expected: '❌ Ignore the command `myCommand` as a command with that name already exists'
                            }
                        ],
                        continue: 'Confirm',
                        cancel: 'Cancel'
                    },
                    cancelled: '✅ Maybe next time then.',
                    success: '✅ No problem, my job here is done.'
                },
                import: {
                    description: 'Imports a tag as a ccommand, retaining all data such as author variables',
                    tagMissing: [
                        {
                            name: 'default',
                            input: [{ name: 'myTag' }],
                            expected: '❌ The `myTag` tag doesn\'t exist!'
                        }
                    ],
                    success: [
                        {
                            name: 'with both',
                            input: [{ tagName: 'myTag', commandName: 'myCommand', author: { username: 'authorUsername', discriminator: 'authorDiscriminator' }, authorizer: { username: 'authorizerUsername', discriminator: 'authorizerDiscriminator' } }],
                            expected: '✅ The tag `myTag` by **authorUsername#authorDiscriminator** has been imported as `myCommand` and is authorized by **authorizerUsername#authorizerDiscriminator**'
                        },
                        {
                            name: 'without author',
                            input: [{ tagName: 'myTag', commandName: 'myCommand', authorizer: { username: 'authorizerUsername', discriminator: 'authorizerDiscriminator' } }],
                            expected: '✅ The tag `myTag` by **UNKNOWN#????** has been imported as `myCommand` and is authorized by **authorizerUsername#authorizerDiscriminator**'
                        },
                        {
                            name: 'with authorizer',
                            input: [{ tagName: 'myTag', commandName: 'myCommand', author: { username: 'authorUsername', discriminator: 'authorDiscriminator' } }],
                            expected: '✅ The tag `myTag` by **authorUsername#authorDiscriminator** has been imported as `myCommand` and is authorized by **UNKNOWN#????**'
                        },
                        {
                            name: 'without author',
                            input: [{ tagName: 'myTag', commandName: 'myCommand' }],
                            expected: '✅ The tag `myTag` by **UNKNOWN#????** has been imported as `myCommand` and is authorized by **UNKNOWN#????**'
                        }
                    ]
                }
            },
            censor: {
                flags: {
                    regex: 'If specified, parse as /regex/ rather than plaintext. Unsafe and very long (more than 2000 characters) regexes will not parse successfully.',
                    decancer: 'If specified, perform the censor check against the decancered version of the message.',
                    weight: 'How many incidents the censor is worth.',
                    reason: 'A custom modlog reason. NOT BBTag compatible.'
                },
                errors: {
                    doesNotExist: [
                        {
                            name: 'default',
                            input: [{ id: 123 }],
                            expected: '❌ Censor `123` doesn\'t exist'
                        }
                    ],
                    weightNotNumber: [
                        {
                            name: 'default',
                            input: [{ value: 'definitely not a number' }],
                            expected: '❌ The censor weight must be a number but `definitely not a number` is not'
                        }
                    ],
                    invalidType: [
                        {
                            name: 'default',
                            input: [{ type: 'type is wrong' }],
                            expected: '❌ `type is wrong` is not a valid type'
                        }
                    ],
                    messageNotSet: {
                        default: [
                            {
                                name: 'default',
                                input: [{ type: 'cool' }],
                                expected: '❌ A custom default cool message has not been set yet'
                            }
                        ],
                        id: [
                            {
                                name: 'default',
                                input: [{ type: 'cool', id: 123 }],
                                expected: '❌ A custom cool message for censor 123 has not been set yet'
                            }
                        ]
                    }
                },
                add: {
                    description: 'Creates a censor using the given phrase',
                    success: [
                        {
                            name: 'default',
                            input: [{ id: 213 }],
                            expected: '✅ Censor `213` has been created'
                        }
                    ]
                },
                edit: {
                    description: 'Updates a censor',
                    success: [
                        {
                            name: 'default',
                            input: [{ id: 213 }],
                            expected: '✅ Censor `213` has been updated'
                        }
                    ]
                },
                delete: {
                    description: 'Deletes a censor',
                    success: [
                        {
                            name: 'default',
                            input: [{ id: 123 }],
                            expected: '✅ Censor `123` has been deleted'
                        }
                    ]
                },
                exception: {
                    user: {
                        description: 'Adds or removes a user from the list of users which all censors ignore',
                        success: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '✅ <@userId> is now exempt from all censors'
                            }
                        ]
                    },
                    role: {
                        description: 'Adds or removes a role from the list of roles which all censors ignore',
                        success: [
                            {
                                name: 'default',
                                input: [{ role: quickMock(role, { mention: '<@&roleId>' }) }],
                                expected: '✅ Anyone with the role <@&roleId> is now exempt from all censors'
                            }
                        ]
                    },
                    channel: {
                        description: 'Adds or removes a channel from the list of channels which all censors ignore',
                        notOnServer: '❌ The channel must be on this server!',
                        success: [
                            {
                                name: 'default',
                                input: [{ channel: quickMock(channel, { mention: '<#channelId>' }) }],
                                expected: '✅ Messages sent in <#channelId> are now exempt from all censors'
                            }
                        ]
                    }
                },
                setMessage: {
                    description: 'Sets the message so show when the given censor causes a user to be granted a `timeout`, or to be `kick`ed or `ban`ned, or the message is `delete`d\nIf `id` is not provided, the message will be the default message that gets shown if one isn\'t set for the censor that is triggered',
                    success: {
                        default: [
                            {
                                name: 'default',
                                input: [{ type: 'cool' }],
                                expected: '✅ The default cool message has been set'
                            }
                        ],
                        id: [
                            {
                                name: 'default',
                                input: [{ type: 'cool', id: 123 }],
                                expected: '✅ The cool message for censor 123 has been set'
                            }
                        ]
                    }
                },
                setAuthorizer: {
                    description: 'Sets the custom censor message to use your permissions when executing.',
                    success: {
                        default: [
                            {
                                name: 'default',
                                input: [{ type: 'cool' }],
                                expected: '✅ The default cool message authorizer has been set'
                            }
                        ],
                        id: [
                            {
                                name: 'default',
                                input: [{ type: 'cool', id: 123 }],
                                expected: '✅ The cool message authorizer for censor 123 has been set'
                            }
                        ]
                    }
                },
                rawMessage: {
                    description: 'Gets the raw code for the given censor',
                    inline: {
                        default: [
                            {
                                name: 'default',
                                input: [{ type: 'cool', content: 'my censor content' }],
                                expected: 'ℹ️ The raw code for the default cool message is: ```\nmy censor content\n```'
                            }
                        ],
                        id: [
                            {
                                name: 'default',
                                input: [{ type: 'cool', id: 123, content: 'my censor content' }],
                                expected: 'ℹ️ The raw code for the cool message for censor `123` is: ```\nmy censor content\n```'
                            }
                        ]
                    },
                    attached: {
                        default: [
                            {
                                name: 'default',
                                input: [{ type: 'cool' }],
                                expected: 'ℹ️ The raw code for the default cool message is attached'
                            }
                        ],
                        id: [
                            {
                                name: 'default',
                                input: [{ type: 'cool', id: 123 }],
                                expected: 'ℹ️ The raw code for the cool message for censor `123` is attached'
                            }
                        ]
                    }
                },
                debug: {
                    description: 'Sets the censor to send you the debug output when it is next triggered by one of your messages. Make sure you aren\'t exempt from censors!',
                    success: [
                        {
                            name: 'default',
                            input: [{ id: 123 }],
                            expected: '✅ The next message that you send that triggers censor `123` will send the debug output here'
                        }
                    ]
                },
                list: {
                    description: 'Lists all the details about the censors that are currently set up on this server',
                    embed: {
                        title: 'ℹ️ Censors',
                        description: {
                            value: [
                                {
                                    name: 'default',
                                    input: [{ censors: [util.literal('censor 1'), util.literal('censor 2'), util.literal('censor 3')] }],
                                    expected: 'censor 1\ncensor 2\ncensor 3'
                                }
                            ],
                            censor: {
                                regex: [
                                    {
                                        name: 'default',
                                        input: [{ id: 123, term: '/^Some regex$/g' }],
                                        expected: '**Censor** `123` (Regex): /^Some regex$/g'
                                    }
                                ],
                                text: [
                                    {
                                        name: 'default',
                                        input: [{ id: 123, term: 'some text' }],
                                        expected: '**Censor** `123`: some text'
                                    }
                                ]
                            },
                            none: 'No censors configured'
                        },
                        field: {
                            users: {
                                name: 'Excluded users',
                                value: [
                                    {
                                        name: 'none',
                                        input: [{ users: [] }],
                                        expected: 'None'
                                    },
                                    {
                                        name: 'some',
                                        input: [{ users: ['userId1', 'userId2', 'userId3'] }],
                                        expected: '<@userId1> <@userId2> <@userId3>'
                                    }
                                ]
                            },
                            roles: {
                                name: 'Excluded roles',
                                value: [
                                    {
                                        name: 'none',
                                        input: [{ roles: [] }],
                                        expected: 'None'
                                    },
                                    {
                                        name: 'some',
                                        input: [{ roles: ['roleId1', 'roleId2', 'roleId3'] }],
                                        expected: '<@&roleId1> <@&roleId2> <@&roleId3>'
                                    }
                                ]
                            },
                            channels: {
                                name: 'Excluded channels',
                                value: [
                                    {
                                        name: 'none',
                                        input: [{ channels: [] }],
                                        expected: 'None'
                                    },
                                    {
                                        name: 'some',
                                        input: [{ channels: ['channelId1', 'channelId2', 'channelId3'] }],
                                        expected: '<#channelId1> <#channelId2> <#channelId3>'
                                    }
                                ]
                            }
                        }
                    }
                },
                info: {
                    description: 'Gets detailed information about the given censor',
                    messageFieldValue: {
                        notSet: 'Not set',
                        set: [
                            {
                                name: 'default',
                                input: [{ authorId: 'authorId', authorizerId: 'authorizerId' }],
                                expected: 'Author: <@authorId>\nAuthorizer: <@authorizerId>'
                            }
                        ]
                    },
                    embed: {
                        title: [
                            {
                                name: 'default',
                                input: [{ id: 123 }],
                                expected: 'ℹ️ Censor `123`'
                            }
                        ],
                        field: {
                            trigger: {
                                name: {
                                    regex: 'Trigger (Regex)',
                                    text: 'Trigger'
                                }
                            },
                            weight: {
                                name: 'Weight',
                                value: [
                                    {
                                        name: 'default',
                                        input: [{ weight: 123 }],
                                        expected: '123'
                                    }
                                ]
                            },
                            reason: {
                                name: 'Reason',
                                value: [
                                    {
                                        name: 'not set',
                                        input: [{}],
                                        expected: 'Not set'
                                    },
                                    {
                                        name: 'default',
                                        input: [{ reason: 'My cool reason' }],
                                        expected: 'My cool reason'
                                    }
                                ]
                            },
                            deleteMessage: {
                                name: 'Delete message'
                            },
                            timeoutMessage: {
                                name: 'Timeout message'
                            },
                            kickMessage: {
                                name: 'Kick message'
                            },
                            banMessage: {
                                name: 'Ban message'
                            }
                        }
                    }
                }
            },
            changeLog: {
                errors: {
                    missingPermissions: '❌ I need the manage webhooks permission to subscribe this channel to changelogs!'
                },
                subscribe: {
                    description: 'Subscribes this channel to my changelog updates. I require the `manage webhooks` permission for this.',
                    alreadySubscribed: 'ℹ️ This channel is already subscribed to my changelog updates!',
                    success: '✅ This channel will now get my changelog updates!'
                },
                unsubscribe: {
                    description: 'Unsubscribes this channel from my changelog updates. I require the `manage webhooks` permission for this.',
                    notSubscribed: 'ℹ️ This channel is not subscribed to my changelog updates!',
                    success: '✅ This channel will no longer get my changelog updates!'
                }
            },
            editCommand: {
                list: {
                    description: 'Shows a list of modified commands',
                    none: 'ℹ️ You haven\'t modified any commands',
                    embed: {
                        title: 'ℹ️ Edited commands',
                        description: {
                            name: [
                                {
                                    name: 'default',
                                    input: [{ name: 'myCommand' }],
                                    expected: '**myCommand**\n'
                                }
                            ],
                            roles: [
                                {
                                    name: 'default',
                                    input: [{
                                        roles: [
                                            quickMock(role, { mention: '<@&role1Id>' }),
                                            quickMock(role, { mention: '<@&role2Id>' }),
                                            quickMock(role, { mention: '<@&role3Id>' })
                                        ]
                                    }],
                                    expected: '- Roles: <@&role1Id>, <@&role2Id>, <@&role3Id>\n'
                                }
                            ],
                            permissions: [
                                {
                                    name: 'default',
                                    input: [{ permission: '238947623478' }],
                                    expected: '- Permission: 238947623478\n'
                                }
                            ],
                            disabled: '- Disabled\n',
                            hidden: '- Hidden\n',
                            template: [
                                {
                                    name: 'default',
                                    input: [{
                                        commands: [
                                            { name: util.literal('name 1'), roles: util.literal('role 1'), permissions: util.literal('perm 1'), disabled: util.literal('disabled 1'), hidden: util.literal('hidden 1') },
                                            { name: util.literal('name 2'), roles: util.literal('role 2'), permissions: util.literal('perm 2'), disabled: util.literal('disabled 2') },
                                            { name: util.literal('name 3'), roles: util.literal('role 3'), permissions: util.literal('perm 3'), hidden: util.literal('hidden 3') },
                                            { name: util.literal('name 4'), roles: util.literal('role 4'), disabled: util.literal('disabled 4'), hidden: util.literal('hidden 4') },
                                            { name: util.literal('name 5'), permissions: util.literal('perm 5'), disabled: util.literal('disabled 5'), hidden: util.literal('hidden 5') },
                                            { name: util.literal('name 6'), roles: util.literal('role 6'), permissions: util.literal('perm 6') },
                                            { name: util.literal('name 7'), roles: util.literal('role 7'), disabled: util.literal('disabled 7') },
                                            { name: util.literal('name 8'), permissions: util.literal('perm 8'), disabled: util.literal('disabled 8') },
                                            { name: util.literal('name 9'), roles: util.literal('role 9'), hidden: util.literal('hidden 9') },
                                            { name: util.literal('name 10'), permissions: util.literal('perm 10'), hidden: util.literal('hidden 10') },
                                            { name: util.literal('name 11'), disabled: util.literal('disabled 11'), hidden: util.literal('hidden 11') },
                                            { name: util.literal('name 12'), roles: util.literal('role 12') },
                                            { name: util.literal('name 13'), permissions: util.literal('perm 13') },
                                            { name: util.literal('name 14'), disabled: util.literal('disabled 14') },
                                            { name: util.literal('name 15'), hidden: util.literal('hidden 15') },
                                            { name: util.literal('name 16') }
                                        ]
                                    }],
                                    expected: 'name 1role 1perm 1disabled 1hidden 1\nname 2role 2perm 2disabled 2\nname 3role 3perm 3hidden 3\nname 4role 4disabled 4hidden 4\nname 5perm 5disabled 5hidden 5\nname 6role 6perm 6\nname 7role 7disabled 7\nname 8perm 8disabled 8\nname 9role 9hidden 9\nname 10perm 10hidden 10\nname 11disabled 11hidden 11\nname 12role 12\nname 13perm 13\nname 14disabled 14\nname 15hidden 15\nname 16'
                                }
                            ]
                        }
                    }
                },
                setRole: {
                    description: 'Sets the role required to run the listed commands',
                    removed: [
                        {
                            name: 'default',
                            input: [{ commands: ['command 1', 'command 2', 'command 3'] }],
                            expected: '✅ Removed the role requirement for the following commands:```fix\ncommand 1, command 2, command 3\n```'
                        }
                    ],
                    set: [
                        {
                            name: 'default',
                            input: [{ commands: ['command 1', 'command 2', 'command 3'] }],
                            expected: '✅ Set the role requirement for the following commands:```fix\ncommand 1, command 2, command 3\n```'
                        }
                    ]
                },
                setPermissions: {
                    description: 'Sets the permissions required to run the listed commands. If a user has any of the permissions, they will be able to use the command.',
                    removed: [
                        {
                            name: 'default',
                            input: [{ commands: ['command 1', 'command 2', 'command 3'] }],
                            expected: '✅ Removed the permissions for the following commands:```fix\ncommand 1, command 2, command 3\n```'
                        }
                    ],
                    set: [
                        {
                            name: 'default',
                            input: [{ commands: ['command 1', 'command 2', 'command 3'] }],
                            expected: '✅ Set the permissions for the following commands:```fix\ncommand 1, command 2, command 3\n```'
                        }
                    ]
                },
                disable: {
                    description: 'Disables the listed commands, so no one but the owner can use them',
                    success: [
                        {
                            name: 'default',
                            input: [{ commands: ['command 1', 'command 2', 'command 3'] }],
                            expected: '✅ Disabled the following commands:```fix\ncommand 1, command 2, command 3\n```'
                        }
                    ]
                },
                enable: {
                    description: 'Enables the listed commands, allowing anyone with the correct permissions or roles to use them',
                    success: [
                        {
                            name: 'default',
                            input: [{ commands: ['command 1', 'command 2', 'command 3'] }],
                            expected: '✅ Enabled the following commands:```fix\ncommand 1, command 2, command 3\n```'
                        }
                    ]
                },
                hide: {
                    description: 'Hides the listed commands. They can still be executed, but wont show up in help',
                    success: [
                        {
                            name: 'default',
                            input: [{ commands: ['command 1', 'command 2', 'command 3'] }],
                            expected: '✅ The following commands are now hidden:```fix\ncommand 1, command 2, command 3\n```'
                        }
                    ]
                },
                show: {
                    description: 'Reveals the listed commands in help',
                    success: [
                        {
                            name: 'default',
                            input: [{ commands: ['command 1', 'command 2', 'command 3'] }],
                            expected: '✅ The following commands are no longer hidden:```fix\ncommand 1, command 2, command 3\n```'
                        }
                    ]
                }
            },
            farewell: {
                errors: {
                    notSet: '❌ No farewell message has been set yet!'
                },
                set: {
                    description: 'Sets the bbtag to send when someone leaves the server',
                    success: '✅ The farewell message has been set'
                },
                raw: {
                    description: 'Gets the current message that will be sent when someone leaves the server',
                    inline: [
                        {
                            name: 'default',
                            input: [{ content: 'my farewell content' }],
                            expected: 'ℹ️ The raw code for the farewell message is: ```\nmy farewell content\n```'
                        }
                    ],
                    attached: 'ℹ️ The raw code for the farewell message is attached'
                },
                setAuthorizer: {
                    description: 'Sets the farewell message to use your permissions when running',
                    success: '✅ The farewell message will now run using your permissions'
                },
                setChannel: {
                    description: 'Sets the channel the farewell message will be sent in.',
                    notOnGuild: '❌ The farewell channel must be on this server!',
                    notTextChannel: '❌ The farewell channel must be a text channel!',
                    success: [
                        {
                            name: 'default',
                            input: [{ channel: quickMock(channel, { mention: '<#channelId>' }) }],
                            expected: '✅ Farewell messages will now be sent in <#channelId>'
                        }
                    ]
                },
                debug: {
                    description: 'Executes the farewell message as if you left the server and provides the debug output.',
                    channelMissing: '❌ I wasn\'t able to locate a channel to sent the message in!',
                    success: 'ℹ️ Ive sent the debug output in a DM'
                },
                delete: {
                    description: 'Deletes the current farewell message.',
                    success: '✅ Farewell messages will no longer be sent'
                },
                info: {
                    description: 'Shows information about the current farewell message',
                    success: [
                        {
                            name: 'default',
                            input: [{ authorId: 'authorId', authorizerId: 'authorizerId' }],
                            expected: 'ℹ️ The current farewell was last edited by <@authorId> (authorId) and is authorized by <@authorizerId> (authorizerId)'
                        }
                    ]
                }
            },
            greeting: {
                errors: {
                    notSet: '❌ No greeting message has been set yet!'
                },
                set: {
                    description: 'Sets the message to send when someone joins the server',
                    success: '✅ The greeting message has been set'
                },
                raw: {
                    description: 'Gets the current message that will be sent when someone joins the server',
                    inline: [
                        {
                            name: 'default',
                            input: [{ content: 'my greeting content' }],
                            expected: 'ℹ️ The raw code for the greeting message is: \nmy greeting content\n```'
                        }
                    ],
                    attached: 'ℹ️ The raw code for the greeting message is attached'
                },
                setAuthorizer: {
                    description: 'Sets the greeting message to use your permissions when running',
                    success: '✅ The greeting message will now run using your permissions'
                },
                setChannel: {
                    description: 'Sets the channel the greeting message will be sent in.',
                    notOnGuild: '❌ The greeting channel must be on this server!',
                    notTextChannel: '❌ The greeting channel must be a text channel!',
                    success: [
                        {
                            name: 'default',
                            input: [{ channel: quickMock(channel, { mention: '<#channelId>' }) }],
                            expected: '✅ Greeting messages will now be sent in <#channelId>'
                        }
                    ]
                },
                debug: {
                    description: 'Executes the greeting message as if you left the server and provides the debug output.',
                    channelMissing: '❌ I wasn\'t able to locate a channel to sent the message in!',
                    success: 'ℹ️ Ive sent the debug output in a DM'
                },
                delete: {
                    description: 'Deletes the current greeting message.',
                    success: '✅ Greeting messages will no longer be sent'
                },
                info: {
                    description: 'Shows information about the current greeting message',
                    success: [
                        {
                            name: 'default',
                            input: [{ authorId: 'authorId', authorizerId: 'authorizerId' }],
                            expected: 'ℹ️ The current greeting was last edited by <@authorId> (authorId) and is authorized by <@authorizerId> (authorizerId)'
                        }
                    ]
                }
            },
            interval: {
                errors: {
                    notSet: '❌ No interval has been set yet!'
                },
                set: {
                    description: 'Sets the bbtag to run every 15 minutes',
                    success: '✅ The interval has been set'
                },
                raw: {
                    description: 'Gets the current code that the interval is running',
                    inline: [
                        {
                            name: 'default',
                            input: [{ content: 'my interval content' }],
                            expected: 'ℹ️ The raw code for the interval is: ```\nmy interval content\n```'
                        }
                    ],
                    attached: 'ℹ️ The raw code for the interval is attached'
                },
                delete: {
                    description: 'Deletes the current interval',
                    success: '✅ The interval has been deleted'
                },
                setAuthorizer: {
                    description: 'Sets the interval to run using your permissions',
                    success: '✅ Your permissions will now be used when the interval runs'
                },
                debug: {
                    description: 'Runs the interval now and sends the debug output',
                    failed: '❌ There was an error while running the interval!',
                    authorizerMissing: '❌ I couldn\'t find the user who authorizes the interval!',
                    channelMissing: '❌ I wasn\'t able to figure out which channel to run the interval in!',
                    timedOut: [
                        {
                            name: 'default',
                            input: [{ max: moment.duration(123000) }],
                            expected: '❌ The interval took longer than the max allowed time (123s)'
                        }
                    ],
                    success: 'ℹ️ Ive sent the debug output in a DM'
                },
                info: {
                    description: 'Shows information about the current interval',
                    success: [
                        {
                            name: 'default',
                            input: [{ authorId: 'authorId', authorizerId: 'authorizerId' }],
                            expected: 'ℹ️ The current interval was last edited by <@authorId> (authorId) and is authorized by <@authorizerId> (authorizerId)'
                        }
                    ]
                }
            },
            kick: {
                flags: {
                    reason: 'The reason for the kick.'
                },
                default: {
                    description: 'Kicks a user.\nIf mod-logging is enabled, the kick will be logged.',
                    state: {
                        memberTooHigh: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '❌ I don\'t have permission to kick **<@userId>**! Their highest role is above my highest role.'
                            }
                        ],
                        moderatorTooLow: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '❌ You don\'t have permission to kick **<@userId>**! Their highest role is above your highest role.'
                            }
                        ],
                        noPerms: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '❌ I don\'t have permission to kick **<@userId>**! Make sure I have the `kick members` permission and try again.'
                            }
                        ],
                        moderatorNoPerms: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '❌ You don\'t have permission to kick **<@userId>**! Make sure you have the `kick members` permission or one of the permissions specified in the `kick override` setting and try again.'
                            }
                        ],
                        success: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '✅ **<@userId>** has been kicked.'
                            }
                        ]
                    }
                }
            },
            log: {
                common: {
                    events: {
                        avatarupdate: 'Triggered when someone changes their username',
                        kick: 'Triggered when a member is kicked',
                        memberban: 'Triggered when a member is banned',
                        memberjoin: 'Triggered when someone joins',
                        memberleave: 'Triggered when someone leaves',
                        membertimeout: 'Triggered when someone is timed out',
                        membertimeoutclear: 'Triggered when someone\'s timeout is removed',
                        memberunban: 'Triggered when someone is unbanned',
                        messagedelete: 'Triggered when someone deletes a message they sent',
                        messageupdate: 'Triggered when someone updates a message they sent',
                        nameupdate: 'Triggered when someone changes their username or discriminator',
                        nickupdate: 'Triggered when someone changes their nickname'
                    }
                },
                list: {
                    description: 'Lists all the events currently being logged',
                    embed: {
                        field: {
                            ignore: {
                                name: 'Ignored users',
                                value: [
                                    {
                                        name: 'none',
                                        input: [{ userIds: [] }],
                                        expected: 'No ignored users'
                                    },
                                    {
                                        name: 'some',
                                        input: [{ userIds: ['userId1', 'userId2', 'userId3'] }],
                                        expected: '<@userId1> (userId1)\n<@userId2> (userId2)\n<@userId3> (userId3)'
                                    }
                                ]
                            },
                            current: {
                                name: 'Currently logged events',
                                value: {
                                    event: [
                                        {
                                            name: 'default',
                                            input: [{ event: 'cool event', channelId: 'channelId' }],
                                            expected: '**cool event** - <#channelId>}'
                                        }
                                    ],
                                    role: [
                                        {
                                            name: 'default',
                                            input: [{ roleId: 'roleId', channelId: 'channelId' }],
                                            expected: '**roleId** - <#channelId>}'
                                        }
                                    ],
                                    template: [
                                        {
                                            name: 'none',
                                            input: [{ entries: [] }],
                                            expected: 'No logged events'
                                        },
                                        {
                                            name: 'some',
                                            input: [{ entries: [util.literal('event 1'), util.literal('event 2'), util.literal('event 3')] }],
                                            expected: 'event 1\nevent 2\nevent 3'
                                        }
                                    ]
                                }
                            }
                        }
                    }
                },
                enable: {
                    description: {
                        default: [
                            {
                                name: 'default',
                                input: [{
                                    events: [
                                        { key: 'event 1', desc: util.literal('event 1 description') },
                                        { key: 'event 2', desc: util.literal('event 2 description') },
                                        { key: 'event 3', desc: util.literal('event 3 description') }
                                    ]
                                }],
                                expected: 'Sets the channel to log the given events to. Available events are:\n`event 1` - event 1 description\n`event 2` - event 2 description\n`event 3` - event 3 description'
                            }
                        ],
                        all: 'Sets the channel to log all events to, except role related events.',
                        role: 'Sets the channel to log when someone gets or loses a role.'
                    },
                    notOnGuild: '❌ The log channel must be on this server!',
                    notTextChannel: '❌ The log channel must be a text channel!',
                    eventInvalid: [
                        {
                            name: 'single',
                            input: [{ events: ['event 1'] }],
                            expected: '❌ event 1 is not a valid event'
                        },
                        {
                            name: 'multiple',
                            input: [{ events: ['event 1', 'event 2', 'event 3'] }],
                            expected: '❌ event 1, event 2 and event 3 are not valid events'
                        }
                    ],
                    success: [
                        {
                            name: 'default',
                            input: [{ channel: quickMock(channel, { mention: '<#channelId>' }), events: ['event 1', 'event 2', 'event 3'] }],
                            expected: '✅ I will now log the following events in <#channelId>:\nevent 1\nevent 2\nevent 3'
                        }
                    ]
                },
                disable: {
                    description: {
                        default: [
                            {
                                name: 'default',
                                input: [{
                                    events: [
                                        { key: 'event 1', desc: util.literal('event 1 description') },
                                        { key: 'event 2', desc: util.literal('event 2 description') },
                                        { key: 'event 3', desc: util.literal('event 3 description') }
                                    ]
                                }],
                                expected: 'Disables logging of the given events. Available events are:\n`event 1` - event 1 description\n`event 2` - event 2 description\n`event 3` - event 3 description'
                            }
                        ],
                        all: 'Disables logging of all events except role related events.',
                        role: 'Stops logging when someone gets or loses a role.'
                    },
                    success: [
                        {
                            name: 'default',
                            input: [{ events: ['event 1', 'event 2', 'event 3'] }],
                            expected: '✅ I will no longer log the following events:\nevent 1\nevent 2\nevent 3'
                        }
                    ]
                },
                ignore: {
                    description: 'Ignores any tracked events concerning the users',
                    success: [
                        {
                            name: 'default',
                            input: [{ senderIds: ['senderId1', 'senderId2', 'senderId3'] }],
                            expected: '✅ I will now ignore events from <@senderId1>, <@senderId2> and <@senderId3>'
                        }
                    ]
                },
                track: {
                    description: 'Removes the users from the list of ignored users and begins tracking events from them again',
                    success: [
                        {
                            name: 'default',
                            input: [{ senderIds: ['senderId1', 'senderId2', 'senderId3'] }],
                            expected: '✅ I will no longer ignore events from <@senderId1>, <@senderId2> and <@senderId3>'
                        }
                    ]
                }
            },
            logs: {
                flags: {
                    type: 'The type(s) of message. Value can be CREATE, UPDATE, and/or DELETE, separated by commas.',
                    channel: 'The channel to retrieve logs from. Value can be a channel ID or a channel mention.',
                    user: 'The user(s) to retrieve logs from. Value can be a username, nickname, mention, or ID. This uses the user lookup system.',
                    create: 'Get message creates.',
                    update: 'Get message updates.',
                    delete: 'Get message deletes.',
                    json: 'Returns the logs in a json file rather than on a webpage.'
                },
                default: {
                    description: 'Creates a chatlog page for a specified channel, where `number` is the amount of lines to get. You can retrieve a maximum of 1000 logs. For more specific logs, you can specify flags.\nFor example, if you wanted to get 100 messages `stupid cat` deleted, you would do this:\n`logs 100 --type delete --user stupid cat`\nIf you want to use multiple of the same type, separate parameters with commas or chain them together. For example:\n`logs 100 -CU -u stupid cat, dumb cat`',
                    chatlogsDisabled: [
                        {
                            name: 'default',
                            input: [{ prefix: '~' }],
                            expected: '❌ This guild has not opted into chatlogs. Please do `~settings set makelogs true` to allow me to start creating chatlogs.'
                        }
                    ],
                    tooManyLogs: '❌ You cant get more than 1000 logs at a time',
                    notEnoughLogs: '❌ A minimum of 1 chatlog entry must be requested',
                    channelMissing: [
                        {
                            name: 'default',
                            input: [{ channel: 'not a channel' }],
                            expected: '❌ I couldn\'t find the channel `not a channel`'
                        }
                    ],
                    notOnGuild: '❌ The channel must be on this guild!',
                    noPermissions: '❌ You do not have permissions to look at that channels message history!',
                    userMissing: [
                        {
                            name: 'default',
                            input: [{ user: 'not a user' }],
                            expected: '❌ I couldn\'t find the user `not a user`'
                        }
                    ],
                    generating: 'ℹ️ Generating your logs...',
                    sendFailed: '❌ I wasn\'t able to send the message containing the logs!',
                    pleaseWait: 'ℹ️ Generating your logs...\nThis seems to be taking longer than usual. I\'ll ping you when I\'m finished.',
                    generated: {
                        link: {
                            quick: [
                                {
                                    name: 'default',
                                    input: [{ link: 'https://blargbot.xyz/logs/32934268429364' }],
                                    expected: '✅ Your logs are available here: https://blargbot.xyz/logs/32934268429364'
                                }
                            ],
                            slow: [
                                {
                                    name: 'default',
                                    input: [{ user: quickMock(user, { mention: '<@userId>' }), link: 'https://blargbot.xyz/logs/2309482084223432' }],
                                    expected: '✅ Sorry that took so long, <@userId>.\nYour logs are available here: https://blargbot.xyz/logs/2309482084223432'
                                }
                            ]
                        },
                        json: {
                            quick: '✅ Here are your logs, in a JSON file!',
                            slow: [
                                {
                                    name: 'default',
                                    input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                    expected: '✅ Sorry that took so long, <@userId>.\nHere are your logs, in a JSON file!'
                                }
                            ]
                        }
                    }
                }
            },
            massBan: {
                flags: {
                    reason: 'The reason for the ban.'
                },
                default: {
                    description: 'Bans a user who isn\'t currently on your guild, where `<userIds...>` is a list of user IDs or mentions (separated by spaces) and `days` is the number of days to delete messages for.\nIf mod-logging is enabled, the ban will be logged.',
                    state: {
                        alreadyBanned: '❌ All those users are already banned!',
                        memberTooHigh: '❌ I don\'t have permission to ban any of those users! Their highest roles are above my highest role.',
                        moderatorTooLow: '❌ You don\'t have permission to ban any of those users! Their highest roles are above your highest role.',
                        noPerms: '❌ I don\'t have permission to ban anyone! Make sure I have the `ban members` permission and try again.',
                        moderatorNoPerms: '❌ You don\'t have permission to ban anyone! Make sure you have the `ban members` permission or one of the permissions specified in the `ban override` setting and try again.',
                        noUsers: '❌ None of the user ids you gave were valid users!'
                    },
                    success: [
                        {
                            name: 'default',
                            input: [{
                                users: [
                                    quickMock(user, { mention: '<@user1Id>' }),
                                    quickMock(user, { mention: '<@user2Id>' }),
                                    quickMock(user, { mention: '<@user3Id>' })
                                ]
                            }],
                            expected: '✅ The following user(s) have been banned:\n<@user1Id>\n<@user2Id>\n<@user3Id>'
                        }
                    ]
                }
            },
            modLog: {
                setChannel: {
                    description: 'Sets the channel to use as the modlog channel',
                    notOnGuild: '❌ The modlog channel must be on this server!',
                    notTextChannel: '❌ The modlog channel must be a text channel!',
                    success: [
                        {
                            name: 'default',
                            input: [{ channel: quickMock(channel, { mention: '<#channelId>' }) }],
                            expected: '✅ Modlog entries will now be sent in <#channelId>'
                        }
                    ]
                },
                disable: {
                    description: 'Disables the modlog',
                    success: '✅ The modlog is disabled'
                },
                clear: {
                    description: 'Deletes specific modlog entries. If you don\'t provide any, all the entries will be removed',
                    notFound: '❌ No modlogs were found!',
                    channelMissing: [
                        {
                            name: 'default',
                            input: [{ modlogs: [123, 456, 789] }],
                            expected: '⛔ I couldn\'t find the modlog channel for cases `123`, `456` and `789`'
                        }
                    ],
                    messageMissing: [
                        {
                            name: 'default',
                            input: [{ modlogs: [123, 456, 789] }],
                            expected: '⛔ I couldn\'t find the modlog message for cases `123`, `456` and `789`'
                        }
                    ],
                    permissionMissing: [
                        {
                            name: 'default',
                            input: [{ modlogs: [123, 456, 789] }],
                            expected: '⛔ I didn\'t have permission to delete the modlog for cases `123`, `456` and `789`'
                        }
                    ],
                    success: [
                        {
                            name: 'single',
                            input: [{ count: 1, errors: [util.literal('error 1'), util.literal('error 2'), util.literal('error 3')] }],
                            expected: '✅ I successfully deleted 1 modlog from my database.\nerror 1\nerror 2\nerror 3'
                        },
                        {
                            name: 'multiple',
                            input: [{ count: 123, errors: [util.literal('error 1'), util.literal('error 2'), util.literal('error 3')] }],
                            expected: '✅ I successfully deleted 123 modlogs from my database.\nerror 1\nerror 2\nerror 3'
                        },
                        {
                            name: 'errorless',
                            input: [{ count: 123, errors: [] }],
                            expected: '✅ I successfully deleted 123 modlogs from my database.'
                        }
                    ]
                }
            },
            mute: {
                flags: {
                    reason: 'The reason for the (un)mute.',
                    time: 'The amount of time to mute for, formatted as \'1 day 2 hours 3 minutes and 4 seconds\', \'1d2h3m4s\', or some other combination.'
                },
                default: {
                    description: 'Gives the user a special muted role. On first run, this role will be created. The bot needs to be able to `manage roles` to create and assign the role, and `manage channels` to configure the role. You are able to manually configure the role without the bot, but the bot has to make it. Deleting the muted role causes it to be regenerated.\nIf the bot has permissions for it, this command will also voice-mute the user.\nIf mod-logging is enabled, the mute will be logged.\nYou can also specify a length of time the user should be muted for, using formats such as `1 hour 2 minutes` or `1h2m`.',
                    createPermsMissing: '❌ I don\'t have enough permissions to create a `muted` role! Make sure I have the `manage roles` permission and try again.',
                    configurePermsMissing: '❌ I created a `muted` role, but don\'t have permissions to configure it! Either configure it yourself, or make sure I have the `manage channel` permission, delete the `muted` role, and try again.',
                    state: {
                        alreadyMuted: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '❌ <@userId> is already muted'
                            }
                        ],
                        noPerms: '❌ I don\'t have permission to mute users! Make sure I have the `manage roles` permission and try again.',
                        moderatorNoPerms: '❌ You don\'t have permission to mute users! Make sure you have the `manage roles` permission and try again.',
                        roleMissing: '❌ The muted role has been deleted! Please re-run this command to create a new one.',
                        roleTooHigh: '❌ I can\'t assign the muted role! (it\'s higher than or equal to my top role)',
                        moderatorTooLow: '❌ You can\'t assign the muted role! (it\'s higher than or equal to your top role)'

                    },
                    success: {
                        default: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '✅ **<@userId>** has been muted'
                            }
                        ],
                        durationInvalid: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '⚠️ **<@userId>** has been muted, but the duration was either 0 seconds or improperly formatted so they won\'t automatically be unmuted.'
                            }
                        ],
                        temporary: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }), unmute: moment.duration(1234567) }],
                                expected: () => `✅ **<@userId>** has been muted and will be unmuted **<t:${moment().add(1234567).unix()}:R>**`
                            }
                        ]
                    }
                },
                clear: {
                    description: 'Removes the special muted role from the user. \nIf mod-logging is enabled, the mute will be logged.',
                    state: {
                        notMuted: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '❌ <@userId> is not currently muted'
                            }
                        ],
                        noPerms: '❌ I don\'t have permission to unmute users! Make sure I have the `manage roles` permission and try again.',
                        moderatorNoPerms: '❌ You don\'t have permission to unmute users! Make sure you have the `manage roles` permission and try again.',
                        roleTooHigh: '❌ I can\'t revoke the muted role! (it\'s higher than or equal to my top role)',
                        moderatorTooLow: '❌ You can\'t revoke the muted role! (it\'s higher than or equal to your top role)',
                        success: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '✅ **<@userId>** has been unmuted'
                            }
                        ]
                    }
                }
            },
            pardon: {
                flags: {
                    reason: 'The reason for the pardon.',
                    count: 'The number of warnings that will be removed.'
                },
                default: {
                    description: 'Pardons a user.\nIf mod-logging is enabled, the pardon will be logged.\nThis will not unban users.',
                    state: {
                        countNaN: [
                            {
                                name: 'default',
                                input: [{ text: 'definitely not a number' }],
                                expected: '❌ definitely not a number isn\'t a number!'
                            }
                        ],
                        countNegative: '❌ I cant give a negative amount of pardons!',
                        countZero: '❌ I cant give zero pardons!',
                        success: [
                            {
                                name: 'single',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }), count: 1, warnings: 1 }],
                                expected: '✅ **<@userId>** has been given a warning. They now have 1 warning.'
                            },
                            {
                                name: 'multiple',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }), count: 123, warnings: 456 }],
                                expected: '✅ **<@userId>** has been given 123 warnings. They now have 456 warnings.'
                            }
                        ]
                    }
                }
            },
            prefix: {
                list: {
                    description: 'Lists all the current prefixes on this server',
                    success: [
                        {
                            name: 'none',
                            input: [{ guild: quickMock(guild, { name: 'guildName' }), prefixes: [] }],
                            expected: 'ℹ️ guildName has no custom prefixes'
                        },
                        {
                            name: 'some',
                            input: [{ guild: quickMock(guild, { name: 'guildName' }), prefixes: ['~', 'b!', '@'] }],
                            expected: 'ℹ️ guildName has the following prefixes:\n - ~\n - b!\n - @'
                        }
                    ]
                },
                add: {
                    description: 'Adds a command prefix to this server',
                    success: '✅ The prefix has been added!'
                },
                remove: {
                    description: 'Removes a command prefix from this server',
                    success: '✅ The prefix has been removed!'
                }
            },
            reason: {
                default: {
                    description: 'Sets the reason for an action on the modlog.',
                    none: '❌ There aren\'t any modlog entries yet!',
                    unknownCase: [
                        {
                            name: 'default',
                            input: [{ caseId: 123 }],
                            expected: '❌ I couldn\'t find a modlog entry with a case id of 123'
                        }
                    ],
                    success: {
                        messageMissing: '⚠️ The modlog has been updated! I couldn\'t find the message to update however.',
                        default: '✅ The modlog has been updated!'
                    }
                }
            },
            roleMe: {
                errors: {
                    missing: [
                        {
                            name: 'default',
                            input: [{ id: 123 }],
                            expected: '❌ Roleme 123 doesn\'t exist'
                        }
                    ],
                    noMessage: [
                        {
                            name: 'default',
                            input: [{ id: 123 }],
                            expected: '❌ Roleme 123 doesn\'t have a custom message'
                        }
                    ],
                    missingChannels: '❌ I couldn\'t locate any of the channels you provided',
                    missingRoles: '❌ I couldn\'t locate any of the roles you provided',
                    noRoles: '❌ You must provide at least 1 role to add or remove',
                    noTrigger: '❌ You must provide a trigger phrase for the roleme'
                },
                common: {
                    triggerQuery: '❓ What should users type for this roleme to trigger?',
                    caseSensitiveQuery: {
                        prompt: '❓ Is the trigger case sensitive?',
                        continue: 'Yes',
                        cancel: 'No'
                    },
                    channelsQuery: {
                        prompt: '❓ Please mention all the channels you want the roleme to be available in',
                        cancel: 'All channels'
                    },
                    rolesQuery: {
                        prompt: {
                            add: '❓ Please type the roles you want the roleme to add, 1 per line. Mentions, ids or names can be used.',
                            remove: '❓ Please type the roles you want the roleme to remove, 1 per line. Mentions, ids or names can be used.'
                        },
                        fail: '❌ I couldn\'t find any of the roles from your message, please try again.',
                        cancel: 'No roles'
                    }
                },
                flags: {
                    add: 'A list of roles to add in the roleme',
                    remove: 'A list of roles to remove in the roleme',
                    case: 'Whether the phrase is case sensitive',
                    channels: 'The channels the roleme should be in'
                },
                add: {
                    description: 'Adds a new roleme with the given phrase',
                    unexpectedError: '❌ Something went wrong while I was trying to create that roleme',
                    success: [
                        {
                            name: 'default',
                            input: [{ id: 123 }],
                            expected: '✅ Roleme `123` has been created!'
                        }
                    ]
                },
                remove: {
                    description: 'Deletes the given roleme',
                    success: [
                        {
                            name: 'default',
                            input: [{ id: 123 }],
                            expected: '✅ Roleme `123` has been deleted'
                        }
                    ]
                },
                edit: {
                    description: 'Edits the given roleme',
                    unexpectedError: '❌ Something went wrong while I was trying to edit that roleme',
                    success: [
                        {
                            name: 'default',
                            input: [{ id: 123 }],
                            expected: '✅ Roleme `123` has been updated!'
                        }
                    ]
                },
                setMessage: {
                    description: 'Sets the bbtag compatible message to show when the roleme is triggered',
                    success: [
                        {
                            name: 'default',
                            input: [{ id: 123 }],
                            expected: '✅ Roleme `123` has now had its message set'
                        }
                    ]
                },
                rawMessage: {
                    description: 'Gets the current message that will be sent when the roleme is triggered',
                    inline: [
                        {
                            name: 'default',
                            input: [{ id: 123, content: 'my roleme content' }],
                            expected: 'ℹ️ The raw code for roleme `123` is: ```\nmy roleme content\n```'
                        }
                    ],
                    attached: [
                        {
                            name: 'default',
                            input: [{ id: 123 }],
                            expected: 'ℹ️ The raw code for roleme `123` is attached'
                        }
                    ]
                },
                debugMessage: {
                    description: 'Executes the roleme message as if you triggered the roleme',
                    success: 'ℹ️ Ive sent the debug output in a DM'
                },
                setAuthorizer: {
                    description: 'Sets the roleme message to run using your permissions',
                    success: [
                        {
                            name: 'default',
                            input: [{ id: 123 }],
                            expected: '✅ Your permissions will now be used for roleme `123`'
                        }
                    ]
                },
                info: {
                    description: 'Shows information about a roleme',
                    embed: {
                        title: [
                            {
                                name: 'default',
                                input: [{ id: 123 }],
                                expected: 'Roleme #123'
                            }
                        ],
                        field: {
                            phrase: {
                                name: [
                                    {
                                        name: 'case sensitive',
                                        input: [{ caseSensitive: true }],
                                        expected: 'Phrase (case sensitive)'
                                    },
                                    {
                                        name: 'case insensitive',
                                        input: [{ caseSensitive: false }],
                                        expected: 'Phrase (case insensitive)'
                                    }
                                ]
                            },
                            rolesAdded: {
                                name: 'Roles added',
                                value: [
                                    {
                                        name: 'none',
                                        input: [{ roleIds: [] }],
                                        expected: 'None'
                                    },
                                    {
                                        name: 'some',
                                        input: [{ roleIds: ['roleId1', 'roleId2', 'roleId3'] }],
                                        expected: '<@&roleId1>\n<@&roleId2>\n<@&roleId3>'
                                    }
                                ]
                            },
                            rolesRemoved: {
                                name: 'Roles removed',
                                value: [
                                    {
                                        name: 'none',
                                        input: [{ roleIds: [] }],
                                        expected: 'None'
                                    },
                                    {
                                        name: 'some',
                                        input: [{ roleIds: ['roleId1', 'roleId2', 'roleId3'] }],
                                        expected: '<@&roleId1>\n<@&roleId2>\n<@&roleId3>'
                                    }
                                ]
                            },
                            channels: {
                                name: 'Channels',
                                value: [
                                    {
                                        name: 'anywhere',
                                        input: [{ channelIds: [] }],
                                        expected: 'Anywhere'
                                    },
                                    {
                                        name: 'specific',
                                        input: [{ channelIds: ['channelId1', 'channelId2', 'channelId3'] }],
                                        expected: '<#channelId1>\n<#channelId2>\n<#channelId3>'
                                    }
                                ]
                            },
                            message: {
                                name: 'Message',
                                value: [
                                    {
                                        name: 'default',
                                        input: [{ authorId: 'authorId', authorizerId: 'authorizerId' }],
                                        expected: '**Author:** <@authorId>\n**Authorizer:** <@authorizerId>'
                                    }
                                ]
                            }
                        }
                    }
                },
                list: {
                    description: 'Lists the rolemes currently active on this server',
                    none: '❌ You have no rolemes created!',
                    embed: {
                        title: 'Rolemes',
                        description: {
                            channel: [
                                {
                                    name: 'anywhere',
                                    input: [{}],
                                    expected: 'All channels'
                                },
                                {
                                    name: 'specific',
                                    input: [{ channelId: 'channelId' }],
                                    expected: '<#channelId>'
                                }
                            ],
                            roleme: [
                                {
                                    name: 'default',
                                    input: [{ id: 123, message: 'my role phrase' }],
                                    expected: '**Roleme** `123`: my role phrase'
                                }
                            ],
                            layout: [
                                {
                                    name: 'default',
                                    input: [{
                                        groups: [
                                            { name: util.literal('group 1'), entries: [util.literal('group 1 entry 1'), util.literal('group 1 entry 2'), util.literal('group 1 entry 3')] },
                                            { name: util.literal('group 2'), entries: [util.literal('group 2 entry 1'), util.literal('group 2 entry 2'), util.literal('group 2 entry 3')] },
                                            { name: util.literal('group 3'), entries: [util.literal('group 3 entry 1'), util.literal('group 3 entry 2'), util.literal('group 3 entry 3')] }
                                        ]
                                    }],
                                    expected: 'group 1\ngroup 1 entry 1\ngroup 1 entry 2\ngroup 1 entry 3\n\ngroup 2\ngroup 2 entry 1\ngroup 2 entry 2\ngroup 2 entry 3\n\ngroup 3\ngroup 3 entry 1\ngroup 3 entry 2\ngroup 3 entry 3'
                                }
                            ]
                        }
                    }
                }
            },
            removeVoteBan: {
                user: {
                    description: 'Deletes all the vote bans against the given user',
                    success: [
                        {
                            name: 'default',
                            input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                            expected: '✅ Votebans for <@userId> have been cleared'
                        }
                    ]
                },
                all: {
                    description: 'Deletes all vote bans against all users',
                    success: '✅ Votebans for all users have been cleared'
                }
            },
            settings: {
                description: [
                    {
                        name: 'default',
                        input: [{ website: 'https://blargbot.xyz/settings' }],
                        expected: 'Gets or sets the settings for the current guild. Visit https://blargbot.xyz/settings for key documentation.'
                    }
                ],
                types: {
                    string: 'string',
                    channel: 'channel',
                    bool: 'bool',
                    role: 'role',
                    int: 'int',
                    float: 'float',
                    permission: 'permission',
                    locale: 'language'
                },
                list: {
                    description: 'Gets the current settings for this guild',
                    notConfigured: '❌ Your guild is not correctly configured yet! Please try again later',
                    channelValue: {
                        default: [
                            {
                                name: 'default',
                                input: [{ channel: quickMock(guildChannel, { name: 'channelName', id: 'channelId' }) }],
                                expected: 'channelName (channelId)'
                            }
                        ],
                        unknown: [
                            {
                                name: 'default',
                                input: [{ channelId: 'channelId' }],
                                expected: 'Unknown channel (channelId)'
                            }
                        ],
                        none: 'Default Channel'
                    },
                    roleValue: {
                        default: [
                            {
                                name: 'default',
                                input: [{ role: quickMock(role, { name: 'roleName', id: 'roleId' }) }],
                                expected: 'roleName (roleId)'
                            }
                        ],
                        unknown: [
                            {
                                name: 'default',
                                input: [{ roleId: 'roleId' }],
                                expected: 'Unknown role (roleId)'
                            }
                        ]
                    },
                    localeValue: [
                        {
                            name: 'partial',
                            input: [{ name: 'English (UK)', completion: 0.8765543 }],
                            expected: 'English (UK) - 87.66% complete'
                        },
                        {
                            name: 'complete',
                            input: [{ name: 'English (UK)', completion: 1 }],
                            expected: 'English (UK)'
                        }
                    ],
                    notSet: 'Not set',
                    groups: {
                        general: 'General',
                        messages: 'Messages',
                        channels: 'Channels',
                        permission: 'Permission',
                        warnings: 'Warnings',
                        moderation: 'Moderation'
                    }
                },
                keys: {
                    description: 'Lists all the setting keys and their types',
                    success: [
                        {
                            name: 'default',
                            input: [{
                                settings: [
                                    { name: util.literal('setting 1'), key: 'setting1', type: util.literal('type 1') },
                                    { name: util.literal('setting 2'), key: 'setting2', type: util.literal('type 2') },
                                    { name: util.literal('setting 3'), key: 'setting3', type: util.literal('type 3') }
                                ]
                            }],
                            expected: 'ℹ️ You can use `settings set <key> [value]` to set the following settings. All settings are case insensitive.\n - **setting 1:** `SETTING1` (type 1)\n - **setting 2:** `SETTING2` (type 2)\n - **setting 3:** `SETTING3` (type 3)'
                        }
                    ]
                },
                languages: {
                    description: 'Lists all the languages supported and their completion',
                    success: [
                        {
                            name: 'none',
                            input: [{
                                locales: []
                            }],
                            expected: '✅ The following locales are supported:\n- None yet 😦\n\nTo set a language, use `b!settings set language <languageId>`\n> If you want to help contribute a new langauge, or improve an existing one, you can contribute here: <https://translate.blargbot.xyz/>'
                        },
                        {
                            name: 'some',
                            input: [{
                                locales: [
                                    { name: 'English (UK)', key: 'en-GB', completion: 1 },
                                    { name: 'French (France)', key: 'fr', completion: 0 },
                                    { name: 'Spanish (Spain)', key: 'es-SP', completion: 0.5 }
                                ]
                            }],
                            expected: '✅ The following locales are supported:\n`en-GB`: English (UK) - 100% complete\n`fr`: French (France) - 0% complete\n`es-SP`: Spanish (Spain) - 50% complete\n\nTo set a language, use `b!settings set language <languageId>`\n> If you want to help contribute a new langauge, or improve an existing one, you can contribute here: <https://translate.blargbot.xyz/>'
                        }
                    ]
                },
                set: {
                    description: 'Sets the given setting key to have a certain value. If `value` is omitted, the setting is reverted to its default value',
                    keyInvalid: '❌ Invalid key!',
                    valueInvalid: [
                        {
                            name: 'default',
                            input: [{ value: 'invalid value', type: util.literal('type 1') }],
                            expected: '❌ `invalid value` is not a type 1'
                        }
                    ],
                    alreadySet: [
                        {
                            name: 'default',
                            input: [{ value: 'current value', key: 'setting1' }],
                            expected: '❌ `current value` is already set for setting1'
                        }
                    ],
                    success: [
                        {
                            name: 'nothing',
                            input: [{ key: 'setting1' }],
                            expected: '✅ setting1 is set to nothing'
                        },
                        {
                            name: 'something',
                            input: [{ key: 'setting1', value: 'some value' }],
                            expected: '✅ setting1 is set to some value'
                        }
                    ]
                }
            },
            slowMode: {
                errors: {
                    notTextChannel: '❌ You can only set slowmode on text channels!',
                    notInGuild: '❌ You cant set slowmode on channels outside of a server',
                    botNoPerms: [
                        {
                            name: 'default',
                            input: [{ channel: quickMock(channel, { mention: '<#channelId>' }) }],
                            expected: '❌ I don\'t have permission to set slowmode in <#channelId>!'
                        }
                    ]
                },
                on: {
                    description: 'Sets the channel\'s slowmode to 1 message every `time` seconds, with a max of 6 hours',
                    timeTooLong: [
                        {
                            name: 'default',
                            input: [{ duration: moment.duration(123000) }],
                            expected: '❌ `time` must be less than 123s'
                        }
                    ],
                    success: [
                        {
                            name: 'default',
                            input: [{ duration: moment.duration(123000), channel: quickMock(channel, { mention: '<#channelId>' }) }],
                            expected: '✅ Slowmode has been set to 1 message every 123s in <#channelId>'
                        }
                    ]
                },
                off: {
                    description: 'Turns off the channel\'s slowmode',
                    success: [
                        {
                            name: 'default',
                            input: [{ channel: quickMock(channel, { mention: '<#channelId>' }) }],
                            expected: '✅ Slowmode has been disabled in <#channelId>'
                        }
                    ]
                }
            },
            tidy: {
                flags: {
                    bots: 'Remove messages from bots.',
                    invites: 'Remove messages containing invites.',
                    links: 'Remove messages containing links.',
                    embeds: 'Remove messages containing embeds.',
                    attachments: 'Remove messages containing attachments.',
                    user: 'Removes messages from the users specified. Separate users by commas',
                    query: 'Removes messages that match the provided query as a regex.',
                    invert: 'Reverses the effects of all the flag filters.',
                    yes: 'Bypasses the confirmation'
                },
                default: {
                    description: 'Clears messages from chat',
                    notNegative: [
                        {
                            name: 'default',
                            input: [{ count: 123 }],
                            expected: '❌ I cannot delete 123 messages!'
                        }
                    ],
                    unsafeRegex: '❌ That regex is not safe!',
                    invalidUsers: '❌ I couldn\'t find some of the users you gave!',
                    noMessages: '❌ I couldn\'t find any matching messages!',
                    confirmQuery: {
                        prompt: {
                            foundAll: [
                                {
                                    name: 'single',
                                    input: [{
                                        total: 1,
                                        breakdown: [
                                            { user: quickMock(user, { mention: '<@user1Id>' }), count: 1 },
                                            { user: quickMock(user, { mention: '<@user2Id>' }), count: 234 },
                                            { user: quickMock(user, { mention: '<@user3Id>' }), count: 567 }
                                        ]
                                    }],
                                    expected: 'ℹ️ I am about to attempt to delete 1 message. Are you sure you wish to continue?\n<@user1Id> - 1 message\n<@user2Id> - 234 messages\n<@user3Id> - 567 messages'
                                },
                                {
                                    name: 'multiple',
                                    input: [{
                                        total: 123,
                                        breakdown: [
                                            { user: quickMock(user, { mention: '<@user1Id>' }), count: 1 },
                                            { user: quickMock(user, { mention: '<@user2Id>' }), count: 234 },
                                            { user: quickMock(user, { mention: '<@user3Id>' }), count: 567 }
                                        ]
                                    }],
                                    expected: 'ℹ️ I am about to attempt to delete 123 messages. Are you sure you wish to continue?\n<@user1Id> - 1 message\n<@user2Id> - 234 messages\n<@user3Id> - 567 messages'
                                }
                            ],
                            foundSome: [
                                {
                                    name: 'single',
                                    input: [{
                                        total: 1,
                                        searched: 1,
                                        breakdown: [
                                            { user: quickMock(user, { mention: '<@user1Id>' }), count: 1 },
                                            { user: quickMock(user, { mention: '<@user2Id>' }), count: 234 },
                                            { user: quickMock(user, { mention: '<@user3Id>' }), count: 567 }
                                        ]
                                    }],
                                    expected: 'ℹ️ I am about to attempt to delete 1 message after searching through 1 message. Are you sure you wish to continue?\n<@user1Id> - 1 message\n<@user2Id> - 234 messages\n<@user3Id> - 567 messages'
                                },
                                {
                                    name: 'multiple',
                                    input: [{
                                        total: 123,
                                        searched: 456,
                                        breakdown: [
                                            { user: quickMock(user, { mention: '<@user1Id>' }), count: 1 },
                                            { user: quickMock(user, { mention: '<@user2Id>' }), count: 234 },
                                            { user: quickMock(user, { mention: '<@user3Id>' }), count: 567 }
                                        ]
                                    }],
                                    expected: 'ℹ️ I am about to attempt to delete 123 messages after searching through 456 messages. Are you sure you wish to continue?\n<@user1Id> - 1 message\n<@user2Id> - 234 messages\n<@user3Id> - 567 messages'
                                }
                            ]
                        },
                        cancel: 'Cancel',
                        continue: 'Continue'
                    },
                    cancelled: '✅ Tidy cancelled, No messages will be deleted',
                    deleteFailed: '❌ I wasn\'t able to delete any of the messages! Please make sure I have permission to manage messages',
                    success: {
                        default: [
                            {
                                name: 'single',
                                input: [{
                                    deleted: 1,
                                    success: [
                                        { user: quickMock(user, { mention: '<@user1Id>' }), count: 1 },
                                        { user: quickMock(user, { mention: '<@user2Id>' }), count: 234 },
                                        { user: quickMock(user, { mention: '<@user3Id>' }), count: 567 }
                                    ]
                                }],
                                expected: '✅ Deleted 1 message:\n<@user1Id> - 1 message\n<@user2Id> - 234 messages\n<@user3Id> - 567 messages'
                            },
                            {
                                name: 'multiple',
                                input: [{
                                    deleted: 123,
                                    success: [
                                        { user: quickMock(user, { mention: '<@user1Id>' }), count: 1 },
                                        { user: quickMock(user, { mention: '<@user2Id>' }), count: 234 },
                                        { user: quickMock(user, { mention: '<@user3Id>' }), count: 567 }
                                    ]
                                }],
                                expected: '✅ Deleted 123 messages:\n<@user1Id> - 1 message\n<@user2Id> - 234 messages\n<@user3Id> - 567 messages'
                            }
                        ],
                        partial: [
                            {
                                name: 'default',
                                input: [{
                                    deleted: 123,
                                    success: [
                                        { user: quickMock(user, { mention: '<@user1Id>' }), count: 1 },
                                        { user: quickMock(user, { mention: '<@user2Id>' }), count: 23 },
                                        { user: quickMock(user, { mention: '<@user3Id>' }), count: 45 }
                                    ],
                                    failed: [
                                        { user: quickMock(user, { mention: '<@user4Id>' }), count: 67 },
                                        { user: quickMock(user, { mention: '<@user5Id>' }), count: 89 },
                                        { user: quickMock(user, { mention: '<@user6Id>' }), count: 101 }
                                    ]
                                }],
                                expected: '⚠️ I managed to delete 123 of the messages I attempted to delete.\n<@user1Id> - 1 message\n<@user2Id> - 23 messages\n<@user3Id> - 45 messages\n\nFailed:\n<@user4Id> - 67 messages\n<@user5Id> - 89 messages\n<@user6Id> - 101 messages'
                            }
                        ]
                    }
                }
            },
            timeout: {
                flags: {
                    reason: 'The reason for the timeout (removal).',
                    time: 'The amount of time to mute for, formatted as \'1 day 2 hours 3 minutes and 4 seconds\', \'1d2h3m4s\', or some other combination.\nMaximum allowed time is 28 days. Default is 1 day.'
                },
                user: {
                    description: 'Timeouts a user.\nIf mod-logging is enabled, the timeout will be logged.',
                    state: {
                        memberTooHigh: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '❌ I don\'t have permission to timeout **<@userId>**! Their highest role is above my highest role.'
                            }
                        ],
                        moderatorTooLow: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '❌ You don\'t have permission to timeout **<@userId>**! Their highest role is above your highest role.'
                            }
                        ],
                        noPerms: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '❌ I don\'t have permission to timeout **<@userId>**! Make sure I have the `moderate members` permission and try again.'
                            }
                        ],
                        moderatorNoPerms: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '❌ You don\'t have permission to timeout **<@userId>**! Make sure you have the `moderate members` permission or one of the permissions specified in the `timeout override` setting and try again.'
                            }
                        ],
                        alreadyTimedOut: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '❌ **<@userId>** has already been timed out.'
                            }
                        ],
                        success: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '✅ **<@userId>** has been timed out.'
                            }
                        ]
                    }
                },
                clear: {
                    description: 'Removes the timeout of a user.\nIf mod-logging is enabled, the timeout removal will be logged.',
                    state: {
                        notTimedOut: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '❌ **<@userId>** is not currently timed out.'
                            }
                        ],
                        noPerms: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '❌ I don\'t have permission to timeout **<@userId>**! Make sure I have the `moderate members` permission and try again.'
                            }
                        ],
                        moderatorNoPerms: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '❌ You don\'t have permission to timeout **<@userId>**! Make sure you have the `moderate members` permission or one of the permissions specified in the `timeout override` setting and try again.'
                            }
                        ],
                        success: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '✅ **<@userId>** timeout has been removed.'
                            }
                        ]
                    }
                }
            },
            timers: {
                list: {
                    description: 'Lists all the currently active timers here',
                    none: '✅ There are no active timers!',
                    paged: [
                        {
                            name: 'default',
                            input: [{ start: 12, end: 34, total: 56, page: 78, pageCount: 90 }],
                            expected: 'Showing timers 12 - 34 of 56. Page 78/90'
                        }
                    ],
                    success: [
                        {
                            name: 'with paging',
                            input: [{ table: util.literal('some cool table'), paging: util.literal('page 1/2') }],
                            expected: 'ℹ️ Here are the currently active timers:```prolog\nsome cool table\n```page 1/2'
                        },
                        {
                            name: 'without paging',
                            input: [{ table: util.literal('some cool table') }],
                            expected: 'ℹ️ Here are the currently active timers:```prolog\nsome cool table\n```'
                        }
                    ],
                    table: {
                        id: {
                            header: 'Id',
                            cell: [
                                {
                                    name: 'default',
                                    input: [{ id: 'timer1' }],
                                    expected: 'timer1'
                                }
                            ]
                        },
                        elapsed: {
                            header: 'Elapsed',
                            cell: [
                                {
                                    name: 'default',
                                    input: [{ startTime: moment().add(3, 'h') }],
                                    expected: '3 hours'
                                }
                            ]
                        },
                        remain: {
                            header: 'Remain',
                            cell: [
                                {
                                    name: 'default',
                                    input: [{ endTime: moment().add(2, 'd') }],
                                    expected: '2 days'
                                }
                            ]
                        },
                        user: {
                            header: 'User',
                            cell: [
                                {
                                    name: 'with user',
                                    input: [{ user: quickMock(user, { username: 'userUsername', discriminator: 'userDiscriminator' }) }],
                                    expected: 'userUsername#userDiscriminator'
                                },
                                {
                                    name: 'without user',
                                    input: [{}],
                                    expected: ''
                                }
                            ]
                        },
                        type: {
                            header: 'Type',
                            cell: [
                                {
                                    name: 'default',
                                    input: [{ type: 'timer type' }],
                                    expected: 'timer type'
                                }
                            ]
                        },
                        content: {
                            header: 'Content',
                            cell: [
                                {
                                    name: 'default',
                                    input: [{ content: 'my timer content' }],
                                    expected: 'my timer content'
                                }
                            ]
                        }
                    }
                },
                info: {
                    description: 'Shows detailed information about a given timer',
                    notFound: '❌ I couldn\'t find the timer you gave.',
                    embed: {
                        title: [
                            {
                                name: 'default',
                                input: [{ id: 'timer1' }],
                                expected: 'Timer #timer1'
                            }
                        ],
                        field: {
                            type: {
                                name: 'Type'
                            },
                            user: {
                                name: 'Started by',
                                value: [
                                    {
                                        name: 'default',
                                        input: [{ userId: 'userId' }],
                                        expected: '<@userId>'
                                    }
                                ]
                            },
                            duration: {
                                name: 'Duration',
                                value: [
                                    {
                                        name: 'default',
                                        input: [{ start: moment(123456789), end: moment(987654321) }],
                                        expected: 'Started <t:123456:f>\nEnds <t:987654:f>'
                                    }
                                ]
                            }
                        }
                    }
                },
                cancel: {
                    description: 'Cancels currently active timers',
                    timersMissing: [
                        {
                            name: 'single',
                            input: [{ count: 1 }],
                            expected: '❌ I couldn\'t find the timer you specified!'
                        },
                        {
                            name: 'multiple',
                            input: [{ count: 123 }],
                            expected: '❌ I couldn\'t find any of the timers you specified!'
                        }
                    ],
                    success: {
                        default: [
                            {
                                name: 'single',
                                input: [{ success: ['timer1'] }],
                                expected: '✅ Cancelled 1 timer:\n`timer1`'
                            },
                            {
                                name: 'multiple',
                                input: [{ success: ['timer1', 'timer2', 'timer3'] }],
                                expected: '✅ Cancelled 3 timers:\n`timer1`\n`timer2`\n`timer3`'
                            }
                        ],
                        partial: [
                            {
                                name: 'single',
                                input: [{ success: ['timer1'], fail: ['timer2'] }],
                                expected: '⚠️ Cancelled 1 timer:\n`timer1`\nCould not find 1 timer:\n`timer2`'
                            },
                            {
                                name: 'multiple',
                                input: [{ success: ['timer1', 'timer2', 'timer3'], fail: ['timer4', 'timer5', 'timer6'] }],
                                expected: '⚠️ Cancelled 3 timers:\n`timer1`\n`timer2`\n`timer3`\nCould not find 3 timers:\n`timer4`\n`timer5`\n`timer6`'
                            }
                        ]
                    }
                },
                clear: {
                    description: 'Clears all currently active timers',
                    confirm: {
                        prompt: '⚠️ Are you sure you want to clear all timers?',
                        continue: 'Yes',
                        cancel: 'No'
                    },
                    cancelled: 'ℹ️ Cancelled clearing of timers',
                    success: '✅ All timers cleared'
                }
            },
            unban: {
                flags: {
                    reason: 'The reason for the ban.'
                },
                default: {
                    description: 'Unbans a user.\nIf mod-logging is enabled, the ban will be logged.',
                    userNotFound: '❌ I couldn\'t find that user!',
                    state: {
                        notBanned: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '❌ **<@userId>** is not currently banned!'
                            }
                        ],
                        noPerms: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '❌ I don\'t have permission to unban **<@userId>**! Make sure I have the `ban members` permission and try again.'
                            }
                        ],
                        moderatorNoPerms: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '❌ You don\'t have permission to unban **<@userId>**! Make sure you have the `ban members` permission or one of the permissions specified in the `ban override` setting and try again.'
                            }
                        ],
                        success: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '✅ **<@userId>** has been unbanned.'
                            }
                        ]
                    }
                }
            },
            unmute: {
                flags: {
                    reason: 'The reason for the unmute.'
                },
                default: {
                    description: 'Removes the special muted role from the user. \nIf mod-logging is enabled, the mute will be logged.',
                    state: {
                        notMuted: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '❌ <@userId> is not currently muted'
                            }
                        ],
                        noPerms: '❌ I don\'t have permission to unmute users! Make sure I have the `manage roles` permission and try again.',
                        moderatorNoPerms: '❌ You don\'t have permission to unmute users! Make sure you have the `manage roles` permission and try again.',
                        roleTooHigh: '❌ I can\'t revoke the muted role! (it\'s higher than or equal to my top role)',
                        moderatorTooLow: '❌ You can\'t revoke the muted role! (it\'s higher than or equal to your top role)',
                        success: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: '✅ **<@userId>** has been unmuted'
                            }
                        ]
                    }
                }
            },
            warn: {
                actions: {
                    ban: 'ban',
                    kick: 'kick',
                    timeout: 'timeout',
                    delete: 'warn'
                },
                flags: {
                    reason: 'The reason for the warning.',
                    count: 'The number of warnings that will be issued.'
                },
                default: {
                    description: 'Issues a warning.\nIf mod-logging is enabled, the warning will be logged.\nIf `kickat` and `banat` have been set using the `settings` command, the target could potentially get banned or kicked.',
                    state: {
                        countNaN: [
                            {
                                name: 'default',
                                input: [{ value: 'definitely not a number' }],
                                expected: '❌ definitely not a number isn\'t a number!'
                            }
                        ],
                        countNegative: '❌ I cant give a negative amount of warnings!',
                        countZero: '❌ I cant give zero warnings!',
                        memberTooHigh: [
                            {
                                name: 'single',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }), count: 1, action: util.literal('smile') }],
                                expected: '⚠️ **<@userId>** has been given 1 warning.\n⛔ They went over the limit for smiles but they are above me so I couldn\'t smile them.'
                            },
                            {
                                name: 'multiple',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }), count: 123, action: util.literal('smile') }],
                                expected: '⚠️ **<@userId>** has been given 123 warnings.\n⛔ They went over the limit for smiles but they are above me so I couldn\'t smile them.'
                            }
                        ],
                        moderatorTooLow: [
                            {
                                name: 'single',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }), count: 1, action: util.literal('smile') }],
                                expected: '⚠️ **<@userId>** has been given 1 warning.\n⛔ They went over the limit for smiles but they are above you so I didn\'t smile them.'
                            },
                            {
                                name: 'multiple',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }), count: 123, action: util.literal('smile') }],
                                expected: '⚠️ **<@userId>** has been given 123 warnings.\n⛔ They went over the limit for smiles but they are above you so I didn\'t smile them.'
                            }
                        ],
                        noPerms: [
                            {
                                name: 'single',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }), count: 1, action: util.literal('smile') }],
                                expected: '⚠️ **<@userId>** has been given 1 warning.\n⛔ They went over the limit for smiles but I don\'t have permission to smile them.'
                            },
                            {
                                name: 'multiple',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }), count: 123, action: util.literal('smile') }],
                                expected: '⚠️ **<@userId>** has been given 123 warnings.\n⛔ They went over the limit for smiles but I don\'t have permission to smile them.'
                            }
                        ],
                        moderatorNoPerms: [
                            {
                                name: 'single',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }), count: 1, action: util.literal('smile') }],
                                expected: '⚠️ **<@userId>** has been given 1 warning.\n⛔ They went over the limit for smiles but you don\'t have permission to smile them.'
                            },
                            {
                                name: 'multiple',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }), count: 123, action: util.literal('smile') }],
                                expected: '⚠️ **<@userId>** has been given 123 warnings.\n⛔ They went over the limit for smiles but you don\'t have permission to smile them.'
                            }
                        ],
                        alreadyBanned: [
                            {
                                name: 'single',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }), count: 1 }],
                                expected: '⚠️ **<@userId>** has been given 1 warning.\n⛔ They went over the limit for bans, but they were already banned.'
                            },
                            {
                                name: 'multiple',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }), count: 123 }],
                                expected: '⚠️ **<@userId>** has been given 123 warnings.\n⛔ They went over the limit for bans, but they were already banned.'
                            }
                        ],
                        alreadyTimedOut: [
                            {
                                name: 'single',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }), count: 1 }],
                                expected: '⚠️ **<@userId>** has been given 1 warning.\n⛔ They went over the limit for timeouts, but they were already timed out.'
                            },
                            {
                                name: 'multiple',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }), count: 123 }],
                                expected: '⚠️ **<@userId>** has been given 123 warnings.\n⛔ They went over the limit for timeouts, but they were already timed out.'
                            }
                        ],
                        success: {
                            delete: [
                                {
                                    name: 'single',
                                    input: [{ user: quickMock(user, { mention: '<@userId>' }), count: 1, warnings: 1 }],
                                    expected: '✅ **<@userId>** has been given 1 warning. They now have 1 warning.'
                                },
                                {
                                    name: 'multiple',
                                    input: [{ user: quickMock(user, { mention: '<@userId>' }), count: 123, warnings: 123 }],
                                    expected: '✅ **<@userId>** has been given 123 warnings. They now have 123 warnings.'
                                }
                            ],
                            timeout: [
                                {
                                    name: 'single',
                                    input: [{ user: quickMock(user, { mention: '<@userId>' }), count: 1 }],
                                    expected: '✅ **<@userId>** has been given 1 warning. They want over the limit for timeouts and so have been timed out.'
                                },
                                {
                                    name: 'multiple',
                                    input: [{ user: quickMock(user, { mention: '<@userId>' }), count: 123 }],
                                    expected: '✅ **<@userId>** has been given 123 warnings. They want over the limit for timeouts and so have been timed out.'
                                }
                            ],
                            ban: [
                                {
                                    name: 'single',
                                    input: [{ user: quickMock(user, { mention: '<@userId>' }), count: 1 }],
                                    expected: '✅ **<@userId>** has been given 1 warning. They went over the limit for bans and so have been banned.'
                                },
                                {
                                    name: 'multiple',
                                    input: [{ user: quickMock(user, { mention: '<@userId>' }), count: 123 }],
                                    expected: '✅ **<@userId>** has been given 123 warnings. They went over the limit for bans and so have been banned.'
                                }
                            ],
                            kick: [
                                {
                                    name: 'single',
                                    input: [{ user: quickMock(user, { mention: '<@userId>' }), count: 1 }],
                                    expected: '✅ **<@userId>** has been given 1 warning. They went over the limit for kicks and so have been kicked.'
                                },
                                {
                                    name: 'multiple',
                                    input: [{ user: quickMock(user, { mention: '<@userId>' }), count: 123 }],
                                    expected: '✅ **<@userId>** has been given 123 warnings. They went over the limit for kicks and so have been kicked.'
                                }
                            ]
                        }
                    }
                }
            },
            addDomain: {
                default: {
                    description: 'Toggles multiple domains to the domain whitelist for use with the {request} subtag',
                    success: [
                        {
                            name: 'none',
                            input: [{
                                added: [],
                                removed: []
                            }],
                            expected: '✅ Boy howdy, thanks for the domains!\nJust remember: it might take up to 15 minutes for these to go live.'
                        },
                        {
                            name: 'some',
                            input: [{
                                added: ['blargbot.xyz', 'google.com', 'youtube.com'],
                                removed: ['reddit.com', 'twitter.com', 'facebook.com']
                            }],
                            expected: '✅ Boy howdy, thanks for the domains!\nThese ones are great!```\nblargbot.xyz\ngoogle.com\nyoutube.com\n```\nI always hated these ones anyway.```\nreddit.com\ntwitter.com\nfacebook.com\n```\nJust remember: it might take up to 15 minutes for these to go live.'
                        }
                    ]
                }
            },
            patch: {
                flags: {
                    fixes: 'The bug fixes of the patch.',
                    notes: 'Other notes.'
                },
                default: {
                    description: 'Makes a patch note',
                    changelogMissing: '❌ I cant find the changelog channel!',
                    messageEmpty: '❌ I cant send out an empty patch note!',
                    embed: {
                        author: {
                            name: [
                                {
                                    name: 'default',
                                    input: [{ version: 'v1.2.3' }],
                                    expected: 'Version v1.2.3'
                                }
                            ]
                        },
                        title: 'New Features and Changes',
                        field: {
                            bugFixes: {
                                name: 'Bug fixes'
                            },
                            otherNotes: {
                                name: 'Other notes'
                            }
                        }
                    },
                    confirm: {
                        prompt: 'This is a preview of what the patch will look like',
                        continue: 'Looks good, post it!',
                        cancel: 'Nah let me change something'
                    },
                    cancelled: 'ℹ️ Patch cancelled',
                    failed: '❌ I wasn\'t able to send the patch notes!',
                    success: '✅ Done!'
                }
            },
            reload: {
                commands: {
                    description: 'Reloads the given commands, or all commands if none were given',
                    success: [
                        {
                            name: 'single',
                            input: [{ count: 1 }],
                            expected: '✅ Successfully reloaded 1 command'
                        },
                        {
                            name: 'multiple',
                            input: [{ count: 123 }],
                            expected: '✅ Successfully reloaded 123 commands'
                        }
                    ]
                },
                events: {
                    description: 'Reloads the given events, or all events if none were given',
                    success: [
                        {
                            name: 'single',
                            input: [{ count: 1 }],
                            expected: '✅ Successfully reloaded 1 event'
                        },
                        {
                            name: 'multiple',
                            input: [{ count: 123 }],
                            expected: '✅ Successfully reloaded 123 events'
                        }
                    ]
                },
                services: {
                    description: 'Reloads the given services, or all services if none were given',
                    success: [
                        {
                            name: 'single',
                            input: [{ count: 1 }],
                            expected: '✅ Successfully reloaded 1 service'
                        },
                        {
                            name: 'multiple',
                            input: [{ count: 123 }],
                            expected: '✅ Successfully reloaded 123 services'
                        }
                    ]
                }
            },
            restart: {
                description: 'Restarts blargbot, or one of its components',
                default: {
                    description: 'Restarts all the clusters',
                    success: 'Ah! You\'ve killed me but in a way that minimizes downtime! D:'
                },
                kill: {
                    description: 'Kills the master process, ready for pm2 to restart it',
                    success: 'Ah! You\'ve killed me! D:'
                },
                api: {
                    description: 'Restarts the api process',
                    success: '✅ Api has been respawned.'
                }
            },
            update: {
                default: {
                    description: 'Updates the codebase to the latest commit.',
                    noUpdate: '✅ No update required!',
                    command: {
                        pending: [
                            {
                                name: 'default',
                                input: [{ command: 'my cool command' }],
                                expected: 'ℹ️ Command: `my cool command`\nRunning...'
                            }
                        ],
                        success: [
                            {
                                name: 'default',
                                input: [{ command: 'my cool command' }],
                                expected: '✅ Command: `my cool command`'
                            }
                        ],
                        error: [
                            {
                                name: 'default',
                                input: [{ command: 'my cool command' }],
                                expected: '❌ Command: `my cool command`'
                            }
                        ]
                    },
                    packageIssue: '❌ Failed to update due to a package issue',
                    buildIssue: [
                        {
                            name: 'default',
                            input: [{ commit: 'h2gf3dgfgd4g2d3f432gd4' }],
                            expected: '❌ Failed to update due to a build issue, but successfully rolled back to commit `h2gf3dgfgd4g2d3f432gd4`'
                        }
                    ],
                    rollbackIssue: '❌ A fatal error has occurred while rolling back the latest commit! Manual intervention is required ASAP.',
                    success: [
                        {
                            name: 'default',
                            input: [{ version: 'v1.2.3', prefix: '~', commit: '23hjg4jh5jg5j24g43' }],
                            expected: '✅ Updated to version v1.2.3 commit `23hjg4jh5jg5j24g43`!\nRun `~restart` to gracefully start all the clusters on this new version.'
                        }
                    ]
                }
            },
            avatar: {
                common: {
                    formatInvalid: [
                        {
                            name: 'default',
                            input: [{ format: 'AAAAAAAAA', allowedFormats: ['png', 'jpg', 'svg'] }],
                            expected: '❌ AAAAAAAAA is not a valid format! Supported formats are png, jpg and svg'
                        }
                    ],
                    sizeInvalid: [
                        {
                            name: 'default',
                            input: [{ size: 'BBBBBBBB', allowedSizes: [64, 128, 512] }],
                            expected: '❌ BBBBBBBB is not a valid image size! Supported sizes are 64, 128 and 512'
                        }
                    ],
                    success: [
                        {
                            name: 'default',
                            input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                            expected: '✅ <@userId>\'s avatar'
                        }
                    ]
                },
                flags: {
                    format: [
                        {
                            name: 'default',
                            input: [{ formats: ['png', 'jpg', 'svg'] }],
                            expected: 'The file format. Can be png, jpg or svg.'
                        }
                    ],
                    size: [
                        {
                            name: 'default',
                            input: [{ sizes: [64, 128, 512] }],
                            expected: 'The file size. Can be 64, 128 or 512.'
                        }
                    ]
                },
                self: {
                    description: 'Gets your avatar'
                },
                user: {
                    description: 'Gets the avatar of the user you chose'
                }
            },
            beeMovie: {
                flags: {
                    name: 'Shows the name of the character the quote is from, if applicable.',
                    characters: 'Only give quotes from actual characters (no stage directions).'
                },
                default: {
                    description: 'Gives a quote from the Bee Movie.'
                }
            },
            brainfuck: {
                common: {
                    queryInput: {
                        prompt: 'This brainfuck code requires user input. Please say what you want to use:'
                    },
                    noInput: '❌ No input was provided!',
                    unexpectedError: '❌ Something went wrong...',
                    success: {
                        empty: [
                            {
                                name: 'without state',
                                input: [{}],
                                expected: 'ℹ️ No output...'
                            },
                            {
                                name: 'with state',
                                input: [{ state: { memory: [234, 2342, 6656, 213, 776, 4564, 35], pointer: 3 } }],
                                expected: 'ℹ️ No output...\n\n[234,2342,6656,213,776,4564,35]\nPointer: 3'
                            }
                        ],
                        default: [
                            {
                                name: 'without state',
                                input: [{ output: 'brainfuck hard\nalso multiple\nlines' }],
                                expected: '✅ Output:\n> brainfuck hard\n> also multiple\n> lines'
                            },
                            {
                                name: 'with state',
                                input: [{ output: 'brainfuck hard\nalso multiple\nlines', state: { memory: [234, 2342, 6656, 213, 776, 4564, 35], pointer: 3 } }],
                                expected: '✅ Output:\n> brainfuck hard\n> also multiple\n> lines\n\n[234,2342,6656,213,776,4564,35]\nPointer: 3'
                            }
                        ]
                    }
                },
                default: {
                    description: 'Executes brainfuck code.'
                },
                debug: {
                    description: 'Executes brainfuck code and returns the pointers.'
                }
            },
            commit: {
                default: {
                    description: 'Gets a random or specified blargbot commit.',
                    noCommits: '❌ I cant find any commits at the moment, please try again later!',
                    unknownCommit: '❌ I couldn\'t find the commit!',
                    embed: {
                        title: [
                            {
                                name: 'default',
                                input: [{ commit: '1hj2gfj45g4jkk53kl5h7d', index: 123 }],
                                expected: '1hj2gfj45g4jkk53kl5h7d - commit #123'
                            }
                        ]
                    }
                }
            },
            decancer: {
                user: {
                    description: 'Decancers a users display name. If you have permissions, this will also change their nickname',
                    success: [
                        {
                            name: 'default',
                            input: [{ user: quickMock(user, { mention: '<@userId>' }), result: 'im a loser' }],
                            expected: '✅ Successfully decancered **<@userId>**\'s name to: `im a loser`'
                        }
                    ]
                },
                text: {
                    description: 'Decancers some text to plain ASCII',
                    success: [
                        {
                            name: 'default',
                            input: [{ text: 'I have cancer', result: 'I don\'t have cancer' }],
                            expected: '✅ The decancered version of **I have cancer** is: `I don\'t have cancer`'
                        }
                    ]
                }
            },
            define: {
                default: {
                    description: 'Gets the definition for the specified word. The word must be in english.',
                    unavailable: '❌ It seems I cant find the definition for that word at the moment!',
                    embed: {
                        title: [
                            {
                                name: 'default',
                                input: [{ word: 'blargbot' }],
                                expected: 'Definition for blargbot'
                            }
                        ],
                        description: [
                            {
                                name: 'default',
                                input: [{ phonetic: 'some IPA string', pronunciation: 'https://ipa.org/' }],
                                expected: '**Pronunciation**: [🔈 some IPA string](https://ipa.org/)'
                            }
                        ],
                        field: {
                            name: [
                                {
                                    name: 'default',
                                    input: [{ index: 123, type: 'noun' }],
                                    expected: '123. noun'
                                }
                            ],
                            value: {
                                synonyms: [
                                    {
                                        name: 'default',
                                        input: [{ synonyms: ['word1', 'word2', 'word3'] }],
                                        expected: '**Synonyms:** word1, word2 and word3\n'
                                    }
                                ],
                                pronunciation: [
                                    {
                                        name: 'default',
                                        input: [{ phonetic: 'some IPA string', pronunciation: 'https://ipa.org/' }],
                                        expected: '**Pronunciation**: [🔈 some IPA string](https://ipa.org/)\n'
                                    }
                                ],
                                default: [
                                    {
                                        name: 'all parts',
                                        input: [{ pronunciation: util.literal('Woah, that\'s how its pronounced?\n'), synonyms: util.literal('Woah, this word has synonyms!\n'), definition: 'This is a definition I guess' }],
                                        expected: 'Woah, that\'s how its pronounced?\nWoah, this word has synonyms!\nThis is a definition I guess'
                                    },
                                    {
                                        name: 'no synonyms',
                                        input: [{ pronunciation: util.literal('Woah, that\'s how its pronounced?\n'), definition: 'This is a definition I guess' }],
                                        expected: 'Woah, that\'s how its pronounced?\nThis is a definition I guess'
                                    },
                                    {
                                        name: 'no pronunciation',
                                        input: [{ synonyms: util.literal('Woah, this word has synonyms!\n'), definition: 'This is a definition I guess' }],
                                        expected: 'Woah, this word has synonyms!\nThis is a definition I guess'
                                    },
                                    {
                                        name: 'no parts',
                                        input: [{ definition: 'This is a definition I guess' }],
                                        expected: 'This is a definition I guess'
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            dmErrors: {
                default: {
                    description: 'Toggles whether to DM you errors.',
                    enabled: '✅ I will now DM you if I have an issue running a command.',
                    disabled: '✅ I won\'t DM you if I have an issue running a command.'
                }
            },
            donate: {
                default: {
                    description: 'Gets my donation information',
                    success: '✅ Thanks for the interest! Ive sent you a DM with information about donations.',
                    embed: {
                        description: 'Hi! This is stupid cat, creator of blargbot. I hope you\'re enjoying it!\n\nI don\'t like to beg, but right now I\'m a student. Tuition is expensive, and maintaining this project isn\'t exactly free. I have to pay for services such as web servers and domains, not to mention invest time into developing code to make this bot as good as it can be. I don\'t expect to be paid for what I\'m doing; the most important thing to me is that people enjoy what I make, that my product is making people happy. But still, money doesn\'t grow on trees. If you want to support me and what I\'m doing, I have a patreon available for donations. Prefer something with less commitment? I also have a paypal available.\n\nThank you for your time. I really appreciate all of my users! :3',
                        field: {
                            paypal: {
                                name: 'Paypal'
                            },
                            patreon: {
                                name: 'Patreon'
                            }
                        }
                    }
                }
            },
            feedback: {
                errors: {
                    titleTooLong: [
                        {
                            name: 'default',
                            input: [{ max: 123 }],
                            expected: '❌ The first line of your suggestion cannot be more than 123 characters!'
                        }
                    ],
                    noType: '❌ You need to provide at least 1 feedback type.',
                    blacklisted: {
                        guild: [
                            {
                                name: 'default',
                                input: [{ prefix: '~' }],
                                expected: '❌ Sorry, your guild has been blacklisted from the use of the `~feedback` command. If you wish to appeal this, please join my support guild. You can find a link by doing `~invite`.'
                            }
                        ],
                        user: [
                            {
                                name: 'default',
                                input: [{ prefix: '~' }],
                                expected: '❌ Sorry, you have been blacklisted from the use of the `~feedback` command. If you wish to appeal this, please join my support guild. You can find a link by doing `~invite`.'
                            }
                        ]
                    }
                },
                types: {
                    feedback: 'Feedback',
                    bugReport: 'Bug Report',
                    suggestion: 'Suggestion'
                },
                blacklist: {
                    unknownType: [
                        {
                            name: 'default',
                            input: [{ type: 'dog' }],
                            expected: '❌ I don\'t know how to blacklist a dog! only `guild` and `user`'
                        }
                    ],
                    alreadyBlacklisted: {
                        guild: '❌ That guild id is already blacklisted!',
                        user: '❌ That user id is already blacklisted!'
                    },
                    notBlacklisted: {
                        guild: '❌ That guild id is not blacklisted!',
                        user: '❌ That user id is not blacklisted!'
                    },
                    success: {
                        guild: [
                            {
                                name: 'added',
                                input: [{ id: 'guildId', added: true }],
                                expected: '✅ The guild guildId has been blacklisted'
                            },
                            {
                                name: 'removed',
                                input: [{ id: 'guildId', added: false }],
                                expected: '✅ The guild guildId has been removed from the blacklist'
                            }
                        ],
                        user: [
                            {
                                name: 'added',
                                input: [{ id: 'userId', added: true }],
                                expected: '✅ The user userId has been blacklisted'
                            },
                            {
                                name: 'removed',
                                input: [{ id: 'userId', added: false }],
                                expected: '✅ The user userId has been removed from the blacklist'
                            }
                        ]
                    }
                },
                flags: {
                    command: 'Signify your feedback is for a command',
                    bbtag: 'Signify your feedback is for BBTag',
                    docs: 'Signify your feedback is for documentation',
                    other: 'Signify your feedback is for other functionality'
                },
                general: {
                    description: 'Give me general feedback about the bot',
                    unexpectedError: '❌ Something went wrong while trying to submit that! Please try again',
                    success: [
                        {
                            name: 'default',
                            input: [{ type: util.literal('Feedback'), caseId: 123, link: 'https://blargbot.xyz/feedback/123' }],
                            expected: '✅ Feedback has been sent with the ID 123! 👌\n\nYou can view your feedback here: <https://blargbot.xyz/feedback/123>'
                        }
                    ],
                    queryType: {
                        prompt: 'ℹ️ Please select the types that apply to your suggestion',
                        placeholder: 'Select your suggestion type'
                    },
                    types: {
                        command: 'Command',
                        bbtag: 'BBTag',
                        documentation: 'Documentation',
                        other: 'Other Functionality'
                    },
                    dm: 'DM',
                    embed: {
                        description: [
                            {
                                name: 'default',
                                input: [{ title: 'My title', description: 'My description' }],
                                expected: '**My title**\n\nMy description'
                            }
                        ],
                        field: {
                            types: {
                                name: 'Types',
                                value: [
                                    {
                                        name: 'default',
                                        input: [{ types: ['type 1', 'type 2', 'type 3'] }],
                                        expected: 'type 1\ntype 2\ntype 3'
                                    }
                                ]
                            }
                        },
                        footer: {
                            text: [
                                {
                                    name: 'default',
                                    input: [{ caseId: 123, messageId: '23847638726234' }],
                                    expected: 'Case 123 | 23847638726234'
                                }
                            ]
                        }
                    }
                },
                suggest: {
                    description: 'Tell me something you want to be added or changed'
                },
                report: {
                    description: 'Let me know about a bug you found'
                },
                edit: {
                    description: 'Edit some feedback you have previously sent',
                    unknownCase: [
                        {
                            name: 'default',
                            input: [{ caseNumber: 123 }],
                            expected: '❌ I couldn\'t find any feedback with the case number 123!'
                        }
                    ],
                    notOwner: '❌ You cant edit someone else\'s suggestion.',
                    success: '✅ Your case has been updated.'
                }

            },
            help: {
                self: {
                    description: 'Gets the help message for this command'
                },
                list: {
                    description: 'Shows a list of all the available commands'
                },
                command: {
                    description: 'Shows the help text for the given command'
                }
            },
            info: {
                default: {
                    description: 'Returns some info about me.',
                    notReady: '⚠️ Im still waking up! Try again in a minute or two',
                    embed: {
                        title: 'About me!',
                        description: [
                            {
                                name: 'default',
                                input: [{ age: moment.duration(221851992934) }],
                                expected: 'I am a multi-purpose bot with new features implemented regularly, written in typescript using [Eris](https://abal.moe/Eris/).\n\n🎂 I am currently 7 years, 10 days, 17 hours, 33 minutes, 12 seconds and 934 milliseconds old!'
                            }
                        ],
                        field: {
                            patron: {
                                name: '️️️️️️️️❤️ Special thanks to my patrons! ❤️',
                                value: [
                                    {
                                        name: 'default',
                                        input: [{ patrons: [util.literal('person 1'), util.literal('person 2'), util.literal('person 3')] }],
                                        expected: 'person 1\nperson 2\nperson 3'
                                    }
                                ]
                            },
                            donator: {
                                name: '️️️️️️️️❤️ Special thanks to all my other donators! ❤️',
                                value: [
                                    {
                                        name: 'default',
                                        input: [{ donators: [util.literal('person 1'), util.literal('person 2'), util.literal('person 3')] }],
                                        expected: 'person 1\nperson 2\nperson 3'
                                    }
                                ]
                            },
                            other: {
                                name: '❤️ Special huge thanks to: ❤️',
                                value: {
                                    decorators: {
                                        awesome: [
                                            {
                                                name: 'default',
                                                input: [{ user: util.literal('person 1'), reason: util.literal('existing') }],
                                                expected: 'The awesome person 1 for existing'
                                            }
                                        ],
                                        incredible: [
                                            {
                                                name: 'default',
                                                input: [{ user: util.literal('person 1'), reason: util.literal('existing') }],
                                                expected: 'The incredible person 1 for existing'
                                            }
                                        ],
                                        amazing: [
                                            {
                                                name: 'default',
                                                input: [{ user: util.literal('person 1'), reason: util.literal('existing') }],
                                                expected: 'The amazing person 1 for existing'
                                            }
                                        ],
                                        inspirational: [
                                            {
                                                name: 'default',
                                                input: [{ user: util.literal('person 1'), reason: util.literal('existing') }],
                                                expected: 'The inspirational person 1 for existing'
                                            }
                                        ]
                                    },
                                    reasons: {
                                        rewrite: 'rewriting me into typescript',
                                        donations1k: 'huge financial contributions ($1000)',
                                        unknown: 'something but I don\'t remember'
                                    },
                                    layout: [
                                        {
                                            name: 'default',
                                            input: [{ details: [util.literal('line 1'), util.literal('line 2'), util.literal('line 3')] }],
                                            expected: 'line 1\nline 2\nline 3'
                                        }
                                    ]
                                }
                            },
                            details: {
                                value: [
                                    {
                                        name: 'default',
                                        input: [{ prefix: '~' }],
                                        expected: 'For commands, do `~help`. For information about supporting me, do `~donate`.\nFor any additional information, such as command documentation, please visit my website: <https://blargbot.xyz>'
                                    }
                                ]
                            }
                        }
                    }

                }
            },
            insult: {
                someone: {
                    description: 'Generates a random insult directed at the name supplied.',
                    success: [
                        {
                            name: 'default',
                            input: [{ name: 'your mum' }],
                            expected: v => chai.expect(v).to.match(/^your mum's (mother|mom|father|dad|goat|cheese|dick|boob|eye|mouth|nose|ear|sister|sis|brother|bro|seagull|tea|mother-in-law|rabbit|dog|cat|left foot|body|brain|face|favourite thing) (smells like|looks like|is|sounds like|appears to be|wants to be|looks just like|smells oddly similar to|is jealous of|is as stupid as|laughs like) (a piece of cheese|a smelly fish|jam|tea|a skunk|a fart|a piece of toast|my mom|your mom|my dad|your dad|my sister|your sister|my brother|your brother|my cat|my dog|my lizard|my seagull|gross|farts|ugly|Captain America|javascript|C#|LUA|python3.5|a furry|an anthropomorphic horse|a tentacle monster|fuck|meow|mississippi|the entire UK|Japan|anime|dickgirls|a really stupid cat|a sentient robot|teaching a robot to love|anime girls with really large boobs who want to eat all of your cream|salty|smegma|mouldy cheese|obesity|Donald Trump|stupid people|crabcakes|firepoles|blue waffle|a really bad random insult generators|a terrible AI|cleverbot|b1nzy|a drunken goblin|poorly censored porn|an egg left in the sun for too long|#BREXIT|leaving the EU)/)
                        }
                    ]
                },
                default: {
                    description: 'Generates a random insult.',
                    success: v => chai.expect(v).to.match(/^Your (mother|mom|father|dad|goat|cheese|dick|boob|eye|mouth|nose|ear|sister|sis|brother|bro|seagull|tea|mother-in-law|rabbit|dog|cat|left foot|body|brain|face|favourite thing) (smells like|looks like|is|sounds like|appears to be|wants to be|looks just like|smells oddly similar to|is jealous of|is as stupid as|laughs like) (a piece of cheese|a smelly fish|jam|tea|a skunk|a fart|a piece of toast|my mom|your mom|my dad|your dad|my sister|your sister|my brother|your brother|my cat|my dog|my lizard|my seagull|gross|farts|ugly|Captain America|javascript|C#|LUA|python3.5|a furry|an anthropomorphic horse|a tentacle monster|fuck|meow|mississippi|the entire UK|Japan|anime|dickgirls|a really stupid cat|a sentient robot|teaching a robot to love|anime girls with really large boobs who want to eat all of your cream|salty|smegma|mouldy cheese|obesity|Donald Trump|stupid people|crabcakes|firepoles|blue waffle|a really bad random insult generators|a terrible AI|cleverbot|b1nzy|a drunken goblin|poorly censored porn|an egg left in the sun for too long|#BREXIT|leaving the EU)/)
                }
            },
            invite: {
                default: {
                    description: 'Gets you invite information.',
                    success: [
                        {
                            name: 'default',
                            input: [{ inviteLink: 'https://blargbot.xyz/invite', guildLink: 'https://blargbot.xyz/discord-invite' }],
                            expected: 'Invite me to your guild!\n<https://blargbot.xyz/invite>\nJoin my support guild!\nhttps://blargbot.xyz/discord-invite'
                        }
                    ]
                }
            },
            mods: {
                common: {
                    embed: {
                        title: 'Moderators',
                        description: {
                            none: 'There are no mods with that status!'
                        },
                        field: {
                            online: {
                                name: [
                                    {
                                        name: 'default',
                                        input: [{ emote: '✅' }],
                                        expected: '✅ Online'
                                    }
                                ],
                                value: [
                                    {
                                        name: 'default',
                                        input: [{
                                            users: [
                                                quickMock(user, { mention: '<@user1Id>' }),
                                                quickMock(user, { mention: '<@user2Id>' }),
                                                quickMock(user, { mention: '<@user3Id>' })
                                            ]
                                        }],
                                        expected: '<@user1Id>\n<@user2Id>\n<@user3Id>'
                                    }
                                ]
                            },
                            away: {
                                name: [
                                    {
                                        name: 'default',
                                        input: [{ emote: '✅' }],
                                        expected: '✅ Away'
                                    }
                                ],
                                value: [
                                    {
                                        name: 'default',
                                        input: [{
                                            users: [
                                                quickMock(user, { mention: '<@user1Id>' }),
                                                quickMock(user, { mention: '<@user2Id>' }),
                                                quickMock(user, { mention: '<@user3Id>' })
                                            ]
                                        }],
                                        expected: '<@user1Id>\n<@user2Id>\n<@user3Id>'
                                    }
                                ]
                            },
                            busy: {
                                name: [
                                    {
                                        name: 'default',
                                        input: [{ emote: '✅' }],
                                        expected: '✅ Do not disturb'
                                    }
                                ],
                                value: [
                                    {
                                        name: 'default',
                                        input: [{
                                            users: [
                                                quickMock(user, { mention: '<@user1Id>' }),
                                                quickMock(user, { mention: '<@user2Id>' }),
                                                quickMock(user, { mention: '<@user3Id>' })
                                            ]
                                        }],
                                        expected: '<@user1Id>\n<@user2Id>\n<@user3Id>'
                                    }
                                ]
                            },
                            offline: {
                                name: [
                                    {
                                        name: 'default',
                                        input: [{ emote: '✅' }],
                                        expected: '✅ Offline'
                                    }
                                ],
                                value: [
                                    {
                                        name: 'default',
                                        input: [{
                                            users: [
                                                quickMock(user, { mention: '<@user1Id>' }),
                                                quickMock(user, { mention: '<@user2Id>' }),
                                                quickMock(user, { mention: '<@user3Id>' })
                                            ]
                                        }],
                                        expected: '<@user1Id>\n<@user2Id>\n<@user3Id>'
                                    }
                                ]
                            }
                        }
                    }
                },
                all: {
                    description: 'Gets a list of all mods.'
                },
                online: {
                    description: 'Gets a list of all currently online mods.'
                },
                away: {
                    description: 'Gets a list of all currently away mods.'
                },
                busy: {
                    description: 'Gets a list of all mods currently set to do not disturb.'
                },
                offline: {
                    description: 'Gets a list of all currently offline mods.'
                }
            },
            names: {
                flags: {
                    all: 'Gets all the names.',
                    verbose: 'Gets more information about the retrieved names.'
                },
                list: {
                    description: 'Returns the names that I\'ve seen the specified user have in the past 30 days.',
                    none: {
                        ever: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                                expected: 'ℹ️ I haven\'t seen any usernames for <@userId> yet!'
                            }
                        ],
                        since: [
                            {
                                name: 'default',
                                input: [{ user: quickMock(user, { mention: '<@userId>' }), from: moment(1234567890) }],
                                expected: 'ℹ️ I haven\'t seen <@userId> change their username since <t:1234567:f>!'
                            }
                        ]
                    },
                    embed: {
                        title: 'Historical usernames',
                        description: {
                            since: {
                                detailed: [
                                    {
                                        name: 'default',
                                        input: [{
                                            from: moment(1234567890),
                                            usernames: [
                                                { name: 'username 1', time: moment(1234568890) },
                                                { name: 'username 2', time: moment(1234569890) },
                                                { name: 'username 3', time: moment(1234570890) }
                                            ]
                                        }],
                                        expected: 'Since <t:1234567:f>\nusername 1 - <t:1234568:R>\nusername 2 - <t:1234569:R>\nusername 3 - <t:1234570:R>'
                                    }
                                ],
                                simple: [
                                    {
                                        name: 'default',
                                        input: [{
                                            from: moment(1234567890),
                                            usernames: [
                                                { name: 'username 1' },
                                                { name: 'username 2' },
                                                { name: 'username 3' }
                                            ]
                                        }],
                                        expected: 'Since <t:1234567:f>\nusername 1\nusername 2\nusername 3'
                                    }
                                ]
                            },
                            ever: {
                                detailed: [
                                    {
                                        name: 'default',
                                        input: [{
                                            usernames: [
                                                { name: 'username 1', time: moment(1234568890) },
                                                { name: 'username 2', time: moment(1234569890) },
                                                { name: 'username 3', time: moment(1234570890) }
                                            ]
                                        }],
                                        expected: 'username 1 - <t:1234568:R>\nusername 2 - <t:1234569:R>\nusername 3 - <t:1234570:R>'
                                    }
                                ],
                                simple: [
                                    {
                                        name: 'default',
                                        input: [{
                                            usernames: [
                                                { name: 'username 1' },
                                                { name: 'username 2' },
                                                { name: 'username 3' }
                                            ]
                                        }],
                                        expected: 'username 1\nusername 2\nusername 3'
                                    }
                                ]
                            }
                        }
                    }
                },
                remove: {
                    description: 'Removes the names ive seen you use in the past 30 days',
                    none: 'ℹ️ You don\'t have any usernames to remove!',
                    notFound: '❌ I couldn\'t find any of the usernames you gave!',
                    confirm: {
                        prompt: {
                            some: [
                                {
                                    name: 'default',
                                    input: [{ count: 123 }],
                                    expected: '⚠️ Are you sure you want to remove 123 usernames'
                                }
                            ],
                            all: '⚠️ Are you sure you want to remove **all usernames**'
                        },
                        continue: 'Yes',
                        cancel: 'No'
                    },
                    cancelled: '✅ I wont remove any usernames then!',
                    success: {
                        some: [
                            {
                                name: 'default',
                                input: [{ count: 123 }],
                                expected: '✅ Successfully removed 123!'
                            }
                        ],
                        all: '✅ Successfully removed **all usernames**!'
                    }
                }
            },
            nato: {
                default: {
                    description: 'Translates the given text into the NATO phonetic alphabet.'
                }
            },
            personalPrefix: {
                add: {
                    description: 'Adds a command prefix just for you!',
                    alreadyAdded: '❌ You already have that as a command prefix.',
                    success: '✅ Your personal command prefix has been added.'
                },
                remove: {
                    description: 'Removes one of your personal command prefixes',
                    notAdded: '❌ That isn\'t one of your prefixes.',
                    success: '✅ Your personal command prefix has been removed.'
                },
                list: {
                    description: 'Lists the your personal command prefixes',
                    none: 'ℹ️ You don\'t have any personal command prefixes set!',
                    embed: {
                        title: 'Personal prefixes',
                        description: [
                            {
                                name: 'default',
                                input: [{ prefixes: ['~', 'b!', '@'] }],
                                expected: '- ~\n- b!\n- @'
                            }
                        ]
                    }
                }
            },
            ping: {
                description: 'Pong!\nFind the command latency.',
                default: {
                    description: 'Gets the current latency.',
                    pending: v => chai.expect(v).to.be.oneOf([
                        'ℹ️ Existence is a lie.',
                        'ℹ️ You\'re going to die some day, perhaps soon.',
                        'ℹ️ Nothing matters.',
                        'ℹ️ Where do you get off?',
                        'ℹ️ There is nothing out there.',
                        'ℹ️ You are all alone in an infinite void.',
                        'ℹ️ Truth is false.',
                        'ℹ️ Forsake everything.',
                        'ℹ️ Your existence is pitiful.',
                        'ℹ️ We are all already dead.'
                    ]),
                    success: [
                        {
                            name: 'default',
                            input: [{ ping: moment.duration(123456) }],
                            expected: '✅ Pong! (123,456ms)'
                        }
                    ]
                }
            },
            poll: {
                flags: {
                    time: 'How long before the poll expires, formatted as \'1 day 2 hours 3 minutes and 4 seconds\', \'1d2h3m4s\', or some other combination.',
                    emojis: 'The emojis to apply to the poll.',
                    description: 'The description of the poll.',
                    colour: 'The color of the poll (in HEX).',
                    announce: 'If specified, it will make an announcement. Requires the proper permissions.'
                },
                default: {
                    description: 'Creates a poll for the given question and duration. If no duration is given, defaults to 60 seconds. If emojis are given, they will be used as options for the poll.',
                    invalidDuration: [
                        {
                            name: 'default',
                            input: [{ duration: 'not a duration' }],
                            expected: '❌ `not a duration` is not a valid duration for a poll.'
                        }
                    ],
                    invalidColor: [
                        {
                            name: 'default',
                            input: [{ color: 'not a colour' }],
                            expected: '❌ `not a colour` is not a valid color!'
                        }
                    ],
                    sendFailed: '❌ I wasn\'t able to send the poll! Please make sure I have the right permissions and try again.',
                    noAnnouncePerms: '❌ Sorry, you don\'t have permissions to send announcements!',
                    announceNotSetUp: '❌ Announcements on this server aren\'t set up correctly. Please fix them before trying again.',
                    emojisMissing: '❌ You must provide some emojis to use in the poll.',
                    emojisInaccessible: '❌ I don\'t have access to some of the emojis you used! Please use different emojis or add me to the server that the emojis are from.',
                    tooShort: [
                        {
                            name: 'default',
                            input: [{ duration: moment.duration(123000) }],
                            expected: '❌ 123s is too short for a poll! Use a longer time'
                        }
                    ],
                    someEmojisMissing: '⚠️ I managed to create the poll, but wasn\'t able to add some of the emojis to it. Please add them manually (they will still be counted in the results)'
                }
            },
            remind: {
                flags: {
                    channel: 'Sets the reminder to appear in the current channel rather than a DM',
                    time: 'The time before the user is to be reminded, formatted as \'1 day 2 hours 3 minutes and 4 seconds\', \'1d 2h 3m 4s\', or some other combination'
                },
                default: {
                    description: 'Reminds you about something after a period of time in a DM.',
                    durationRequired: '❌ The `-t` flag is required to set the duration of the reminder!',
                    durationZero: '❌ I cant set a timer for 0 seconds!',
                    reminderMissing: '❌ You need to say what you need reminding of!',
                    event: [
                        {
                            name: 'default',
                            input: [{ userId: 'userId', start: moment(1234568890), content: 'don\'t forget to check your reminders' }],
                            expected: '⏰ Hi, <@userId>! You asked me to remind you about this <t:1234568:R>:\ndon\'t forget to check your reminders'
                        }
                    ],
                    success: {
                        here: [
                            {
                                name: 'default',
                                input: [{ duration: moment.duration(1234567) }],
                                expected: () => `✅ Ok, ill ping you here <t:${moment().add(1234567).unix()}:R>`
                            }
                        ],
                        dm: [
                            {
                                name: 'default',
                                input: [{ duration: moment.duration(1234567) }],
                                expected: () => `✅ Ok, ill ping you in a DM <t:${moment().add(1234567).unix()}:R>`
                            }
                        ]
                    }
                }
            },
            roles: {
                default: {
                    description: 'Displays a list of roles and their IDs.',
                    embed: {
                        title: 'Roles',
                        description: [
                            {
                                name: 'default',
                                input: [{
                                    roles: [
                                        quickMock(role, { mention: '<@&role1Id>', id: 'roleId1' }),
                                        quickMock(role, { mention: '<@&role2Id>', id: 'roleId2' }),
                                        quickMock(role, { mention: '<@&role3Id>', id: 'roleId3' })
                                    ]
                                }],
                                expected: '<@&role1Id> - (roleId1)\n<@&role2Id> - (roleId2)\n<@&role3Id> - (roleId3)'
                            }
                        ]
                    }
                }
            },
            roll: {
                default: {
                    description: 'Rolls the dice you tell it to, and adds the modifier',
                    diceInvalid: [
                        {
                            name: 'default',
                            input: [{ dice: 'not a dice' }],
                            expected: '❌ `not a dice` is not a valid dice!'
                        }
                    ],
                    tooBig: [
                        {
                            name: 'default',
                            input: [{ maxRolls: 123, maxFaces: 456 }],
                            expected: '❌ You\'re limited to 123 rolls of a d456'
                        }
                    ],
                    character: {
                        embed: {
                            description: [
                                {
                                    name: 'default',
                                    input: [{
                                        stats: [
                                            { id: 1, rolls: [1, 2, 3], total: 6, min: 1, result: 5 },
                                            { id: 2, rolls: [4, 5, 6], total: 15, min: 4, result: 11 },
                                            { id: 3, rolls: [7, 8, 9], total: 24, min: 7, result: 17 }
                                        ]
                                    }],
                                    expected: '```xl\nStat #1 - [1, 2, 3] > 6 - 1 > 5\nStat #2 - [4, 5, 6] > 15 - 4 > 11\nStat #3 - [7, 8, 9] > 24 - 7 > 17\n```'
                                }
                            ]
                        }
                    },
                    embed: {
                        title: [
                            {
                                name: 'single',
                                input: [{ rolls: 1, faces: 456 }],
                                expected: '🎲 1 roll of a 456 sided dice:'
                            },
                            {
                                name: 'multiple',
                                input: [{ rolls: 123, faces: 456 }],
                                expected: '🎲 123 rolls of a 456 sided dice:'
                            }
                        ],
                        description: {
                            modifier: [
                                {
                                    name: 'add',
                                    input: [{ total: 123, sign: '+', modifier: 456 }],
                                    expected: '**Modifier**: 123 + 456'
                                },
                                {
                                    name: 'sub',
                                    input: [{ total: 123, sign: '-', modifier: 456 }],
                                    expected: '**Modifier**: 123 - 456'
                                }
                            ],
                            natural1: ' - Natural 1...',
                            natural20: ' - Natural 20',
                            layout: [
                                {
                                    name: 'all',
                                    input: [{
                                        details: 'these are some details',
                                        rolls: [1, 2, 3, 4],
                                        modifier: util.literal('this is a modifier'),
                                        total: 123,
                                        natural: util.literal(' - Natural aaaaaaa')
                                    }],
                                    expected: 'these are some details\n1, 2, 3, 4\nthis is a modifier\n**Total**: 123 - Natural aaaaaaa'
                                },
                                {
                                    name: 'none',
                                    input: [{
                                        rolls: [1, 2, 3, 4],
                                        total: 123
                                    }],
                                    expected: '1, 2, 3, 4\n**Total**: 123'
                                }
                            ]
                        }
                    }
                }

            },
            rr: {
                default: {
                    description: 'Plays russian roulette with a specified number of bullets. If `emote` is specified, uses that specific emote.',
                    notEnoughBullets: '❌ Wimp! You need to load at least one bullet.',
                    guaranteedDeath: '⚠️ Do you have a death wish or something? Your revolver can only hold 6 bullets, that\'s guaranteed death!',
                    tooManyBullets: '⚠️ That\'s gutsy, but your revolver can only hold 6 bullets!',
                    jammed: '❌ Your revolver jams when you try to close the barrel. Maybe you should try somewhere else...',
                    confirm: {
                        prompt: [
                            {
                                name: 'single',
                                input: [{ bullets: 1 }],
                                expected: 'You load 1 bullet into your revolver, give it a spin, and place it against your head'
                            },
                            {
                                name: 'default',
                                input: [{ bullets: 123 }],
                                expected: 'You load 123 bullets into your revolver, give it a spin, and place it against your head'
                            }
                        ],
                        continue: 'Put the gun down',
                        cancel: 'Pull the trigger'
                    },
                    chicken: v => chai.expect(v).to.match(/^You chicken out and put the gun down.\n(Maybe try again when you're not feeling so wimpy\.|Its ok, fun isn't for everyone!)$/),
                    died: v => chai.expect(v).to.match(/^\*\*\*BOOM!\*\*\* (The gun goes off, splattering your brains across the wall\. Unlucky!|☠️💥⚰️😵💀💀☠️|Before you know it, it's all over\.|At least you had chicken!|I'm \*\*\*not\*\*\* cleaning that up\.|Guns are not toys!|Well, you can't win them all!|W-well\.\.\. If every porkchop were perfect, we wouldn't have hotdogs\? Too bad you're dead either way\.|Blame it on the lag!|Today just wasn't your lucky day\.|Pssh, foresight is for losers\.)$/),
                    lived: v => chai.expect(v).to.match(/^\*Click!\* (The gun clicks, empty\. You get to live another day\.|You breath a sign of relief as you realize that you aren't going to die today\.|As if it would ever go off! Luck is on your side\.|You thank RNGesus as you lower the gun.|👼🙏🚫⚰️👌👍👼|You smirk as you realize you survived\.)$/)
                }
            },
            shard: {
                common: {
                    embed: {
                        title: [
                            {
                                name: 'default',
                                input: [{ shardId: 123 }],
                                expected: 'Shard 123'
                            }
                        ],
                        field: {
                            shard: {
                                name: [
                                    {
                                        name: 'default',
                                        input: [{ shardId: 123 }],
                                        expected: 'Shard 123'
                                    }
                                ],
                                value: [
                                    {
                                        name: 'default',
                                        input: [{ statusEmote: '💀', latency: 123, guildCount: 456, clusterId: 789, lastUpdate: moment(1234568890) }],
                                        expected: '```\nStatus: 💀\nLatency: 123ms\nGuilds: 456\nCluster: 789\nLast update: 6:56 AM\n```'
                                    }
                                ]
                            },
                            cluster: {
                                name: [
                                    {
                                        name: 'default',
                                        input: [{ clusterId: 123 }],
                                        expected: 'Cluster 123'
                                    }
                                ],
                                value: [
                                    {
                                        name: 'default',
                                        input: [{ cpu: 0.2345, guildCount: 123, ram: 123456789, startTime: moment(1234568890) }],
                                        expected: 'CPU usage: 23.5%\nGuilds: 123\nRam used: 117.74 MB\nStarted <t:1234568:R>'
                                    }
                                ]
                            },
                            shards: {
                                name: 'Shards',
                                value: [
                                    {
                                        name: 'default',
                                        input: [{
                                            shards: [
                                                { id: 1, statusEmote: '💀', latency: 123 },
                                                { id: 2, statusEmote: '😵', latency: 456 },
                                                { id: 3, statusEmote: '☠️', latency: 789 }
                                            ]
                                        }],
                                        expected: '```\n1 💀 123ms\n2 😵 456ms\n3 ☠️ 789ms\n```'
                                    }
                                ]
                            }
                        }
                    }
                },
                current: {
                    description: 'Returns information about the shard the current guild is in, along with cluster stats.',
                    dm: {
                        embed: {
                            description: [
                                {
                                    name: 'default',
                                    input: [{ clusterId: 123 }],
                                    expected: 'Discord DMs are on shard `0` in cluster `123`'
                                }
                            ]
                        }
                    }
                },
                guild: {
                    description: 'Returns information about the shard `guildID` is in, along with cluster stats.',
                    invalidGuild: [
                        {
                            name: 'default',
                            input: [{ id: 'aaaaaaaaa' }],
                            expected: '❌ `aaaaaaaaa` is not a valid guild id'
                        }
                    ],
                    embed: {
                        description: {
                            here: [
                                {
                                    name: 'default',
                                    input: [{ shardId: 123, clusterId: 456 }],
                                    expected: 'This guild is on shard `123` and cluster `456`'
                                }
                            ],
                            other: [
                                {
                                    name: 'default',
                                    input: [{ shardId: 123, clusterId: 546, guildId: '3278654287546' }],
                                    expected: 'Guild `3278654287546` is on shard `123` and cluster `546`'
                                }
                            ]
                        }
                    }
                }
            },
            shards: {
                common: {
                    invalidCluster: '❌ Cluster does not exist',
                    noStats: [
                        {
                            name: 'default',
                            input: [{ clusterId: 123 }],
                            expected: '❌ Cluster 123 is not online at the moment'
                        }
                    ],
                    embed: {
                        field: {
                            shard: {
                                name: [
                                    {
                                        name: 'default',
                                        input: [{ shardId: 213 }],
                                        expected: 'Shard 213'
                                    }
                                ],
                                value: [
                                    {
                                        name: 'default',
                                        input: [{ statusEmote: '💀', latency: 123, guildCount: 456, clusterId: 789, lastUpdate: moment(1234568890) }],
                                        expected: '```\nStatus: 💀\nLatency: 123ms\nGuilds: 456\nCluster: 789\nLast update: 6:56 AM\n```'
                                    }
                                ]
                            },
                            cluster: {
                                name: [
                                    {
                                        name: 'default',
                                        input: [{ clusterId: 123 }],
                                        expected: 'Cluster 123'
                                    }
                                ],
                                value: [
                                    {
                                        name: 'default',
                                        input: [{ cpu: 0.2345, guildCount: 123, ram: 123456789, startTime: moment(1234568890) }],
                                        expected: 'CPU usage: 23.5%\nGuilds: 123\nRam used: 117.74 MB\nStarted <t:1234568:R>'
                                    }
                                ]
                            },
                            shards: {
                                name: 'Shards',
                                value: [
                                    {
                                        name: 'default',
                                        input: [{
                                            shards: [
                                                { id: 1, statusEmote: '💀', latency: 123 },
                                                { id: 2, statusEmote: '😵', latency: 456 },
                                                { id: 3, statusEmote: '☠️', latency: 789 }
                                            ]
                                        }],
                                        expected: '```\n1 💀 123ms\n2 😵 456ms\n3 ☠️ 789ms\n```'
                                    }
                                ]
                            }
                        }
                    }
                },
                flags: {
                    down: 'If provided, only shows downed shards for `b!shards`'
                },
                all: {
                    description: 'Shows a list of all shards.',
                    noneDown: 'ℹ️ No shards are currently down!',
                    noStats: '❌ No cluster stats yet!',
                    embed: {
                        title: 'Shards',
                        description: [
                            {
                                name: 'single',
                                input: [{ clusterCount: 1, shardCount: 1 }],
                                expected: 'I\'m running on `1` cluster and `1` shard\n'
                            },
                            {
                                name: 'multiple',
                                input: [{ clusterCount: 123, shardCount: 456 }],
                                expected: 'I\'m running on `123` clusters and `456` shards\n'
                            }
                        ],
                        field: {
                            name: [
                                {
                                    name: 'default',
                                    input: [{ clusterId: 123 }],
                                    expected: 'Cluster 123'
                                }
                            ],
                            value: [
                                {
                                    name: 'default',
                                    input: [{
                                        ram: 123456789,
                                        startTime: moment(1234568890),
                                        shards: [
                                            { id: 1, statusEmote: '💀', latency: 123 },
                                            { id: 2, statusEmote: '😵', latency: 456 },
                                            { id: 3, statusEmote: '☠️', latency: 789 }
                                        ]
                                    }],
                                    expected: 'Ready since: <t:1234568:R>\nRam: 117.74 MB\n**Shards**:\n```\n1 💀 123ms\n2 😵 456ms\n3 ☠️ 789ms\n```'
                                }
                            ]
                        }
                    }
                },
                guild: {
                    description: 'Shows information about the shard and cluster `guildID` is in ',
                    invalidGuild: [
                        {
                            name: 'default',
                            input: [{ guildId: 'aaaaaaaaaa' }],
                            expected: '❌ `aaaaaaaaaa` is not a valid guildID'
                        }
                    ],
                    embed: {
                        description: {
                            here: [
                                {
                                    name: 'default',
                                    input: [{ clusterId: 123, shardId: 456 }],
                                    expected: 'This guild is on shard `456` and cluster `123`'
                                }
                            ],
                            other: [
                                {
                                    name: 'default',
                                    input: [{ guildId: '1329462378462397', clusterId: 123, shardId: 456 }],
                                    expected: 'Guild `1329462378462397` is on shard `456` and cluster `123`'
                                }
                            ]
                        }
                    }
                },
                cluster: {
                    description: 'Show information about `cluster`'
                }
            },
            ship: {
                default: {
                    description: 'Gives you the ship name for two users.',
                    success: [
                        {
                            name: 'default',
                            input: [{ name: 'The titanic' }],
                            expected: '❤️ Your ship name is **The titanic**!'
                        }
                    ]
                }
            },
            spell: {
                default: {
                    description: 'Gives you a description for a D&D 5e spell.',
                    notFound: '❌ I couldn\'t find that spell!',
                    components: {
                        v: 'Verbal',
                        s: 'Somatic',
                        m: 'Material',
                        f: 'Focus',
                        df: 'Divine Focus',
                        xp: 'XP Cost'
                    },
                    query: {
                        prompt: '🪄 Multiple spells found! Please pick the right one',
                        placeholder: 'Pick a spell',
                        choice: {
                            description: [
                                {
                                    name: 'default',
                                    input: [{ level: util.literal('1'), school: util.literal('Harvard') }],
                                    expected: 'Level 1 Harvard'
                                }
                            ]
                        }
                    },
                    embed: {
                        description: [
                            {
                                name: 'default',
                                input: [{ level: util.literal('1'), school: util.literal('Harvard'), description: util.literal('Idk I didn\'t go') }],
                                expected: '*Level 1 Harvard*\n\nIdk I didn\'t go'
                            }
                        ],
                        field: {
                            duration: {
                                name: 'Duration'
                            },
                            range: {
                                name: 'Range'
                            },
                            castingTime: {
                                name: 'Casting Time'
                            },
                            components: {
                                name: 'Components'
                            }
                        }
                    }
                }
            },
            stats: {
                default: {
                    description: 'Gives you some information about me',
                    embed: {
                        title: 'Bot Statistics',
                        footer: {
                            text: 'blargbot'
                        },
                        field: {
                            guilds: {
                                name: 'Guilds',
                                value: [
                                    {
                                        name: 'default',
                                        input: [{ guildCount: 123 }],
                                        expected: '123'
                                    }
                                ]
                            },
                            users: {
                                name: 'Users',
                                value: [
                                    {
                                        name: 'default',
                                        input: [{ userCount: 123 }],
                                        expected: '123'
                                    }
                                ]
                            },
                            channels: {
                                name: 'Channels',
                                value: [
                                    {
                                        name: 'default',
                                        input: [{ channelCount: 123 }],
                                        expected: '123'
                                    }
                                ]
                            },
                            shards: {
                                name: 'Shards',
                                value: [
                                    {
                                        name: 'default',
                                        input: [{ shardCount: 123 }],
                                        expected: '123'
                                    }
                                ]
                            },
                            clusters: {
                                name: 'Clusters',
                                value: [
                                    {
                                        name: 'default',
                                        input: [{ clusterCount: 123 }],
                                        expected: '123'
                                    }
                                ]
                            },
                            ram: {
                                name: 'RAM',
                                value: [
                                    {
                                        name: 'default',
                                        input: [{ ram: 123456789 }],
                                        expected: '117.74 MB'
                                    }
                                ]
                            },
                            version: {
                                name: 'Version'
                            },
                            uptime: {
                                name: 'Uptime',
                                value: [
                                    {
                                        name: 'default',
                                        input: [{ startTime: moment(1234568890) }],
                                        expected: '<t:1234568:R>'
                                    }
                                ]
                            },
                            eris: {
                                name: 'Eris'
                            },
                            nodeJS: {
                                name: 'Node.js'
                            }
                        }
                    }
                }
            },
            status: {
                default: {
                    description: 'Gets you an image of an HTTP status code.',
                    notFound: '❌ Something terrible has happened! 404 is not found!'
                }
            },
            syntax: {
                default: {
                    description: 'Gives you the \'syntax\' for a command 😉',
                    success: [
                        {
                            name: 'default',
                            input: [{ prefix: '~', name: 'myCommand', tokens: ['token1', 'token2', 'token3'] }],
                            expected: '❌ Invalid usage!\nProper usage: `~syntax myCommand token1 token2 token3`'
                        }
                    ]
                }
            },
            tag: {
                description: [
                    {
                        name: 'default',
                        input: [{ subtags: 'https://blargbot.xyz/subtags', tos: 'https://blargbot.xyz/tos' }],
                        expected: 'Tags are a system of public commands that anyone can create or run, using the BBTag language.\n\nFor more information about BBTag, visit <https://blargbot.xyz/subtags>.\nBy creating a tag, you acknowledge that you agree to the Terms of Service (<https://blargbot.xyz/tos>)'
                    }
                ],
                request: {
                    name: 'Enter the name of the tag:',
                    content: 'Enter the tag\'s contents:'
                },
                common: {
                    debugInDm: 'ℹ️ Ive sent the debug output in a DM',
                    done: '✅ I hope you found what you were looking for!'
                },
                errors: {
                    noneFound: '❌ No results found!',
                    tagMissing: [
                        {
                            name: 'default',
                            input: [{ name: 'mySubtag' }],
                            expected: '❌ The `mySubtag` tag doesn\'t exist!'
                        }
                    ],
                    invalidBBTag: [
                        {
                            name: 'default',
                            input: [{ errors: [util.literal('error 1'), util.literal('error 2'), util.literal('error 3')] }],
                            expected: '❌ There were errors with the bbtag you provided!\nerror 1\nerror 2\nerror 3'
                        }
                    ],
                    bbtagError: [
                        {
                            name: 'default',
                            input: [{ location: { line: 123, column: 456, index: 789 }, message: util.literal('Ya dummy!') }],
                            expected: '❌ [123,456]: Ya dummy!'
                        }
                    ],
                    bbtagWarning: [
                        {
                            name: 'default',
                            input: [{ location: { line: 123, column: 456, index: 789 }, message: util.literal('Ya dummy!') }],
                            expected: '⚠️ [123,456]: Ya dummy!'
                        }
                    ],
                    notOwner: [
                        {
                            name: 'default',
                            input: [{ name: 'myTag' }],
                            expected: '❌ You don\'t own the `myTag` tag!'
                        }
                    ],
                    alreadyExists: [
                        {
                            name: 'default',
                            input: [{ name: 'myTag' }],
                            expected: '❌ The `myTag` tag already exists!'
                        }
                    ],
                    deleted: [
                        {
                            name: 'with both',
                            input: [{ name: 'myTag', reason: 'My cool reason', user: { username: 'userUsername', discriminator: 'userDiscriminator' } }],
                            expected: '❌ The `myTag` tag has been permanently deleted by **userUsername#userDiscriminator**\n\nReason: My cool reason'
                        },
                        {
                            name: 'without reason',
                            input: [{ name: 'myTag', user: { username: 'userUsername', discriminator: 'userDiscriminator' } }],
                            expected: '❌ The `myTag` tag has been permanently deleted by **userUsername#userDiscriminator**'
                        },
                        {
                            name: 'without user',
                            input: [{ name: 'myTag', reason: 'My cool reason' }],
                            expected: '❌ The `myTag` tag has been permanently deleted\n\nReason: My cool reason'
                        },
                        {
                            name: 'without any',
                            input: [{ name: 'myTag' }],
                            expected: '❌ The `myTag` tag has been permanently deleted'
                        }
                    ]

                },
                run: {
                    description: 'Runs a user created tag with some arguments'
                },
                test: {
                    default: {
                        description: 'Uses the BBTag engine to execute the content as if it was a tag'
                    },
                    debug: {
                        description: 'Uses the BBTag engine to execute the content as if it was a tag and will return the debug output',
                        tagNotOwned: '❌ You cannot debug someone else\'s tag.'
                    }
                },
                docs: {
                    description: 'Returns helpful information about the specified topic.'
                },
                debug: {
                    description: 'Runs a user created tag with some arguments. A debug file will be sent in a DM after the tag has finished.'
                },
                create: {
                    description: 'Creates a new tag with the content you give',
                    success: [
                        {
                            name: 'default',
                            input: [{ name: 'myTag', errors: [util.literal('error 1'), util.literal('error 2'), util.literal('error 3')] }],
                            expected: '✅ Tag `myTag` created.\nerror 1\nerror 2\nerror 3'
                        }
                    ]
                },
                edit: {
                    description: 'Edits an existing tag to have the content you specify',
                    success: [
                        {
                            name: 'default',
                            input: [{ name: 'myTag', errors: [util.literal('error 1'), util.literal('error 2'), util.literal('error 3')] }],
                            expected: '✅ Tag `myTag` edited.\nerror 1\nerror 2\nerror 3'
                        }
                    ]
                },
                set: {
                    description: 'Sets the tag to have the content you specify. If the tag doesn\'t exist it will be created.',
                    success: [
                        {
                            name: 'default',
                            input: [{ name: 'myTag', errors: [util.literal('error 1'), util.literal('error 2'), util.literal('error 3')] }],
                            expected: '✅ Tag `myTag` set.\nerror 1\nerror 2\nerror 3'
                        }
                    ]
                },
                delete: {
                    description: 'Deletes an existing tag',
                    success: [
                        {
                            name: 'default',
                            input: [{ name: 'myTag' }],
                            expected: '✅ The `myTag` tag is gone forever!'
                        }
                    ]
                },
                rename: {
                    description: 'Renames the tag',
                    success: [
                        {
                            name: 'default',
                            input: [{ oldName: 'myOldName', newName: 'myNewName' }],
                            expected: '✅ The `myOldName` tag has been renamed to `myNewName`.'
                        }
                    ]
                },
                raw: {
                    description: 'Gets the raw contents of the tag',
                    inline: [
                        {
                            name: 'default',
                            input: [{ name: 'myTag', content: 'This tag is the best' }],
                            expected: 'ℹ️ The raw code for myTag is: ```\nThis tag is the best\n```'
                        }
                    ],
                    attached: [
                        {
                            name: 'default',
                            input: [{ name: 'myTag' }],
                            expected: 'ℹ️ The raw code for myTag is attached'
                        }
                    ]
                },
                list: {
                    description: 'Lists all tags, or tags made by a specific author',
                    page: {
                        content: [
                            {
                                name: 'default',
                                input: [{ tags: ['tag1', 'tag2', 'tag3'] }],
                                expected: '```fix\ntag1, tag2, tag3\n```'
                            }
                        ],
                        header: {
                            all: [
                                {
                                    name: 'default',
                                    input: [{ count: 123, total: 456 }],
                                    expected: 'Found 123/456 tags'
                                }
                            ],
                            byUser: [
                                {
                                    name: 'default',
                                    input: [{ count: 123, total: 456, user: quickMock(user, { mention: '<@userId>' }) }],
                                    expected: 'Found 123/456 tags made by <@userId>'
                                }
                            ]
                        }
                    }
                },
                search: {
                    description: 'Searches for a tag based on the provided name',
                    query: {
                        prompt: 'What would you like to search for?'
                    },
                    page: {
                        content: [
                            {
                                name: 'default',
                                input: [{ tags: ['tag1', 'tag2', 'tag3'] }],
                                expected: '```fix\ntag1, tag2, tag3\n```'
                            }
                        ],
                        header: [
                            {
                                name: 'default',
                                input: [{ count: 123, total: 456, query: 'not the beeeeeeeees' }],
                                expected: 'Found 123/456 tags matching `not the beeeeeeeees`'
                            }
                        ]
                    }
                },
                permDelete: {
                    description: 'Marks the tag name as deleted forever, so no one can ever use it',
                    notStaff: '❌ You cannot disable tags',
                    success: [
                        {
                            name: 'default',
                            input: [{ name: 'myTag' }],
                            expected: '✅ The `myTag` tag has been deleted'
                        }
                    ],
                    confirm: {
                        prompt: [
                            {
                                name: 'default',
                                input: [{ name: 'myTag' }],
                                expected: 'You are not the owner of the `myTag`, are you sure you want to modify it?'
                            }
                        ],
                        continue: 'Yes',
                        cancel: 'No'
                    }
                },
                cooldown: {
                    description: 'Sets the cooldown of a tag, in milliseconds',
                    cooldownZero: '❌ The cooldown must be greater than 0ms',
                    success: [
                        {
                            name: 'default',
                            input: [{ name: 'myTag', cooldown: moment.duration(123456) }],
                            expected: '✅ The tag `myTag` now has a cooldown of `123,456ms`.'
                        }
                    ]
                },
                author: {
                    description: 'Displays the name of the tag\'s author',
                    success: [
                        {
                            name: 'with author',
                            input: [{ name: 'myTag', author: { username: 'userUsername', discriminator: 'userDiscriminator' } }],
                            expected: '✅ The tag `myTag` was made by **userUsername#userDiscriminator**'
                        },
                        {
                            name: 'without author',
                            input: [{ name: 'myTag' }],
                            expected: '✅ The tag `myTag` was made by **UNKNOWN#????**'
                        }
                    ]
                },
                info: {
                    description: 'Displays information about a tag',
                    embed: {
                        title: [
                            {
                                name: 'default',
                                input: [{ name: 'myTag' }],
                                expected: '__**Tag | myTag**__'
                            }
                        ],
                        footer: {
                            text: [
                                {
                                    name: 'default',
                                    input: [{ user: quickMock(user, { username: 'userUsername', discriminator: 'userDiscriminator' }) }],
                                    expected: 'userUsername#userDiscriminator'
                                }
                            ]
                        },
                        field: {
                            author: {
                                name: 'Author',
                                value: [
                                    {
                                        name: 'default',
                                        input: [{ user: { username: 'userUsername', discriminator: 'userDiscriminator' }, id: '823764872346847234' }],
                                        expected: 'userUsername#userDiscriminator (823764872346847234)'
                                    }
                                ]
                            },
                            cooldown: {
                                name: 'Cooldown',
                                value: [
                                    {
                                        name: 'default',
                                        input: [{ cooldown: moment.duration(1234567) }],
                                        expected: '20 minutes, 34 seconds and 567 milliseconds'
                                    }
                                ]
                            },
                            lastModified: {
                                name: 'Last Modified',
                                value: [
                                    {
                                        name: 'default',
                                        input: [{ lastModified: moment(1234568890) }],
                                        expected: '<t:1234568:f>'
                                    }
                                ]
                            },
                            usage: {
                                name: 'Used',
                                value: [
                                    {
                                        name: 'single',
                                        input: [{ count: 1 }],
                                        expected: '1 time'
                                    },
                                    {
                                        name: 'multiple',
                                        input: [{ count: 123 }],
                                        expected: '123 times'
                                    }
                                ]
                            },
                            favourited: {
                                name: 'Favourited',
                                value: [
                                    {
                                        name: 'single',
                                        input: [{ count: 1 }],
                                        expected: '1 time'
                                    },
                                    {
                                        name: 'multiple',
                                        input: [{ count: 123 }],
                                        expected: '123 times'
                                    }
                                ]
                            },
                            reported: {
                                name: '⚠️ Reported',
                                value: [
                                    {
                                        name: 'single',
                                        input: [{ count: 1 }],
                                        expected: '1 time'
                                    },
                                    {
                                        name: 'multiple',
                                        input: [{ count: 123 }],
                                        expected: '123 times'
                                    }
                                ]
                            },
                            flags: {
                                name: 'Flags',
                                value: [
                                    {
                                        name: 'default',
                                        input: [{
                                            flags: [
                                                { flag: '1', word: 'flag1', description: 'Hmmmmm' },
                                                { flag: '2', word: 'flag2', description: 'AAAAAAA' }
                                            ]
                                        }],
                                        expected: '`-1`/`--flag1`: Hmmmmm\n`-2`/`--flag2`: AAAAAAA'
                                    }
                                ]
                            }
                        }
                    }
                },
                top: {
                    description: 'Displays the top 5 tags',
                    success: [
                        {
                            name: 'default',
                            input: [{
                                tags: [
                                    { index: 1, name: 'tag1', author: { username: 'author1Username', discriminator: 'author1Discriminator' }, count: 1 },
                                    { index: 2, name: 'tag2', author: { username: 'author2Username', discriminator: 'author2Discriminator' }, count: 123 },
                                    { index: 3, name: 'tag3', author: { username: 'author3Username', discriminator: 'author3Discriminator' }, count: 456 }
                                ]
                            }],
                            expected: '__Here are the top 10 tags:__\n**1.** **tag1** (**author1Username#author1Discriminator**) - used **1 time**\n**2.** **tag2** (**author2Username#author2Discriminator**) - used **123 times**\n**3.** **tag3** (**author3Username#author3Discriminator**) - used **456 times**'
                        }
                    ]
                },
                report: {
                    description: 'Reports a tag as violating the ToS',
                    blocked: [
                        {
                            name: 'default',
                            input: [{ reason: 'because I said so' }],
                            expected: '❌ Sorry, you cannot report tags.\nbecause I said so'
                        }
                    ],
                    unavailable: '❌ Sorry, you cannot report tags at this time. Please try again later!',
                    deleted: [
                        {
                            name: 'default',
                            input: [{ name: 'myTag' }],
                            expected: '✅ The `myTag` tag is no longer being reported by you.'
                        }
                    ],
                    added: [
                        {
                            name: 'default',
                            input: [{ name: 'myTag' }],
                            expected: '✅ The `myTag` tag has been reported.'
                        }
                    ],
                    notification: [
                        {
                            name: 'default',
                            input: [{ name: 'myTag', reason: 'Because I said so', user: quickMock(user, { username: 'userUsername', discriminator: 'userDiscriminator' }) }],
                            expected: '**userUsername#userDiscriminator** has reported the tag: myTag\n\nBecause I said so'
                        }
                    ],
                    query: {
                        prompt: 'Please provide a reason for your report:'
                    }
                },
                setLang: {
                    description: 'Sets the language to use when returning the raw text of your tag',
                    success: [
                        {
                            name: 'default',
                            input: [{ name: 'myTag' }],
                            expected: '✅ Lang for tag `myTag` set.'
                        }
                    ]
                },
                favourite: {
                    list: {
                        description: 'Displays a list of the tags you have favourited',
                        success: [
                            {
                                name: 'none',
                                input: [{ tags: [] }],
                                expected: 'You have no favourite tags!'
                            },
                            {
                                name: 'one',
                                input: [{ tags: ['tag1'] }],
                                expected: 'You have 1 favourite tag. ```fix\ntag1\n```'
                            },
                            {
                                name: 'some',
                                input: [{ tags: ['tag1', 'tag2', 'tag3'] }],
                                expected: 'You have 3 favourite tags. ```fix\ntag1, tag2, tag3\n```'
                            }
                        ]
                    },
                    toggle: {
                        description: 'Adds or removes a tag from your list of favourites',
                        added: [
                            {
                                name: 'default',
                                input: [{ name: 'myTag' }],
                                expected: '✅ The `myTag` tag is now on your favourites list!\n\nNote: there is no way for a tag to tell if you\'ve favourited it, and thus it\'s impossible to give rewards for favouriting.\nAny tag that claims otherwise is lying, and should be reported.'
                            }
                        ],
                        removed: [
                            {
                                name: 'default',
                                input: [{ name: 'myTag' }],
                                expected: '✅ The `myTag` tag is no longer on your favourites list!'
                            }
                        ]
                    }
                },
                flag: {
                    updated: [
                        {
                            name: 'default',
                            input: [{ name: 'myTag' }],
                            expected: '✅ The flags for `myTag` have been updated.'
                        }
                    ],
                    list: {
                        description: 'Lists the flags the tag accepts',
                        none: [
                            {
                                name: 'default',
                                input: [{ name: 'myTag' }],
                                expected: '✅ The `myTag` tag has no flags.'
                            }
                        ],
                        success: [
                            {
                                name: 'default',
                                input: [{
                                    name: 'myTag',
                                    flags: [
                                        { flag: '1', word: 'flag1', description: 'Hmmmmm' },
                                        { flag: '2', word: 'flag2', description: 'AAAAAAA' }
                                    ]
                                }],
                                expected: '✅ The `myTag` tag has the following flags:\n\n`-1`/`--flag1`: Hmmmmm\n`-2`/`--flag2`: AAAAAAA'
                            }
                        ]
                    },
                    create: {
                        description: 'Adds multiple flags to your tag. Flags should be of the form `-<f> <flag> [flag description]`\ne.g. `b!t flags add mytag -c category The category you want to use -n name Your name`',
                        wordMissing: [
                            {
                                name: 'default',
                                input: [{ flag: '1' }],
                                expected: '❌ No word was specified for the `1` flag'
                            }
                        ],
                        flagExists: [
                            {
                                name: 'default',
                                input: [{ flag: '1' }],
                                expected: '❌ The flag `1` already exists!'
                            }
                        ],
                        wordExists: [
                            {
                                name: 'default',
                                input: [{ word: 'flag1' }],
                                expected: '❌ A flag with the word `flag1` already exists!'
                            }
                        ]
                    },
                    delete: {
                        description: 'Removes multiple flags from your tag. Flags should be of the form `-<f>`\ne.g. `b!t flags remove mytag -c -n`'
                    }
                }
            },
            time: {
                errors: {
                    timezoneInvalid: [
                        {
                            name: 'default',
                            input: [{ timezone: 'here' }],
                            expected: '❌ `here` is not a valid timezone! See <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones> for timezone codes that I understand.'
                        }
                    ]
                },
                self: {
                    description: 'Gets the time in your timezone'
                },
                user: {
                    description: 'Gets the current time for the user',
                    timezoneNotSet: [
                        {
                            name: 'default',
                            input: [{ user: quickMock(user, { mention: '<@userId>' }), prefix: '~' }],
                            expected: '❌ <@userId> has not set their timezone with the `~timezone` command yet.'
                        }
                    ],
                    timezoneInvalid: [
                        {
                            name: 'default',
                            input: [{ user: quickMock(user, { mention: '<@userId>' }), prefix: '~' }],
                            expected: '❌ <@userId> doesn\'t have a valid timezone set. They need to update it with the `~timezone` command'
                        }
                    ],
                    success: [
                        {
                            name: 'default',
                            input: [{ now: moment(1234568890), user: quickMock(user, { mention: '<@userId>' }) }],
                            expected: 'ℹ️ It is currently **6:56 AM** for **<@userId>**.'
                        }
                    ]
                },
                timezone: {
                    description: 'Gets the current time in the timezone',
                    success: [
                        {
                            name: 'default',
                            input: [{ now: moment(1234568890), timezone: 'UTC' }],
                            expected: 'ℹ️ In **UTC**, it is currently **6:56 AM**'
                        }
                    ]
                },
                convert: {
                    description: 'Converts a `time` from `timezone1` to `timezone2`',
                    invalidTime: [
                        {
                            name: 'default',
                            input: [{ time: 'before the big bang' }],
                            expected: '❌ `before the big bang` is not a valid time! Please use the 12 or 24 hour format, e.g. 1:32pm or 13:32'
                        }
                    ],
                    success: [
                        {
                            name: 'default',
                            input: [{ source: moment(1234568890), dest: moment(1294568890), sourceTimezone: 'right now', destTimezone: 'the future' }],
                            expected: 'ℹ️ When it\'s **6:56 AM** in **right now**, it\'s **11:36 PM** in **the future**.'
                        }
                    ]
                }
            },
            timer: {
                flags: {
                    channel: 'Sets the reminder to appear in the current channel rather than a DM'
                },
                default: {
                    description: 'Sets a timer for the provided duration, formatted as \'1 day 2 hours 3 minutes and 4 seconds\', \'1d2h3m4s\', or some other combination.',
                    durationZero: '❌ I cant set a timer for 0 seconds!',
                    event: [
                        {
                            name: 'default',
                            input: [{ userId: 'userId', start: moment(1234568890) }],
                            expected: '⏰ *Bzzt!* <@userId>, the timer you set <t:1234568:R> has gone off! *Bzzt!* ⏰'
                        }
                    ],
                    success: {
                        here: [
                            {
                                name: 'default',
                                input: [{ duration: moment.duration(1234567) }],
                                expected: () => `✅ Ok, ill ping you here <t:${moment().add(1234567).unix()}:R>`
                            }
                        ],
                        dm: [
                            {
                                name: 'default',
                                input: [{ duration: moment.duration(1234567) }],
                                expected: () => `✅ Ok, ill ping you in a DM <t:${moment().add(1234567).unix()}:R>`
                            }
                        ]
                    }
                }
            },
            timeZone: {
                get: {
                    description: 'Gets your current timezone',
                    notSet: 'ℹ️ You haven\'t set a timezone yet.',
                    timezoneInvalid: [
                        {
                            name: 'default',
                            input: [{ timezone: 'the future' }],
                            expected: '⚠️ Your stored timezone code is `the future`, which isn\'t valid! Please update it when possible.'
                        }
                    ],
                    success: [
                        {
                            name: 'default',
                            input: [{ timezone: 'the future', now: moment().utcOffset('UTC+05:00') }],
                            expected: 'ℹ️ Your stored timezone code is `the future`, which is equivalent to UTC (+05:00).'
                        }
                    ]
                },
                set: {
                    description: 'Sets your current timezone. A list of [allowed time zones can be found on wikipedia](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#List) under the `TZ database name` column',
                    timezoneInvalid: [
                        {
                            name: 'default',
                            input: [{ timezone: 'tomorrow' }],
                            expected: '❌ `tomorrow` is not a valid timezone! See <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones> for timezone codes that I understand.'
                        }
                    ],
                    success: [
                        {
                            name: 'default',
                            input: [{ timezone: 'the future', now: moment().utcOffset('UTC+05:00') }],
                            expected: '✅ Ok, your timezone code is now set to `the future`, which is equivalent to UTC (+05:00).'
                        }
                    ]
                }
            },
            todo: {
                list: {
                    description: 'Shows you your todo list',
                    embed: {
                        title: 'Todo list',
                        description: [
                            {
                                name: 'empty',
                                input: [{ items: [] }],
                                expected: 'You have nothing on your list!'
                            },
                            {
                                name: 'default',
                                input: [{
                                    items: [
                                        { id: 1, value: 'finish these tests' },
                                        { id: 2, value: 'commit my changes' },
                                        { id: 3, value: 'complete the PR' }
                                    ]
                                }],
                                expected: '**1.** finish these tests\n**2.** commit my changes\n**3.** complete the PR'
                            }
                        ]
                    }
                },
                remove: {
                    description: 'Removes an item from your todo list by id',
                    unknownId: [
                        {
                            name: 'default',
                            input: [{ id: 123 }],
                            expected: '❌ Your todo list doesn\'t have an item 123!'
                        }
                    ],
                    success: '✅ Done!'
                },
                add: {
                    description: 'Adds an item to your todo list',
                    success: '✅ Done!'
                }
            },
            tokenify: {
                default: {
                    description: 'Converts the given input into a token.'
                }
            },
            uptime: {
                default: {
                    description: 'Gets how long ive been online for',
                    success: [
                        {
                            name: 'default',
                            input: [{ startTime: moment(1234568890) }],
                            expected: 'ℹ️ I came online <t:1234568:R> at <t:1234568:f>'
                        }
                    ]
                }
            },
            user: {
                default: {
                    description: 'Gets information about a user',
                    activity: {
                        default: 'Not doing anything',
                        5: [
                            {
                                name: 'default',
                                input: [quickMock(activity, { name: 'the nothing olympics' })],
                                expected: 'Competing in the nothing olympics'
                            }
                        ],
                        4: [
                            {
                                name: 'without emote',
                                input: [quickMock(activity, { name: 'writing stupid unit tests' })],
                                expected: 'writing stupid unit tests'
                            },
                            {
                                name: 'with unicode emote',
                                input: [quickMock(activity, { emoji: { name: '✅' }, name: 'writing stupid unit tests' })],
                                expected: '✅ writing stupid unit tests'
                            },
                            {
                                name: 'with animated emote',
                                input: [quickMock(activity, { emoji: { name: 'mmSad', id: '9326784923864', animated: true }, name: 'writing stupid unit tests' })],
                                expected: '<a:mmSad:9326784923864> writing stupid unit tests'
                            },
                            {
                                name: 'with custom emote',
                                input: [quickMock(activity, { emoji: { name: 'mmSad', id: '9326784923864', animated: false }, name: 'writing stupid unit tests' })],
                                expected: '<:mmSad:9326784923864> writing stupid unit tests'
                            }
                        ],
                        2: [
                            {
                                name: 'default',
                                input: [quickMock(activity, { name: 'my pc fans going crazy' })],
                                expected: 'Listening to my pc fans going crazy'
                            }
                        ],
                        0: [
                            {
                                name: 'default',
                                input: [quickMock(activity, { name: 'nothing because programming is everything' })],
                                expected: 'Playing nothing because programming is everything'
                            }
                        ],
                        1: [
                            {
                                name: 'default',
                                input: [quickMock(activity, { details: 'from a hot tub' })],
                                expected: 'Streaming from a hot tub'
                            }
                        ],
                        3: [
                            {
                                name: 'default',
                                input: [quickMock(activity, { name: 'a hot tub stream' })],
                                expected: 'Watching a hot tub stream'
                            }
                        ]
                    },
                    embed: {
                        author: {
                            name: {
                                user: [
                                    {
                                        name: 'bot',
                                        input: [{ user: quickMock(user, { bot: true, username: 'userUsername', discriminator: 'userDiscriminator' }) }],
                                        expected: '🤖 userUsername#userDiscriminator'
                                    },
                                    {
                                        name: 'user',
                                        input: [{ user: quickMock(user, { bot: false, username: 'userUsername', discriminator: 'userDiscriminator' }) }],
                                        expected: 'userUsername#userDiscriminator'
                                    }
                                ],
                                member: [
                                    {
                                        name: 'user with nick',
                                        input: [{ user: quickMock(member, { bot: false, username: 'userUsername', discriminator: 'userDiscriminator', nick: 'userNick' }) }],
                                        expected: 'userUsername#userDiscriminator (userNick)'
                                    },
                                    {
                                        name: 'user without nick',
                                        input: [{ user: quickMock(member, { bot: false, username: 'userUsername', discriminator: 'userDiscriminator' }) }],
                                        expected: 'userUsername#userDiscriminator'
                                    },
                                    {
                                        name: 'bot',
                                        input: [{ user: quickMock(member, { bot: true, username: 'userUsername', discriminator: 'userDiscriminator' }) }],
                                        expected: '🤖 userUsername#userDiscriminator'
                                    }
                                ]
                            }
                        },
                        description: {
                            user: [
                                {
                                    name: 'default',
                                    input: [{ user: quickMock(user, { id: 'userId', createdAt: 123456789123 }) }],
                                    expected: '**User Id**: userId\n**Created**: <t:123456789>'
                                }
                            ],
                            member: [
                                {
                                    name: 'with joinedAt',
                                    input: [{ user: quickMock(member, { id: 'userId', createdAt: 123456789123, joinedAt: 987654321123 }) }],
                                    expected: '**User Id**: userId\n**Created**: <t:123456789>\n**Joined** <t:987654321>'
                                },
                                {
                                    name: 'without joinedAt',
                                    input: [{ user: quickMock(member, { id: 'userId', createdAt: 123456789123, joinedAt: null }) }],
                                    expected: '**User Id**: userId\n**Created**: <t:123456789>\n**Joined** -'
                                }
                            ]
                        },
                        field: {
                            roles: {
                                name: 'Roles',
                                value: [
                                    {
                                        name: 'none',
                                        input: [{
                                            roles: []
                                        }],
                                        expected: 'None'
                                    },
                                    {
                                        name: 'some',
                                        input: [{
                                            roles: [
                                                quickMock(role, { mention: '<@&role1Id>' }),
                                                quickMock(role, { mention: '<@&role2Id>' }),
                                                quickMock(role, { mention: '<@&role3Id>' })
                                            ]
                                        }],
                                        expected: '<@&role1Id> <@&role2Id> <@&role3Id>'
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            version: {
                default: {
                    description: 'Tells you what version I am on',
                    success: [
                        {
                            name: 'default',
                            input: [{ version: '1.2.3' }],
                            expected: 'ℹ️ I am running blargbot version 1.2.3'
                        }
                    ]
                }
            },
            voteBan: {
                description: 'Its a meme, don\'t worry',
                errors: {
                    failed: '❌ Seems the petitions office didn\'t like that one! Please try again'
                },
                list: {
                    description: 'Gets the people with the most votes to be banned.',
                    embed: {
                        title: 'ℹ️ Top 10 Vote bans',
                        description: [
                            {
                                name: 'none',
                                input: [{
                                    items: []
                                }],
                                expected: 'No petitions have been signed yet!'
                            },
                            {
                                name: 'some',
                                input: [{
                                    items: [
                                        { index: 1, userId: 'user1Id', count: 1 },
                                        { index: 2, userId: 'user2Id', count: 123 },
                                        { index: 3, userId: 'user3Id', count: 456 }
                                    ]
                                }],
                                expected: '**1.** <@user1Id> - 1 signature\n**2.** <@user2Id> - 123 signatures\n**3.** <@user3Id> - 456 signatures'
                            }
                        ]
                    }
                },
                info: {
                    description: 'Checks the status of the petition to ban someone.',
                    embed: {
                        title: 'ℹ️ Vote ban signatures',
                        description: [
                            {
                                name: 'none',
                                input: [{
                                    user: quickMock(user, { mention: '<@userId>' }),
                                    votes: [],
                                    excess: 0
                                }],
                                expected: 'No one has voted to ban <@userId> yet.'
                            },
                            {
                                name: 'some',
                                input: [{
                                    user: quickMock(user, { mention: '<@userId>' }),
                                    votes: [
                                        { userId: 'user1Id', reason: 'because I can' },
                                        { userId: 'user2Id' },
                                        { userId: 'user3Id', reason: 'They smell' }
                                    ],
                                    excess: 123
                                }],
                                expected: '<@user1Id> - because I can\n<@user2Id>\n<@user3Id> - They smell\n... and 123 more'
                            }
                        ]
                    }
                },
                sign: {
                    description: 'Signs a petition to ban a someone',
                    alreadySigned: [
                        {
                            name: 'default',
                            input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                            expected: '❌ I know you\'re eager, but you have already signed the petition to ban <@userId>!'
                        }
                    ],
                    success: [
                        {
                            name: 'with reason',
                            input: [{
                                user: quickMock(user, { mention: '<@userId>' }),
                                target: quickMock(user, { mention: '<@targetId>' }),
                                total: 123,
                                reason: 'Because I can'
                            }],
                            expected: '✅ <@userId> has signed to ban <@targetId>! A total of **123 people** have signed the petition now.\n**Reason:** Because I can'
                        },
                        {
                            name: 'without reason',
                            input: [{
                                user: quickMock(user, { mention: '<@userId>' }),
                                target: quickMock(user, { mention: '<@targetId>' }),
                                total: 1
                            }],
                            expected: '✅ <@userId> has signed to ban <@targetId>! A total of **1 person** has signed the petition now.'
                        }
                    ]
                },
                forgive: {
                    description: 'Removes your signature to ban someone',
                    notSigned: [
                        {
                            name: 'default',
                            input: [{ user: quickMock(user, { mention: '<@userId>' }) }],
                            expected: '❌ That\'s very kind of you, but you haven\'t even signed to ban <@userId> yet!'
                        }
                    ],
                    success: [
                        {
                            name: 'single',
                            input: [{ user: quickMock(user, { mention: '<@userId>' }), target: quickMock(user, { mention: '<@targetId>' }), total: 1 }],
                            expected: '✅ <@userId> reconsidered and forgiven <@targetId>! A total of **1 person** has signed the petition now.'
                        },
                        {
                            name: 'multiple',
                            input: [{ user: quickMock(user, { mention: '<@userId>' }), target: quickMock(user, { mention: '<@targetId>' }), total: 123 }],
                            expected: '✅ <@userId> reconsidered and forgiven <@targetId>! A total of **123 people** have signed the petition now.'
                        }
                    ]
                }
            },
            warnings: {
                common: {
                    count: [
                        {
                            name: 'none',
                            input: [{ user: quickMock(user, { mention: '<@userId>' }), count: 0 }],
                            expected: '🎉 **<@userId>** doesn\'t have any warnings!'
                        },
                        {
                            name: 'single',
                            input: [{ user: quickMock(user, { mention: '<@userId>' }), count: 1 }],
                            expected: '⚠️ **<@userId>** has accumulated 1 warning.'
                        },
                        {
                            name: 'multiple',
                            input: [{ user: quickMock(user, { mention: '<@userId>' }), count: 123 }],
                            expected: '⚠️ **<@userId>** has accumulated 123 warnings.'
                        }
                    ],
                    untilTimeout: [
                        {
                            name: 'single',
                            input: [{ remaining: 1 }],
                            expected: '- 1 more warning before being timed out.'
                        },
                        {
                            name: 'multiple',
                            input: [{ remaining: 123 }],
                            expected: '- 123 more warnings before being timed out.'
                        }
                    ],
                    untilKick: [
                        {
                            name: 'single',
                            input: [{ remaining: 1 }],
                            expected: '- 1 more warning before being kicked.'
                        },
                        {
                            name: 'multiple',
                            input: [{ remaining: 123 }],
                            expected: '- 123 more warnings before being kicked.'
                        }
                    ],
                    untilBan: [
                        {
                            name: 'single',
                            input: [{ remaining: 1 }],
                            expected: '- 1 more warning before being banned.'
                        },
                        {
                            name: 'multiple',
                            input: [{ remaining: 123 }],
                            expected: '- 123 more warnings before being banned.'
                        }
                    ],
                    success: [
                        {
                            name: 'default',
                            input: [{ parts: [util.literal('part 1'), util.literal('part 2'), util.literal('part 3')] }],
                            expected: 'part 1\npart 2\npart 3'
                        }
                    ]
                },
                self: {
                    description: 'Gets how many warnings you have'
                },
                user: {
                    description: 'Gets how many warnings the user has'
                }
            },
            xkcd: {
                default: {
                    description: 'Gets an xkcd comic. If a number is not specified, gets a random one.',
                    down: '❌ Seems like xkcd is down 😟',
                    embed: {
                        title: [
                            {
                                name: 'default',
                                input: [{ id: 123, title: 'Centrifugal Force' }],
                                expected: 'xkcd #123: Centrifugal Force'
                            }
                        ],
                        footer: {
                            text: [
                                {
                                    name: 'default',
                                    input: [{ year: '2022' }],
                                    expected: 'xkcd 2022'
                                }
                            ]
                        }
                    }
                }
            },
            art: {
                flags: {
                    image: 'A custom image.'
                },
                user: {
                    description: 'Shows everyone a work of art.'
                },
                default: {
                    description: 'Shows everyone a work of art.',
                    invalidUrl: [
                        {
                            name: 'default',
                            input: [{ url: 'file:///test.txt' }],
                            expected: '❌ file:///test.txt is not a valid url!'
                        }
                    ]
                }
            },
            cah: {
                flags: {
                    unofficial: 'Also show unofficial cards.'
                },
                default: {
                    description: 'Generates a set of Cards Against Humanity cards.'
                },
                packs: {
                    description: 'Lists all the Cards against packs I know about',
                    success: 'ℹ️ These are the packs I know about:'
                }
            },
            caption: {
                errors: {
                    imageMissing: '❌ You didn\'t tell me what image I should caption!',
                    captionMissing: '❌ You must give at least 1 caption!',
                    fontInvalid: [
                        {
                            name: 'default',
                            input: [{ font: 'comic sans', prefix: '~' }],
                            expected: '❌ comic sans is not a supported font! Use `~caption list` to see all available fonts'
                        }
                    ]
                },
                flags: {
                    top: 'The top caption.',
                    bottom: 'The bottom caption.',
                    font: 'The font to use (case insensitive). Use the command with the -l flag to view the available fonts. Defaults to impact.'
                },
                fonts: {
                    description: 'Lists the fonts that are supported',
                    success: [
                        {
                            name: 'default',
                            input: [{ fonts: ['sans', 'papyrus', 'arial'] }],
                            expected: 'ℹ️ The supported fonts are: sans, papyrus and arial'
                        }
                    ]
                },
                attached: {
                    description: 'Puts captions on an attached image.'
                },
                linked: {
                    description: 'Puts captions on the image in the URL.',
                    invalidUrl: [
                        {
                            name: 'default',
                            input: [{ url: 'file:///test.txt' }],
                            expected: '❌ file:///test.txt is not a valid url!'
                        }
                    ]
                }
            },
            cat: {
                default: {
                    description: 'Gets a picture of a cat.'
                }
            },
            clint: {
                flags: {
                    image: 'A custom image.'
                },
                user: {
                    description: 'I don\'t even know, to be honest.'
                },
                default: {
                    description: 'I don\'t even know, to be honest.',
                    invalidUrl: [
                        {
                            name: 'default',
                            input: [{ url: 'file:///test.txt' }],
                            expected: '❌ file:///test.txt is not a valid url!'
                        }
                    ]
                }
            },
            clippy: {
                default: {
                    description: 'Clippy the paper clip is here to save the day!'
                }
            },
            clyde: {
                default: {
                    description: 'Give everyone a message from Clyde.'
                }
            },
            color: {
                default: {
                    description: 'Returns the provided colors.'
                }
            },
            delete: {
                default: {
                    description: 'Shows that you\'re about to delete something.'
                }
            },
            distort: {
                flags: {
                    image: 'A custom image.'
                },
                user: {
                    description: 'Turns an avatar into modern art.'
                },
                default: {
                    description: 'Turns an image into modern art.',
                    invalidUrl: [
                        {
                            name: 'default',
                            input: [{ url: 'file:///test.txt' }],
                            expected: '❌ file:///test.txt is not a valid url!'
                        }
                    ]
                }
            },
            emoji: {
                description: 'Gives you a large version of an emoji. If size is specified and the emoji is not a custom emoji, the image will be that size.',
                flags: {
                    svg: 'Get the emote as an svg instead of a png.'
                },
                default: {
                    description: 'Gives you a large version of an emoji. If size is specified and the emoji is not a custom emoji, the image will be that size.',
                    invalidEmoji: '❌ No emoji found!'
                }
            },
            free: {
                flags: {
                    bottom: 'The bottom caption.'
                },
                default: {
                    description: 'Tells everyone what you got for free'
                }
            },
            linus: {
                flags: {
                    image: 'A custom image.'
                },
                user: {
                    description: 'Shows a picture of Linus pointing at something on his monitor.'
                },
                default: {
                    description: 'Shows a picture of Linus pointing at something on his monitor.',
                    invalidUrl: [
                        {
                            name: 'default',
                            input: [{ url: 'file:///test.txt' }],
                            expected: '❌ file:///test.txt is not a valid url!'
                        }
                    ]
                }
            },
            pcCheck: {
                default: {
                    description: 'Tells everyone a reason why they should get their PC checked. Template credits go to Ghosty#8204.'
                }
            },
            pixelate: {
                flags: {
                    image: 'A custom image.',
                    scale: 'The amount to pixelate by (defaults to 64)'
                },
                user: {
                    description: 'Pixelates an image.'
                },
                default: {
                    description: 'Pixelates an image.',
                    invalidUrl: [
                        {
                            name: 'default',
                            input: [{ url: 'file:///test.txt' }],
                            expected: '❌ file:///test.txt is not a valid url!'
                        }
                    ]
                }
            },
            shit: {
                flags: {
                    plural: 'Whether or not the text is plural (use ARE instead of IS).'
                },
                default: {
                    description: 'Tells everyone what\'s shit.'
                }
            },
            sonicSays: {
                default: {
                    description: 'Sonic wants to share some words of wisdom.'
                }
            },
            starVsTheForcesOf: {
                flags: {
                    image: 'A custom image.'
                },
                user: {
                    description: 'WHO IS STAR BATTLING THIS EPISODE?'
                },
                default: {
                    description: 'WHO IS STAR BATTLING THIS EPISODE?',
                    invalidUrl: [
                        {
                            name: 'default',
                            input: [{ url: 'file:///test.txt' }],
                            expected: '❌ file:///test.txt is not a valid url!'
                        }
                    ]
                }
            },
            stupid: {
                flags: {
                    user: 'The person who is stupid.',
                    image: 'A custom image.'
                },
                default: {
                    description: 'Tells everyone who is stupid.',
                    invalidUser: [
                        {
                            name: 'default',
                            input: [{ user: 'me' }],
                            expected: '❌ I could not find the user `me`'
                        }
                    ]
                }
            },
            theSearch: {
                default: {
                    description: 'Tells everyone about the progress of the search for intelligent life.'
                }
            },
            truth: {
                default: {
                    description: 'Shows everyone what is written in the Scroll of Truth.'
                }
            },
            danbooru: {
                default: {
                    description: 'Gets three pictures from \'<https://danbooru.donmai.us/>\' using given tags.',
                    noTags: '❌ You need to provide some tags',
                    unsafeTags: '❌ None of the tags you provided were safe!',
                    noResults: '❌ No results were found!',
                    success: [
                        {
                            name: 'default',
                            input: [{ count: 123, total: 456, tags: ['tag1', 'tag2', 'tag3'] }],
                            expected: 'Found **123/456** posts for tags `tag1`, `tag2` and `tag3`'
                        }
                    ],
                    embed: {
                        author: {
                            name: [
                                {
                                    name: 'with author',
                                    input: [{ author: 'me' }],
                                    expected: 'By me'
                                },
                                {
                                    name: 'without author',
                                    input: [{}],
                                    expected: 'By UNKNOWN'
                                }
                            ]
                        }
                    }
                }
            },
            rule34: {
                default: {
                    description: 'Gets three pictures from \'<https://rule34.xxx/>\' using given tags.',
                    noTags: '❌ You need to provide some tags',
                    unsafeTags: '❌ None of the tags you provided were safe!',
                    noResults: '❌ No results were found!',
                    success: [
                        {
                            name: 'default',
                            input: [{ count: 123, total: 456, tags: ['tag1', 'tag2', 'tag3'] }],
                            expected: 'Found **123/456** posts for tags `tag1`, `tag2` and `tag3`'
                        }
                    ],
                    embed: {
                        author: {
                            name: [
                                {
                                    name: 'with author',
                                    input: [{ author: 'me' }],
                                    expected: 'By me'
                                },
                                {
                                    name: 'without author',
                                    input: [{}],
                                    expected: 'By UNKNOWN'
                                }
                            ]
                        }
                    }
                }
            },
            eval: {
                errors: {
                    error: [
                        {
                            name: 'default',
                            input: [{ result: 'idk what happened, needs more testing bro' }],
                            expected: '❌ An error occurred!```\nidk what happened, needs more testing bro\n```'
                        }
                    ]
                },
                here: {
                    description: 'Runs the code you enter on the current cluster',
                    success: [
                        {
                            name: 'default',
                            input: [{ code: 'leet hax', result: 'im in' }],
                            expected: '✅ Input:```js\nleet hax\n```Output:```\nim in\n```'
                        }
                    ]
                },
                master: {
                    description: 'Runs the code you enter on the master process',
                    success: [
                        {
                            name: 'default',
                            input: [{ code: 'leet hax', result: 'im in' }],
                            expected: '✅ Master eval input:```js\nleet hax\n```Output:```\nim in\n```'
                        }
                    ]
                },
                global: {
                    description: 'Runs the code you enter on all the clusters and aggregates the result',
                    results: {
                        template: [
                            {
                                name: 'default',
                                input: [{ code: 'leet hax', results: [util.literal('im in'), util.literal('ive hacked the mainframe'), util.literal('enhance')] }],
                                expected: 'Global eval input:```js\nleet hax\n```im in\nive hacked the mainframe\nenhance'
                            }
                        ],
                        success: [
                            {
                                name: 'default',
                                input: [{ clusterId: 123, result: 'im in' }],
                                expected: '✅ Cluster 123 output:```\nim in\n```'
                            }
                        ],
                        failed: [
                            {
                                name: 'default',
                                input: [{ clusterId: 123, result: 'im in' }],
                                expected: '❌ Cluster 123: An error occurred!```\nim in\n```'
                            }
                        ]
                    }
                },
                cluster: {
                    description: 'Runs the code you enter on all the clusters and aggregates the result',
                    success: [
                        {
                            name: 'default',
                            input: [{ clusterId: 123, code: 'leet hax', result: 'im in' }],
                            expected: '✅ Cluster 123 eval input:```js\nleet hax\n```Output:```\nim in\n```'
                        }
                    ]
                }
            },
            exec: {
                default: {
                    description: 'Executes a command on the current shell',
                    pm2Bad: '❌ No! That\'s dangerous! Do `b!restart` instead.\n\nIt\'s not that I don\'t trust you, it\'s just...\n\nI don\'t trust you.',
                    confirm: {
                        prompt: [
                            {
                                name: 'default',
                                input: [{ command: 'rm -rf /' }],
                                expected: '⚠️ You are about to execute the following on the command line:```bash\nrm -rf /\n```'
                            }
                        ],
                        continue: 'Continue',
                        cancel: 'Cancel'
                    },
                    cancelled: '✅ Execution cancelled',
                    command: {
                        pending: [
                            {
                                name: 'default',
                                input: [{ command: 'rm -rf /' }],
                                expected: 'ℹ️ Command: `rm -rf /`\nRunning...'
                            }
                        ],
                        success: [
                            {
                                name: 'default',
                                input: [{ command: 'rm -rf /' }],
                                expected: '✅ Command: `rm -rf /`'
                            }
                        ],
                        error: [
                            {
                                name: 'default',
                                input: [{ command: 'rm -rf /' }],
                                expected: '❌ Command: `rm -rf /`'
                            }
                        ]
                    }
                }
            },
            logLevel: {
                default: {
                    description: 'Sets the current log level',
                    success: [
                        {
                            name: 'default',
                            input: [{ logLevel: '9001' }],
                            expected: '✅ Log level set to `9001`'
                        }
                    ]
                }
            },
            awoo: {
                description: 'Awoooooooooo!',
                action: [
                    {
                        name: 'default',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }) }],
                        expected: '**<@selfId>** awoos!'
                    }
                ]
            },
            bang: {
                description: 'Bang bang!',
                action: [
                    {
                        name: 'default',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }) }],
                        expected: '**<@selfId>** bangs!'
                    }
                ]
            },
            bite: {
                description: 'Give someone a bite!',
                action: [
                    {
                        name: 'user',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }), target: quickMock(user, { mention: '<@targetId>' }) }],
                        expected: '**<@selfId>** bites **<@targetId>**'
                    },
                    {
                        name: 'self',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }) }],
                        expected: '**<@selfId>** bites **themselves**'
                    }
                ]
            },
            blush: {
                description: 'Show everyone that you\'re blushing.',
                action: [
                    {
                        name: 'default',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }) }],
                        expected: '**<@selfId>** blushes!'
                    }
                ]
            },
            cry: {
                description: 'Show everyone that you\'re crying.',
                action: [
                    {
                        name: 'default',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }) }],
                        expected: '**<@selfId>** cries!'
                    }
                ]
            },
            cuddles: {
                description: 'Cuddle with someone.',
                action: [
                    {
                        name: 'target',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }), target: quickMock(user, { mention: '<@targetId>' }) }],
                        expected: '**<@selfId>** cuddles with **<@targetId>**'
                    },
                    {
                        name: 'self',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }) }],
                        expected: '**<@selfId>** cuddles with **themselves**'
                    }
                ]
            },
            dance: {
                description: 'Break out some sweet, sweet dance moves.',
                action: [
                    {
                        name: 'default',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }) }],
                        expected: '**<@selfId>** dances!'
                    }
                ]
            },
            hug: {
                description: 'Give somebody a hug.',
                action: [
                    {
                        name: 'target',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }), target: quickMock(user, { mention: '<@targetId>' }) }],
                        expected: '**<@selfId>** hugs **<@targetId>**'
                    },
                    {
                        name: 'self',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }) }],
                        expected: '**<@selfId>** hugs **themselves**'
                    }
                ]
            },
            jojo: {
                description: 'This must be the work of an enemy stand!'
            },
            kiss: {
                description: 'Give somebody a kiss.',
                action: [
                    {
                        name: 'target',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }), target: quickMock(user, { mention: '<@targetId>' }) }],
                        expected: '**<@selfId>** kisses **<@targetId>**'
                    },
                    {
                        name: 'self',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }) }],
                        expected: '**<@selfId>** kisses **themselves**'
                    }
                ]
            },
            lewd: {
                description: 'T-that\'s lewd...',
                action: [
                    {
                        name: 'default',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }) }],
                        expected: '**<@selfId>** is lewd 😳!'
                    }
                ]
            },
            lick: {
                description: 'Give someone a lick. Sluurrpppp!',
                action: [
                    {
                        name: 'target',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }), target: quickMock(user, { mention: '<@targetId>' }) }],
                        expected: '**<@selfId>** licks **<@targetId>**'
                    },
                    {
                        name: 'self',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }) }],
                        expected: '**<@selfId>** licks **themselves**'
                    }
                ]
            },
            megumin: {
                description: 'Darkness blacker than black and darker than dark, I beseech thee, combine with my deep crimson. The time of awakening cometh. Justice, fallen upon the infallible boundary, appear now as an intangible distortion! Dance, Dance, Dance! I desire for my torrent of power a destructive force: a destructive force without equal! Return all creation to cinders, and come from the abyss!'
            },
            nom: {
                description: 'Nom on somebody.',
                action: [
                    {
                        name: 'target',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }), target: quickMock(user, { mention: '<@targetId>' }) }],
                        expected: '**<@selfId>** noms on **<@targetId>**'
                    },
                    {
                        name: 'self',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }) }],
                        expected: '**<@selfId>** noms on **themselves**'
                    }
                ]
            },
            owo: {
                description: 'owo whats this?',
                action: [
                    {
                        name: 'default',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }) }],
                        expected: '**<@selfId>** owos!'
                    }
                ]
            },
            pat: {
                description: 'Give somebody a lovely pat.',
                action: [
                    {
                        name: 'target',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }), target: quickMock(user, { mention: '<@targetId>' }) }],
                        expected: '**<@selfId>** pats **<@targetId>**'
                    },
                    {
                        name: 'self',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }) }],
                        expected: '**<@selfId>** pats **themselves**'
                    }
                ]
            },
            poke: {
                description: 'Gives somebody a poke.',
                action: [
                    {
                        name: 'target',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }), target: quickMock(user, { mention: '<@targetId>' }) }],
                        expected: '**<@selfId>** pokes **<@targetId>**'
                    },
                    {
                        name: 'self',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }) }],
                        expected: '**<@selfId>** pokes **themselves**'
                    }
                ]
            },
            pout: {
                description: 'Let everyone know that you\'re being pouty.',
                action: [
                    {
                        name: 'default',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }) }],
                        expected: '**<@selfId>** pouts!'
                    }
                ]
            },
            punch: {
                description: 'Punch someone. They probably deserved it.',
                action: [
                    {
                        name: 'target',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }), target: quickMock(user, { mention: '<@targetId>' }) }],
                        expected: '**<@selfId>** punches **<@targetId>**'
                    },
                    {
                        name: 'self',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }) }],
                        expected: '**<@selfId>** punches **themselves**'
                    }
                ]
            },
            rem: {
                description: 'Worst girl'
            },
            shrug: {
                description: 'Let everyone know that you\'re a bit indifferent.',
                action: [
                    {
                        name: 'default',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }) }],
                        expected: '**<@selfId>** shrugs!'
                    }
                ]
            },
            slap: {
                description: 'Slaps someone.',
                action: [
                    {
                        name: 'target',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }), target: quickMock(user, { mention: '<@targetId>' }) }],
                        expected: '**<@selfId>** slaps **<@targetId>**'
                    },
                    {
                        name: 'self',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }) }],
                        expected: '**<@selfId>** slaps **themselves**'
                    }
                ]
            },
            sleepy: {
                description: 'Let everyone know that you\'re feeling tired.',
                action: [
                    {
                        name: 'default',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }) }],
                        expected: '**<@selfId>** is sleepy!'
                    }
                ]
            },
            smile: {
                description: 'Smile!',
                action: [
                    {
                        name: 'default',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }) }],
                        expected: '**<@selfId>** smiles!'
                    }
                ]
            },
            smug: {
                description: 'Let out your inner smugness.',
                action: [
                    {
                        name: 'default',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }) }],
                        expected: '**<@selfId>** is smug!'
                    }
                ]
            },
            stare: {
                description: 'Staaaaaaaaare',
                action: [
                    {
                        name: 'default',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }) }],
                        expected: '**<@selfId>** stares!'
                    }
                ]
            },
            thumbsUp: {
                description: 'Give a thumbs up!',
                action: [
                    {
                        name: 'default',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }) }],
                        expected: '**<@selfId>** gives a thumbs up!'
                    }
                ]
            },
            wag: {
                description: 'Wagwagwagwag',
                action: [
                    {
                        name: 'default',
                        input: [{ self: quickMock(user, { mention: '<@selfId>' }) }],
                        expected: '**<@selfId>** wags!'
                    }
                ]
            },
            respawn: {
                description: 'Cluster respawning only for staff.',
                default: {
                    description: 'Respawns the cluster specified',
                    requested: [
                        {
                            name: 'default',
                            input: [{ user: quickMock(user, { mention: '<@userId>' }), clusterId: 123 }],
                            expected: '**<@userId>** has called for a respawn of cluster 123.'
                        }
                    ],
                    success: [
                        {
                            name: 'default',
                            input: [{ clusterId: 123 }],
                            expected: '✅ Cluster 123 is being respawned and stuff now'
                        }
                    ]
                }
            },
            respond: {
                default: {
                    description: 'Responds to a suggestion, bug report or feature request',
                    notFound: '❌ I couldn\'t find that feedback!',
                    userNotFound: '⚠️ Feedback successfully updated\n⛔ I couldn\'t find the user who submitted that feedback',
                    alertFailed: '⚠️ Feedback successfully updated\n⛔ I wasn\'t able to send the response in the channel where the feedback was initially sent',
                    success: '✅ Feedback successfully updated and response has been sent.',
                    alert: [
                        {
                            name: 'with description',
                            input: [{ submitterId: 'submitterId', title: 'My cool suggestion', description: 'delete blargbot', respondent: quickMock(user, { mention: '<@respondentId>' }), response: 'will do!', link: 'https://blargbot.xyz/feedback/123' }],
                            expected: '**Hi, <@submitterId>!**  You recently made this suggestion:\n\n**My cool suggestion**\n\ndelete blargbot\n\n**<@respondentId>** has responded to your feedback with this:\n\nwill do!\n\nIf you have any further questions or concerns, please join my support guild so that they can talk to you directly. You can get a link by doing `b!invite`. Thanks for your time!\n\nYour card has been updated here: <https://blargbot.xyz/feedback/123>'
                        },
                        {
                            name: 'without description',
                            input: [{ submitterId: 'submitterId', title: 'My cool suggestion', description: '', respondent: quickMock(user, { mention: '<@respondentId>' }), response: 'will do!', link: 'https://blargbot.xyz/feedback/123' }],
                            expected: '**Hi, <@submitterId>!**  You recently made this suggestion:\n\n**My cool suggestion**\n\n**<@respondentId>** has responded to your feedback with this:\n\nwill do!\n\nIf you have any further questions or concerns, please join my support guild so that they can talk to you directly. You can get a link by doing `b!invite`. Thanks for your time!\n\nYour card has been updated here: <https://blargbot.xyz/feedback/123>'
                        }
                    ]
                }
            }
        }
    });
});
