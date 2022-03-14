import { SourceMarker } from '@blargbot/cluster/types';

export function stringifyLocation(location: SourceMarker): string {
    return `${location.line},${location.column}`;
}
