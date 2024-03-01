import { linearRegression, standardDeviation } from 'simple-statistics'

const dayInMs = 1000 * 60 * 60 * 24;
const yearInMs = dayInMs * 365;

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
const ensureArray = (data, type = 'number') => {
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
 * Returns the maximum relative drawdown, e.g. -0.17 for a 17% drawdown
 * @param {Number[]} data 
 * @returns {Number}
 */
const getMaxRelativeDrawdown = (data) => (
    Math.min(...getRelativeDrawdownAsSeries(data))
);

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
 * Returns compound annual growth rate ((endValue / startValue) ** (1 / years)) - 1 where a
 * year is assumed to have 365 days. See https://www.investopedia.com/terms/c/cagr.asp
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
    const diffInYears = (endDate.getTime() - startDate.getTime()) / yearInMs;
    return ensureArray(data) && ((data.at(-1) / data.at(0)) ** (1 / diffInYears) - 1);
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

/**
 * Returns the standard deviation of the data set
 * @param {Number} data 
 * @returns {Number}
 */
const getStandardDeviation = (data) => (
    standardDeviation(ensureArray(data))
);

/**
 * Returns the sharpe ration of the data set
 * @param {Number[]} data 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {Number}
 */
const getSharpe = (data, startDate, endDate) => (
    getCAGR(data, startDate, endDate) / getStandardDeviation(data)
);

/**
 * Returns data as a 1-based series (the first entry is 1, all following entries have the same
 * relative difference as the original series)
 * @param {Number[]} data 
 * @returns {Number[]}
 */
const getNormalizedAsSeries = (data) => (
    ensureArray(data).map(item => item / data[0])
);

/**
 * Returns linear regression for a dataset, consisting of slope m and intersect b. Uses
 * http://simple-statistics.github.io/docs/#linearregression.
 * @param {Number[]} data
 * @param {Number[]?} xValues       x values; if not provided, integers starting at 0
 *                                  up will be used
 * @returns {m: Number, b: Number}
 */
const getLinearRegression = (yValues, xValues) => {
    if (xValues && xValues.length !== yValues.length) {
        throw new Error(`If the xValues are provided for getLinearRegression, they must be an array with the same amout of items as yValues; xValues.length is ${xValues.length}, yValues.length is ${yValues.length}.`);
    }
    return linearRegression(
        ensureArray(yValues).map((value, index) => [xValues ? xValues[index] : index, value]),
    )
};

/**
 * Returns the CAGR based on a linear regression of the data provided; the serie's first value
 * is m, the last value equals m + b * diff where diff is the amount of time between the first
 * and last value of data.
 * @param {Number[]} data
 * @param {Date[]} dates
 * @returns {Number}            CAGR for linear regression, e.g. 0.02 for 2%
 */
const getLinearRegressionCAGR = (data, dates) => {
    // Convert dates to indices; count index up by the amount of dates that lies between the
    // current and the previous date
    const invalidDate = dates.find((item) => !(item instanceof Date));
    if(invalidDate) {
        throw new Error(`Expects every item of dates to be an instance of Date, got ${invalidDate} in ${dates}.`);
    }
    const mixedUpDate = dates.find((item, index) => (
        index !== 0 && item.getTime() <= dates.at(index - 1).getTime()
    ));
    if (mixedUpDate) {
        throw new Error(`Expects every item of dates to be after the previous item; date ${mixedUpDate} does not follow that rule.`)
    }
    const xValues = ensureArray(dates, 'object')
        .map((item, index) => index === 0 ? 0 : item.getTime() - dates.at(index - 1).getTime())
        .map((item) => Math.round(item / dayInMs))
        .reduce((previous, item) => (
            [...previous, previous.length === 0 ? 0 : previous.at(-1) + item]
        ), []);
    const { m, b } = getLinearRegression(data, xValues);
    const endValue = b + m * Math.max(...xValues);
    return getCAGR([b, endValue], dates.at(0), dates.at(-1));
};


export {
    ensureArray,
    getMaxAsSeries,
    getRelativeDrawdownAsSeries,
    getMaxRelativeDrawdown,
    getRelativeChangeAsSeries,
    getAverage,
    getRelativeTimeInMarket,
    getCAGR,
    getStandardDeviation,
    getCalmar,
    getSortino,
    getSharpe,
    getNormalizedAsSeries,
    getLinearRegression,
    getLinearRegressionCAGR,
};