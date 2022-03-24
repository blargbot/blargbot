import { SourceMarker } from '../language';

export function stringifyLocation(location: SourceMarker): string {
    return `${location.line},${location.column}`;
}
