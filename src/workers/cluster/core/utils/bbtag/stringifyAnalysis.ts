import { AnalysisResults } from '../../types';
import { stringifyLocation } from './stringifyLocation';


export function stringifyAnalysis(analysis: AnalysisResults): string {
    const lines = [];
    for (const error of analysis.errors)
        lines.push(`⛔ [${stringifyLocation(error.location)}]: ${error.message}`);
    for (const warning of analysis.warnings)
        lines.push(`⚠ [${stringifyLocation(warning.location)}]: ${warning.message}`);
    return lines.join('\n');
}
