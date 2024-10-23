/**
 * Ensures that an array is passed and optionally that every member is of the given type. Throws
 * if expectation is not met.
 * @param {array} data
 * @param {string?} type    Type to check for by comparing it to `typeof item`; defaults to
 *                          'number'
 * @returns {array}         Original array
 * @throws                  An error if anything else than an array is passed or the type
 *                          requirements are not met
 */
export default (data, type = 'number') => {
    if (!Array.isArray(data)) {
        throw new Error(`Expected parameter to be an array, got ${data} instead.`);
    }
    if (type) {
        // eslint-disable-next-line valid-typeof
        const invalidItems = data.filter((item) => typeof item !== type);
        if (invalidItems.length) {
            throw new Error(`Expected every item of array to be of type ${type}, got items ${invalidItems.join(', ')} with types ${invalidItems.map((item) => typeof item).join(', ')} instead.`);
        }
    }
    return data;
};
