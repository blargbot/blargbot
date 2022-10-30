import { ITranslationSource } from '@blargbot/formatting';
import fs from 'fs';
import path from 'path';

export class FileSystemTranslationSource implements ITranslationSource {
    readonly #translationData: { readonly [P in string]?: { readonly [P in string]?: string } };

    public locales: ReadonlyMap<string, ReadonlySet<string>>;

    public constructor(directory: string) {
        this.#translationData = Object.fromEntries(
            fs.readdirSync(directory, { withFileTypes: true })
                .filter(e => e.isDirectory())
                .map(e => [
                    e.name,
                    FileSystemTranslationSource.#getTranslationKeys(path.join(directory, e.name))
                ] as const)
                .filter(x => {
                    try {
                        new Intl.Locale(x[0]);
                        return true;
                    } catch {
                        return false;
                    }
                })
        );
        this.locales = Object.freeze(new Map(
            Object.entries(this.#translationData)
                .map(([locale, data]) => [locale, Object.freeze(new Set(Object.keys(data ?? {})))])
        ));
    }

    public getTranslation(id: string, locale: Intl.Locale): string | undefined {
        const translations = this.#translationData[locale.baseName]
            ?? this.#translationData[locale.language];
        return translations?.[id];
    }

    static #getTranslationKeys(directory: string): { [P in string]?: string } {
        return Object.fromEntries(
            fs.readdirSync(directory, { withFileTypes: true })
                .filter(e => e.isFile())
                .map(f => ({
                    name: f.name.slice(0, -path.extname(f.name).length),
                    data: JSON.parse(fs.readFileSync(path.join(directory, f.name), 'utf8')) as unknown
                }))
                .filter((f): f is { name: string; data: object; } => typeof f.data === 'object' && f.data !== null)
                .flatMap(f => [...this.#flattenJson([f.name], f.data)])
        );
    }

    static * #flattenJson(keys: string[], json: object): Generator<[string, string]> {
        for (const [key, value] of Object.entries<string, unknown>(json)) {
            keys.push(key);
            switch (typeof value) {
                case 'string':
                    if (value.length === 0)
                        break;
                    yield [keys.join('.'), value];
                    break;
                case 'object':
                    if (value === null)
                        break;
                    yield* this.#flattenJson(keys, value);
                    break;
            }
            keys.pop();
        }
    }
}
