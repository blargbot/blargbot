import fs from 'node:fs';
import { stdout } from 'node:process';
import { run } from 'node:test';
import { dot, lcov, spec } from 'node:test/reporters';

const coverage = process.argv.includes('--coverage');
const results = run({
    files: [`${import.meta.dirname}/test/index.test.js`],
    coverage,
    coverageIncludeGlobs: [
        `${import.meta.dirname}/src/**/*.js`
    ],
    lineCoverage: 90,
    branchCoverage: 90,
    functionCoverage: 90
});

results.compose(coverage ? spec : dot).pipe(stdout);
if (coverage) {
    const reportDir = `${import.meta.dirname}/test-results`;
    if (!fs.existsSync(reportDir))
        fs.mkdirSync(reportDir, { recursive: true });
    results.compose(lcov).pipe(fs.createWriteStream(`${reportDir}/lcov.info`));
}
