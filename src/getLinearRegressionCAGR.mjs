import { SimpleLinearRegression } from 'ml-regression-simple-linear';
import ensureArray from './helpers/ensureArray.mjs';
import getTimes from './helpers/getTimes.mjs';
import getWindows from './getWindows.mjs';

const { yearInMs } = getTimes();

/**
 * Returns the CAGR based on a linear regression of the data provided; the serie's first value
 * is m, the last value equals m + b * diff where diff is the amount of time between the first
 * and last value of data.
 * Returns 0.05 for a CAGR of 5%.
 * @param {Number[]} data
 * @param {Date[]} dates
 * @returns {Number}            CAGR for linear regression, e.g. 0.02 for 2%
 */
export default (data, dates) => {
    if (ensureArray(data, false).length !== ensureArray(dates, false).length) {
        throw new Error(`Length of data (${data.length}) must match length of dates (${dates.length}).`);
    }
    // getWindows needs merged data
    const mergedData = data.map((item, index) => ({ value: item, date: dates[index] }));
    const windows = getWindows(mergedData, yearInMs, yearInMs / 2);
    const growthRates = windows.map((window) => {
        // Use 1 year as 1 x axis unit. (it simplifies all calculations, as slope equals CAGR)
        const xValues = window.map(({ date }) => (
            (date.getTime() - window.at(0).date.getTime()) / yearInMs
        ));
        const yValues = window.map(({ value }) => value);
        const { slope, intercept } = new SimpleLinearRegression(xValues, yValues);
        return (intercept + slope) / intercept;
    });
    // If there's only 1 value per window, its growth rate is NaN; filter it out
    const validGrowthRates = growthRates
        .filter((rate) => !Number.isNaN(rate))
        // A change of 1.05 should be displayed as 5% later; remove 1
        .map((rate) => rate - 1)
        // Account for the length of a window (if one is < 1 year)
        .map((rate, index) => ({
            rate,
            partOfYear: (windows[index].at(-1).date.getTime()
                - windows[index].at(0).date.getTime()) / yearInMs,
        }));
    const amountOfYears = validGrowthRates.reduce((sum, current) => (sum + current.partOfYear), 0);
    // Return average of all slopes; account for the length of the data behind the slope
    return validGrowthRates.reduce((sum, current) => (
        sum + (current.rate * current.partOfYear)
    ), 0) / amountOfYears;
};
