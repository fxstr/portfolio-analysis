export default () => {
    const dayInMs = 1000 * 60 * 60 * 24;
    const yearInMs = dayInMs * 365;
    return { dayInMs, yearInMs };
};
