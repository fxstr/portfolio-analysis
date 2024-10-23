import ensureArray from './ensureArray.mjs';
/* global test, expect */

test('ensures array and type', () => {
    expect(() => ensureArray('t')).toThrow('Expected parameter to be an array, got t instead.');
    expect(() => ensureArray([])).not.toThrow();
    expect(() => ensureArray([5, 'y', 7, () => {}], 'number')).toThrow('Expected every item of array to be of type number, got items y, () => {} with types string, function instead.');
    expect(() => ensureArray([2, 3, 4], 'number')).not.toThrow();
});
