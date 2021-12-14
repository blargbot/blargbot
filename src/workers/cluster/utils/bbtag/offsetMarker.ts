import { SourceMarker } from '@cluster/types';

export function offsetMarker(marker: SourceMarker, index: number, columns = index, lines = 0): SourceMarker {
    return {
        index: marker.index + index,
        line: marker.line + lines,
        column: lines === 0 ? marker.column + columns : columns
    };
}
