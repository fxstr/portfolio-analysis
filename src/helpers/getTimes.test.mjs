import getTimes from './getTimes.mjs';
/* global test, expect */

test('returns correct times', () => {
    const { dayInMs, yearInMs } = getTimes();
    expect(dayInMs).toBe(86400000);
    expect(yearInMs).toBe(31536000000);
});
