# Intro

Tools and statistics to analyze a portfolio's quality, e.g. CAGR, Sortino, Drawdowns, Sharpe 
and Calmar.

Comes without dependencies.

# Usage

Installation:
```
npm i -S portfolio-analysis
````

Usage:
````
import { getSortino } from 'portfolio-analysis';

const sortino = getSortino([25.2, 25.1, 25.7, 25.3]);
```

# Available Stats

For now: See `main.mjs` and `main.test.mjs`.