import type { ListGuildFeaturesFeature } from '@blargbot/bbtag/subtags';
import { GuildFeaturesSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<ListGuildFeaturesFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new GuildFeaturesSubtag(features.instance),
    argCountBounds: { min: 0, max: 0 },
    names: ['guildFeatures', 'features'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        {
            code: '{guildfeatures}',
            expected: JSON.stringify(getAllFeatures()),
            setup(ctx) {
                features.setup(m => m.listGuildFeatures(ctx.guildId))
                    .resolves(getAllFeatures())
                    .mustHappen(1);
            }
        },
        {
            code: '{guildfeatures}',
            expected: '[]',
            setup(ctx) {
                features.setup(m => m.listGuildFeatures(ctx.guildId))
                    .resolves([])
                    .mustHappen(1);
            }
        }
    ]
});

function getAllFeatures(): string[] {
    return [
        'ANIMATED_BANNER',
        'ANIMATED_ICON',
        'APPLICATION_COMMAND_PERMISSIONS_V2',
        'AUTO_MODERATION',
        'BANNER',
        'COMMUNITY',
        'CREATOR_MONETIZABLE_PROVISIONAL',
        'CREATOR_STORE_PAGE',
        'DEVELOPER_SUPPORT_SERVER',
        'DISCOVERABLE',
        'ENHANCED_ROLE_COLORS',
        'FEATURABLE',
        'GUILD_TAGS',
        'GUESTS_ENABLED',
        'INVITES_DISABLED',
        'INVITE_SPLASH',
        'MEMBER_VERIFICATION_GATE_ENABLED',
        'MORE_SOUNDBOARD',
        'MORE_STICKERS',
        'NEWS',
        'PARTNERED',
        'PREVIEW_ENABLED',
        'PRUNE_REQUIRES_ADMIN',
        'RAID_ALERTS_DISABLED',
        'ROLE_ICONS',
        'ROLE_SUBSCRIPTIONS_AVAILABLE_FOR_PURCHASE',
        'ROLE_SUBSCRIPTIONS_ENABLED',
        'SOUNDBOARD',
        'TICKETED_EVENTS_ENABLED',
        'VANITY_URL',
        'VERIFIED',
        'VIP_REGIONS',
        'WELCOME_SCREEN_ENABLED',
        'COMMUNITY',
        'DISCOVERABLE',
        'INVITES_DISABLED',
        'RAID_ALERTS_DISABLED'
    ];
}
