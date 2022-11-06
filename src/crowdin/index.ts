import { ITranslationSource, LanguageDetails } from '@blargbot/formatting';
import fetch from 'node-fetch';
import path from 'path';

export class CrowdinTranslationSource implements ITranslationSource {
    readonly #manifestUrl: string;
    readonly #contentUrl: (fileName: string, timestamp: number) => string;
    readonly #languageMapUrl: string;
    readonly #languageKeys: Map<string, LanguageDetails>;
    readonly #languageData: Map<string, ReadonlyMap<string, string>>;
    #loadPromise?: Promise<void>;

    public readonly languages: ReadonlyMap<string, LanguageDetails>;

    public constructor(distribution: string) {
        this.#manifestUrl = `https://distributions.crowdin.net/${distribution}/manifest.json`;
        this.#contentUrl = (fileName, timestamp) => `https://distributions.crowdin.net/${distribution}/content${fileName}?timestamp=${timestamp}`;
        this.#languageMapUrl = 'https://api.crowdin.com/api/v2/languages?limit=500';

        this.languages = this.#languageKeys = new Map();
        this.#languageData = new Map();

        this.#loadPromise = this.#load();
    }

    public load(): Promise<void> {
        return this.#loadPromise ??= this.#load();
    }

    async #load(): Promise<void> {
        try {
            const [languages, manifest] = await Promise.all([
                this.#getLanguageMap(),
                this.#getManifest()
            ]);

            const languageMap = new Map(languages.map(x => [x.id, x]));
            for (const id of manifest.languages) {
                const language = languageMap.get(id);
                if (language === undefined)
                    continue;

                const fileUrls = manifest.files.map(file => this.#contentUrl(file.replaceAll('%locale%', language.locale), manifest.timestamp)).map(f => new URL(f));
                try {
                    await this.#loadLanguageFiles(fileUrls, language);
                } catch { /* NO-OP */ }
            }
        } finally {
            this.#loadPromise = undefined;
        }
    }

    public getTranslation(id: string, locale: Intl.Locale): string | undefined {
        return this.#languageData.get(locale.baseName)?.get(id);
    }

    async #loadLanguageFiles(fileUrls: URL[], language: CrowdinLanguage): Promise<void> {
        const strings: Array<[string, string]> = [];
        for (const fileUrl of fileUrls) {
            const response = await fetch(fileUrl, { headers: { ['Accept']: 'application/json' } });
            const data = await response.json() as CrowdinLanguageTree;
            strings.push(...this.#flattenJson([path.basename(fileUrl.pathname, '.json')], data));
        }

        const lookup = new Map(strings);
        if (lookup.size === 0) {
            this.#languageKeys.delete(language.locale);
            this.#languageData.delete(language.locale);
        } else {
            this.#languageKeys.set(language.locale, {
                name: lookup.get('config.localeName') ?? language.name,
                keys: new Set(lookup.keys())
            });
            lookup.delete('config.localeName');
            this.#languageData.set(language.locale, lookup);
        }
    }

    * #flattenJson(keys: string[], tree: CrowdinLanguageTree): Generator<[string, string]> {
        for (const [key, value] of Object.entries(tree)) {
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

    async #getLanguageMap(): Promise<CrowdinLanguage[]> {
        const response = await fetch(this.#languageMapUrl, { headers: { ['Accept']: 'application/json' } });
        const json = await response.json() as { data: Array<{ data: CrowdinLanguage; }>; };
        return json.data.map(({ data }) => data);
    }

    async #getManifest(): Promise<CrowdinManifest> {
        const response = await fetch(this.#manifestUrl, { headers: { ['Accept']: 'application/json' } });
        const manifest = await response.json() as CrowdinManifest;
        return manifest;
    }
}

interface CrowdinManifest {
    readonly files: readonly string[];
    readonly languages: readonly string[];
    readonly timestamp: number;
    readonly [key: string]: unknown;
}

interface CrowdinLanguage {
    readonly id: string;
    readonly locale: string;
    readonly name: string;
    readonly [key: string]: unknown;
}

interface CrowdinLanguageTree {
    readonly [key: string]: string | CrowdinLanguageTree | null;
}
