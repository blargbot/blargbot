import getCallerImportMeta from './getCallerImportMeta.js';

export default function isEntrypoint(meta: ImportMeta = getCallerImportMeta()): boolean {
    return `file://${process.argv[1]}` === meta.url;
}
