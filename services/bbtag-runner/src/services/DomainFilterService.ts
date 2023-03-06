import type { DomainFilterService as BBTagDomainFilterService } from '@bbtag/blargbot';

export class DomainFilterService implements BBTagDomainFilterService {
    public canRequestDomain(domain: string): boolean {
        domain;
        throw new Error('Method not implemented.');
    }
}
