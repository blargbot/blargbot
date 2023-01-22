import { Api } from '../Api';
import { BaseRoute } from '../BaseRoute';

export class MetricsRoute extends BaseRoute<['/domains']> {
    readonly #api: Api;

    public constructor(api: Api) {
        super('/domains');

        this.#api = api;

        this.addRoute('/', {
            get: async () => {
                const domains = await this.#api.database.vars.get('whitelistedDomains');
                const allowed = Object.entries(domains?.values ?? {}).filter(x => x[1]).map(x => x[0]);
                return this.ok(allowed);
            }
        });
    }
}
