/**
 * Divides data provided into windows that may or may not overlap.
 * @param {{ date: Date, value: Number }[]} data
 * @param {Number} windowSizeInMs - length of window
 * @param {Number?} overlapInMs - overlap of window. If you have 24 months of data and use window
 * size of 1 year and an overlap of 3 months, you'll get 3 windows. Overlap is counted from the
 * end of the previous window. Defaults to 0.
 * - month 0–12
 * - month 9–21
 * - month 18–24
 * @returns {{ date: Date, value: Number}[][]}
 */
export default (data, windowSizeInMs, overlapInMs = 0) => {
    const dataIsArray = Array.isArray(data);
    const dataHasValidValues = dataIsArray && data.every((item) => (
        typeof item.value === 'number' && item.date instanceof Date
    ));
    if (!dataIsArray || !dataHasValidValues) {
        throw new Error(`Argument data must be an array of objects, each with properties date {Date} and value {Number}; got ${JSON.stringify(data)} instead.`);
    }
    if (typeof windowSizeInMs !== 'number' || windowSizeInMs <= 0) {
        throw new Error(`Window size must be a positive number, got ${windowSizeInMs} instead.`);
    }
    if (overlapInMs >= windowSizeInMs) {
        throw new Error(`Overlap must be smaller than window size; got overlap ${overlapInMs} and window size ${windowSizeInMs}.`);
    }
    const startTime = data.at(0).date.getTime();
    const timeSeriesDuration = data.at(-1).date.getTime() - startTime;
    // How long is the non-overlapping part of a segment?
    const segmentBaseLength = windowSizeInMs - overlapInMs;
    const amountOfWindows = Math.ceil(timeSeriesDuration / segmentBaseLength);
    return Array.from({ length: amountOfWindows }, (value, index) => {
        const start = index * segmentBaseLength;
        const end = start + windowSizeInMs;
        return data.filter((item) => item.date.getTime() - startTime >= start
            && item.date.getTime() - startTime < end);
    });
};
