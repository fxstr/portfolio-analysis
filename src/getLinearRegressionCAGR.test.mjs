import getLinearRegressionCAGR from './getLinearRegressionCAGR.mjs';
/* global expect, test */

const createData = () => ([
    // 1st year: double in value
    // months 6 to 18: +50% (after 1 year, value stays the same)
    { date: new Date(2024, 0, 1, 0, 0, 0), value: 1 },
    { date: new Date(2024, 2, 8, 0, 0, 0), value: 1.5 },
    { date: new Date(2024, 5, 15, 0, 0, 0), value: 2 },
    // Make sure the 2nd window starts with 2
    { date: new Date(2024, 6, 2, 0, 0, 0), value: 2 },
    { date: new Date(2024, 8, 22, 0, 0, 0), value: 2.5 },
    { date: new Date(2024, 11, 29, 0, 0, 0), value: 3 },
    // Make sure the 3rd window also starts with 3
    { date: new Date(2025, 0, 1, 0, 0, 0), value: 3.1 },
    { date: new Date(2025, 2, 29, 0, 0, 0), value: 3.2 },
    { date: new Date(2025, 5, 29, 0, 0, 0), value: 3.3 },
]);

test('fails with invalid arguments', () => {
    expect(() => getLinearRegressionCAGR([], [2])).toThrow(/match length of/);
});

test('returns linear regression cagr', () => {
    const data = createData();
    expect(getLinearRegressionCAGR(
        data.map(({ value }) => value),
        data.map(({ date }) => date),
    ))
    // Months 1–12: 200% growth, months 6–18: 60% growth, months 12–18: 13% growth;
    // 12–15 only counts 1/2 (6 months of a year)
        .toBeCloseTo((1.846 * 0.995 + 0.601 * 0.992 + 0.132 * 0.490) / 2.477);
});

test('works with 1 entry in one of the windows', () => {
    const data = createData().slice(0, 4);
    expect(getLinearRegressionCAGR(
        data.map(({ value }) => value),
        data.map(({ date }) => date),
    ))
    // Growth window of the 2nd  window is discarded because its NaN
        .toBeCloseTo(1.907);
});

test('one entry returns NaN', () => {
    const data = createData().slice(0, 1);
    expect(getLinearRegressionCAGR(
        data.map(({ value }) => value),
        data.map(({ date }) => date),
    ))
    // Growth window of the 2nd  window is discarded because its NaN
        .toEqual(NaN);
});
