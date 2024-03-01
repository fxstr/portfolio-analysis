import {
    ensureArray,
    getMaxAsSeries,
    getRelativeDrawdownAsSeries,
    getMaxRelativeDrawdown,
    getRelativeChangeAsSeries,
    getAverage,
    getRelativeTimeInMarket,
    getCAGR,
    getCalmar,
    getSortino,
    getStandardDeviation,
    getSharpe,
    getNormalizedAsSeries,
    getLinearRegression,
    getLinearRegressionCAGR,
} from './main.mjs';
import createTestData from './test/createTestData.mjs';

/* global expect, test */

const expectToBeCloseToArray = (actual, expected) => {
    expect(actual.length).toBe(expected.length);
    actual.forEach((value, index) => (
        expect(value).toBeCloseTo(expected[index])
    ));
};

test('ensures array and type', () => {
    expect(() => ensureArray('t')).toThrow('Expected parameter to be an array, got t instead.');
    expect(() => ensureArray([])).not.toThrow();
    expect(() => ensureArray([5, 'y', 7, () => {}], 'number')).toThrow('Expected every item of array to be of type number, got items y, () => {} with types string, function instead.');
    expect(() => ensureArray([2, 3, 4], 'number')).not.toThrow();
});

test('get max as series', () => {
    expect(getMaxAsSeries(createTestData())).toEqual([23.5, 23.5, 23.5, 23.5, 23.8, 24.0, 24.0]);
    expect(getMaxAsSeries([])).toEqual([]);
});

test('get drawdown as series', () => {
    expectToBeCloseToArray(
        getRelativeDrawdownAsSeries(createTestData()),
        [
            0,
            -0.008510638297872353,
            -0.017021276595744594,
            -0.017021276595744594,
            0,
            0,
            -0.012500000000000067,
        ],
    );
});

test('get max drawdown', () => {
    expect(getMaxRelativeDrawdown(createTestData()))
        .toBeCloseTo(-0.017021276595744594);
});

test('get relative change as series', () => {
    const result = getRelativeChangeAsSeries(createTestData());
    expect(result[0]).toBe(Number.NaN);
    expectToBeCloseToArray(
        result.slice(1),
        [
            -0.0085106382978,
            -0.0085836909871,
            0,
            0.03030303030303,
            0.00840336134453,
            -0.0125000000000,
        ],
    );
});

test('get average', () => {
    expect(getAverage(createTestData())).toBe(23.5);
});

test('get relative time in market', () => {
    // 5 out of 6 dates (first one is ignored)
    expect(getRelativeTimeInMarket(createTestData())).toBe(0.8333333333333334);
    expect(getRelativeTimeInMarket([5, 5, 5])).toBe(0);
    expect(getRelativeTimeInMarket([5, 4, 3])).toBe(1);
    expect(getRelativeTimeInMarket([5, 3, 3, 4, 4, 5])).toBe(0.6);
});

test('get CAGR', () => {
    expect(() => getCAGR(createTestData())).toThrow('Parameter startDate must be an instance of Date, is undefined instead.');
    expect(() => getCAGR(createTestData(), new Date())).toThrow('Parameter endDate must be an instance of Date, is undefined instead.');
    expect(() => getCAGR(createTestData(), new Date(2023, 0, 2), new Date(2023, 0, 1))).toThrow(/Parameter startDate \(.*\) must lie before endDate.*/);
    // ((23.7 / 23.5) ** (1 / (10 / 365))) - 1
    expect(getCAGR(createTestData(), new Date(2023, 0, 1), new Date(2023, 0, 11)))
        .toBe(0.3625035937554828);
});

test('get calmar', () => {
    // CAGR is 0.3625035937554828, max drawdown -0.017021276595744594
    expect(getCalmar(createTestData(), new Date(2023, 0, 1), new Date(2023, 0, 11)))
        .toBe(21.297086133134723);
});

test('get sortino', () => {
    // Relative diffs are -0.00851064, -0.00858369, 0, 0.03030303, 0.00840336, -0.0125
    // Formula to get relative diffs: x(n+1)/x(n)-1
    // Average diff: 0.00151868
    // Downside deviation: Use pow2 of all negative diffs, divide by their amount, then sqrt
    // sqrt((-0.00851064)^2+(-0.00858369)^2+(-0.0125)^2)/3)
    // = sqrt(0.00030236 / 3)
    // = sqrt(0.00010079)
    // = 0.01003942
    // Result: 0.00151868 / 0.01003942 = 0.15127169
    expect(getSortino(createTestData()))
        .toBe(0.15127368221893184);
});

test('get standard deviation', () => {
    // stdDev is 0.3251 (https://www.calculator.net/standard-deviation-calculator.html)
    expect(getStandardDeviation(createTestData())).toBeCloseTo(0.3251);
});

test('get sharpe', () => {
    // stdDev is 0.3251 (see std dev test)
    // CAGR is 0.36250 (see CAGR test)
    // Sharpe is therefore 1.1149
    expect(getSharpe(createTestData(), new Date(2023, 0, 1), new Date(2023, 0, 11)))
        .toBeCloseTo(1.1149);
});

test('get normalized series', () => {
    expectToBeCloseToArray(
        getNormalizedAsSeries(createTestData()),
        [1, 0.9914893, 0.98297, 0.98297, 1.012765, 1.021276, 1.008510],
    );
    expect(getNormalizedAsSeries([])).toEqual([]);
});

test('returns linear regression', () => {
    // Throws on invalid xValues
    expect(() => getLinearRegression(createTestData(), [1, 2])).toThrow(/same amout of items as yValues/);
    // Regular array as argument, no xValues; validated with
    // https://www.statskingdom.com/linear-regression-calculator.html
    const regularResult = getLinearRegression(createTestData());
    expect(Object.keys(regularResult)).toEqual(['m', 'b']);
    expect(regularResult.b).toBeCloseTo(23.21);
    expect(regularResult.m).toBeCloseTo(0.096);
    // Regular array as argument, with yValues
    const xValuesResult = getLinearRegression(createTestData(), [1, 2, 4, 6, 4, 8, 3]);
    expect(xValuesResult.b).toBeCloseTo(23.34);
    expect(xValuesResult.m).toBeCloseTo(0.041);
    // Empty array as argument
    const emptyResult = getLinearRegression([]);
    expect(emptyResult.b).toBe(NaN);
    expect(emptyResult.m).toBe(NaN);
});

test('returns linear regression cagr', () => {
    expect(() => getLinearRegressionCAGR([], [2])).toThrow(/instance of Date, got 2/);
    expect(
        () => getLinearRegressionCAGR([], [new Date(2024, 0, 2), new Date(2024, 0, 1)]),
    ).toThrow(/to be after the previous.*date Mon Jan 01 2024/);
    const datesAsString = [
        '2024-01-01',
        '2024-01-02',
        '2024-01-03',
        '2024-01-04',
        '2024-01-06',
        '2024-01-08',
        '2024-01-09',
    ];
    const dates = datesAsString.map((item) => new Date(item));
    const result = getLinearRegressionCAGR(createTestData(), dates);
    // Use https://www.statskingdom.com/linear-regression-calculator.html with
    // xValues: 0, 1, 2, 3, 5, 7, 8
    // m = 23.2052, b = 0.07938
    // Date difference is 8 days; end value is therefore 23.84024. 8 days is 0.02191 years
    // CAGR is ((endValue / startValue) ** (1 / years)) - 1 = 2.42866092
    expect(result).toBeCloseTo(2.428);
});

