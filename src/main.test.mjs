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
} from './main.mjs';
import createTestData from './test/createTestData.mjs';

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
    expect(getRelativeDrawdownAsSeries(createTestData()))
        .toEqual([
            0,
            -0.008510638297872353,
            -0.017021276595744594,
            -0.017021276595744594,
            0,
            0,
            -0.012500000000000067,
        ]);
});

test('get max drawdown', () => {
    expect(getMaxRelativeDrawdown(createTestData()))
        .toEqual(-0.017021276595744594);
});

test('get relative change as series', () => {
    expect(getRelativeChangeAsSeries(createTestData()))
        .toEqual([
            Number.NaN,
            -0.008510638297872353,
            -0.008583690987124415,
            0,
            0.030303030303030276,
            0.008403361344537785,
            -0.012500000000000067,
        ]);
});

test('get average', () => {
    expect(getAverage([5, 7, 6])).toBe(6);
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
