/**
 * Ensures that an array is passed and optionally that every member is of the given type. Throws
 * if expectation is not met.
 * @param {array} data 
 * @param {*} type          Type to check for by comparing it to `typeof item`.
 * @returns {array}         Original array
 * @throws                  An error if anything else than an array is passed or the type
 *                          requirements are not met
 */
const ensureArray = (data, type) => {
    if (!Array.isArray(data)) {
        throw new Error(`Expected parameter to be an array, got ${data} instead.`);
    }
    if (type) {
        const invalidItems = data.filter((item) => typeof item !== type);
        if (invalidItems.length) {
            throw new Error(`Expected every item of array to be of type ${type}, got items ${invalidItems.join(', ')} with types ${invalidItems.map((item) => typeof item).join(', ')} instead.`);
        }
    }
    return data;
};

/**
 * Returns the maximum value of all previous and the current item as an array.
 * @param {Number[]} data 
 * @returns {Number[]}
 */
const getMaxAsSeries = (data) => (
    ensureArray(data, 'number').reduce((prev, item) => (
        [...prev, Math.max((prev.at(-1) ?? -Infinity), item)]
    ), [])
);

/**
 * Returns the relative drawdown for a an array as an array; drawdowns are always ≤ 0.
 * @param {Number[]} data 
 * @returns {Number[]}
 */
const getRelativeDrawdownAsSeries = (data) => {
    const max = getMaxAsSeries(ensureArray(data, 'number'));
    return data.map((item, index) => (item / max[index]) - 1);
};

/**
 * Returns the relative change from the current to the previous item.
 * @param {Number[]} data 
 * @returns {Number[]}
 */
const getRelativeChangeAsSeries = (data) => (
    ensureArray(data, 'number')
        .map((item, index) => (item / data[index - 1]) - 1)
);

/**
 * Returns the average of a series.
 * @param {Number[]} data 
 * @returns {Number}
 */
const getAverage = (data) => (
    ensureArray(data, 'number').reduce((sum, item) => sum + item) / data.length
);

/**
 * Returns relative time in market. We assume that unchanged values indicate that at this moment,
 * we were *not* in the market. The first entry in data is ignored as we do not know if it
 * changed compared to the previous (inexisting) entry; if we pass 6 values, 2 of which are
 * unchanged (e.g. 5, 3, 3, 4, 4, 5), the returned value will be 3 / 5 or 0.6.
 * @param {Number[]} data
 * @returns {Number}
 */
const getRelativeTimeInMarket = (data) => (
    // Ignore first entry in array because its relative change is NaN and we just don't know if we
    // were in the market on that date or not
    1 - (getRelativeChangeAsSeries(data).filter((item) => item === 0).length /
        (ensureArray(data).length - 1))
);

/**
 * Returns compound annual growth rate ((endValue - startValue) ** (1 / years)) - 1 where a
 * year is assumed to have 365 days.
 * @param {Number[]} data 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {Number}
 */
const getCAGR = (data, startDate, endDate) => {
    [[startDate, 'startDate'], [endDate, 'endDate']].forEach(([date, name]) => {
        if (!(date instanceof Date)) {
            throw new Error(`Parameter ${name} must be an instance of Date, is ${date} instead.`);
        }
    });
    if (startDate.getTime() >= endDate.getTime()) {
        throw new Error(`Parameter startDate (${startDate}) must lie before endDate (${endDate}).`);
    }
    const yearInMs = 1000 * 60 * 60 * 24 * 365;
    const diffInYears = (endDate.getTime() - startDate.getTime()) / yearInMs;
    return ensureArray(data, 'number') && ((data.at(-1) / data.at(0)) ** (1 / diffInYears) - 1);
};

/**
 * Returns calmar ratio (CAGR / max drawdown)
 * @param {Number[]} data 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {Number}
 */
const getCalmar = (data, startDate, endDate) => ( 
    getCAGR(data, startDate, endDate) / Math.max(...getRelativeDrawdownAsSeries(data).map(Math.abs))
);

/**
 * Returns the sortino ratio, according to calculations outlined by
 * http://www.redrockcapital.com/Sortino__A__Sharper__Ratio_Red_Rock_Capital.pdf
 * @param {Number[]} data
 * @returns {Number}
 */
const getSortino = (data) => {
    const returns = getRelativeChangeAsSeries(data);
    const downs = returns
        // Get rid of that first NaN
        .slice(1)
        .filter((item) => item < 0);
    const downsideSum = downs
        .map((item) => item ** 2)
        .reduce((sum, item) => sum + item);
    // Ignore first entry as its change is NaN
    const downside = Math.sqrt(downsideSum / downs.length);
    return getAverage(getRelativeChangeAsSeries(data).slice(1)) / downside;
}


export {
    ensureArray,
    getMaxAsSeries,
    getRelativeDrawdownAsSeries,
    getRelativeChangeAsSeries,
    getAverage,
    getRelativeTimeInMarket,
    getCAGR,
    getCalmar,
    getSortino,
};