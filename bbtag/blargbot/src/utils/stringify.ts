import type { BBTagCallToken, BBTagStatementToken } from '@bbtag/language';

export function stringify(bbtag: BBTagStatementToken | BBTagCallToken): string {
    if ('values' in bbtag) {
        return bbtag.values.map(val => typeof val === 'string' ? val : stringify(val)).join('');
    }

    const parts = [bbtag.name, ...bbtag.args]
        .map(stringify)
        .join(';');
    return `{${parts}}`;
}
