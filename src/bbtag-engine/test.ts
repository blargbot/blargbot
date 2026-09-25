import { BBTagEngine } from './BBTagEngine.js';
import { composeReplacer } from './composeReplacer.js';
import { parseBBTag } from './language/parseBBTag.js';
import * as json from './replacers/json.js';
import * as math from './replacers/math.js';
import * as misc from './replacers/misc.js';
import * as simple from './replacers/simple.js';

const replacer = composeReplacer(x => x
    .registerAll(simple)
    .registerAll(misc)
    .registerAll(math)
    .registerAll(json)
);
const engine = new BBTagEngine({
    replacer,
    locals: {
        toInput() {
            return {};
        },
        /* @ts-expect-error testing file */
        toLocals() {
            return {

            };
        }
    },
    renderError: async function* (err) {
        yield await Promise.resolve(err.display ?? `\`${err.message}\``);
    },
    serializer: {
        deserialize() {
            return {};
        },
        serialize() {
            return new Uint8Array(0);
        }
    }
});

const ctx = await engine.createContext({});
const bbtag = parseBBTag('{lb}', { throws: true });
const result = await ctx.eval(bbtag);
// eslint-disable-next-line no-console
console.info(result);
