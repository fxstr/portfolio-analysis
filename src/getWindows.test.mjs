import getWindows from './getWindows.mjs';
/* global expect, test */

const createData = () => (
    //  Dates vary by seconds
    [
        { date: new Date(2024, 0, 1, 0, 0, 0), value: 1 },
        { date: new Date(2024, 0, 1, 0, 0, 1), value: 1 },
        { date: new Date(2024, 0, 1, 0, 0, 2), value: 1 },
        { date: new Date(2024, 0, 1, 0, 0, 3), value: 1 },
        { date: new Date(2024, 0, 1, 0, 0, 4), value: 1 },
        { date: new Date(2024, 0, 1, 0, 0, 8), value: 1 },
    ]
);

test('fails with invalid arguments', () => {
    // Throws on invalid data
    expect(() => getWindows(5)).toThrow(/array of objects/);
    const invalidDataWindow = () => getWindows([{ date: 7, value: 3 }]);
    expect(invalidDataWindow).toThrow(/array of objects/);

    // Throws on invalid window size
    expect(() => getWindows([], '500')).toThrow(/positive number/);
    expect(() => getWindows([], 0)).toThrow(/positive number/);

    // Throws on overlap
    expect(() => getWindows([], 100, 200)).toThrow(/smaller than window size/);
});

test('returns windows', () => {
    const data = createData();
    const result = getWindows(data, 3000, 1500);
    expect(result).toEqual([
        // 0–3000
        [
            data[0],
            data[1],
            data[2],
        ],
        // 1500–4500
        [
            data[2],
            data[3],
            data[4],
        ],
        // 3000–6000
        [
            data[3],
            data[4],
        ],
        // 4500–7500
        [],
        // 6000–9000
        [
            data[5],
        ],
        // 7500–10500
        [
            data[5],
        ],
    ]);
});

test('overlap defaults to 0', () => {
    const data = createData();
    // Overlap defaults to 0
    const resultWithoutOverlap = getWindows(data, 3000);
    expect(resultWithoutOverlap).toEqual([
        // 0–3000
        [
            data[0],
            data[1],
            data[2],
        ],
        // 3000–6000
        [
            data[3],
            data[4],
        ],
        // 6000–9000
        [
            data[5],
        ],
    ]);
});
