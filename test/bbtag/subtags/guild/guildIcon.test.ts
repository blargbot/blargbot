import type { GetGuildIconFeature } from '@blargbot/bbtag-engine/subtags';
import { GuildIconSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<GetGuildIconFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new GuildIconSubtag(features.instance),
    argCountBounds: { min: 0, max: 0 },
    names: ['guildIcon'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        {
            code: '{guildicon}',
            expected: 'https://cdn.discordapp.com/icons/2387612328973643892746/myCoolIcon.png?size=512',
            setup(ctx) {
                features.setup(m => m.getGuildIcon(ctx.guildId))
                    .resolves(new URL('https://cdn.discordapp.com/icons/2387612328973643892746/myCoolIcon.png?size=512'))
                    .mustHappen(1);
            }
        },
        {
            title: 'No icon set',
            code: '{guildicon}',
            expected: '',
            setup(ctx) {
                features.setup(m => m.getGuildIcon(ctx.guildId))
                    .resolves(null)
                    .mustHappen(1);
            }
        },
        {
            title: 'Guild not found',
            code: '{guildicon}',
            expected: '',
            setup(ctx) {
                features.setup(m => m.getGuildIcon(ctx.guildId))
                    .resolves(undefined)
                    .mustHappen(1);
            }
        }
    ]
});
