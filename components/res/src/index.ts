import type devAvatars from './avatars.dev.json';
import type prdAvatars from './avatars.prd.json';
import type beemovie from './beemovie.json';
import type cah from './cah.json';
import type colors from './colors.json';
import type contributors from './contributors.json';
import type holidays from './holidays.json';
import { getJsonResource } from './resource.js';
import type spells from './spells.json';

export * from './resource.js';

export default Object.freeze({
    avatars: Object.freeze({
        dev: getJsonResource<typeof devAvatars>('./avatars.dev.json'),
        prd: getJsonResource<typeof prdAvatars>('./avatars.prd.json')
    }),
    beeMovie: getJsonResource<typeof beemovie>('./beemovie.json'),
    spells: getJsonResource<typeof spells>('./spells.json'),
    cardsAgainstHumanity: getJsonResource<typeof cah>('./cah.json'),
    colors: getJsonResource<typeof colors>('./colors.json'),
    contributors: getJsonResource<typeof contributors>('./contributors.json'),
    holidays: getJsonResource<typeof holidays>('./holidays.json')
});
