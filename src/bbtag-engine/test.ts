import { BBTagEngine } from './BBTagEngine.js';
import { BBTagRuntimeError } from './BBTagRuntimeError.js';
import { composeBBTagReplacer } from './composeBBTagReplacer.js';
import { parseBBTag } from './language/parseBBTag.js';
import * as math from './replacers/math.js';
import * as misc from './replacers/misc.js';
import * as simple from './replacers/simple.js';

const replacer = composeBBTagReplacer(x => x
    .registerAll(simple)
    .registerAll(misc)
    .registerAll(math)
);
const engine = new BBTagEngine({
    replacer,
    locals: {
        toInput() {
            return {};
        },
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
const bbtag = parseBBTag('{lb}');
if (bbtag instanceof BBTagRuntimeError)
    throw bbtag;

const result = await ctx.eval(bbtag);
console.info(result);
