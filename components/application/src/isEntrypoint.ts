export default function isEntrypoint(meta: ImportMeta): boolean {
    return `file://${process.argv[1]}` === meta.url;
}
