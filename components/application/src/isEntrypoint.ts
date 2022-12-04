import getCallerImportMeta from './getCallerImportMeta.js';

export default function isEntrypoint(meta = getCallerImportMeta()): boolean {
    return `file://${process.argv[1]}` === meta.url;
}
