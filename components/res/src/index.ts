import { getJsonResource } from './resource.js';

export * from './resource.js';

export default Object.freeze({
    avatars: Object.freeze({
        dev: getJsonResource<typeof import('./avatars.dev.json')>('./avatars.dev.json'),
        prd: getJsonResource<typeof import('./avatars.prd.json')>('./avatars.prd.json')
    }),
    beeMovie: getJsonResource<typeof import('./beemovie.json')>('./beemovie.json'),
    spells: getJsonResource<typeof import('./spells.json')>('./spells.json'),
    cardsAgainstHumanity: getJsonResource<typeof import('./cah.json')>('./cah.json'),
    colors: getJsonResource<typeof import('./colors.json')>('./colors.json'),
    contributors: getJsonResource<typeof import('./contributors.json')>('./contributors.json'),
    discordEmoteData: getJsonResource<typeof import('./discordEmoteData.json')>('./discordEmoteData.json'),
    holidays: getJsonResource<typeof import('./holidays.json')>('./holidays.json')
});
