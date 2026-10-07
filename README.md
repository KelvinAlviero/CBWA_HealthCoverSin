# HC_QuoteSystem

HC_QuoteSystem is a browser-based health cover quote application. It lets users create, view, edit, and delete quotes while calculating hospital cover, extras cover, family fees, annual discounts, and applicant-level Lifetime Health Cover (LHC) loading.

## Features

- Create, view, edit, and delete health cover quotes
- Single, Couple, and Family cover options
- Applicant-specific age and hospital cover history
- Hospital and extras cover level selection
- Monthly and yearly payment options
- Annual discount of up to 10%
- Applicant-level LHC loading percentages
- Live quote preview and saved quote detail view
- SQLite persistence with automatic table creation
- Shared validation and pricing logic between the browser and server

## Requirements

- **Node.js 22 LTS** recommended
- **npm** included with Node.js
- Internet access is required when the browser loads React from the public CDN

The project uses `better-sqlite3`, which is more reliable with Node.js 22 than newer Node.js releases. If the application fails to start with a native-module compilation error, make sure Node.js 22 is active.

## Install

1. Open a terminal in the project folder.
2. Confirm the Node.js version:

   ```bash
   node --version
   npm --version
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

   This creates the `node_modules` folder and installs Express, better-sqlite3, and the project dependencies.

## Run the application

Start the server:

```bash
npm start
```

The application will be available at:

```text
http://localhost:3000
```

The server serves the React interface from `public/` and exposes REST API endpoints.

To run the server automatically whenever a source file changes:

```bash
npm run dev
```

To use a different port:

```bash
PORT=3001 npm start
```

Then open:

```text
http://localhost:3001
```

## Create a quote

1. Open http://localhost:3000.
2. Select **Create quote**.
3. Enter the customer name and cover type.
4. Add each applicant's date of birth and hospital cover history.
5. Select hospital cover, extras cover, payment frequency, and annual discount.
6. Select **Save quote**.
7. Open the quote from the list to review the premium breakdown and applicant-level LHC loading.

## SQLite database

The database is created automatically at:

```text
data/quotes.sqlite
```

You can override the location with the `DATABASE_PATH` environment variable:

```bash
DATABASE_PATH=/path/to/quotes.sqlite npm start
```

The database directory is created automatically when necessary.

## API

The application exposes these endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/quotes` | List all saved quotes |
| `GET` | `/api/quotes/:id` | Get one saved quote |
| `POST` | `/api/quotes` | Create a quote |
| `PUT` | `/api/quotes/:id` | Update a quote |
| `DELETE` | `/api/quotes/:id` | Delete a quote |
| `GET` | `/api/calculator/preview` | Calculate a quote preview |

Example calculator request:

```bash
curl "http://localhost:3000/api/calculator/preview?customerName=Alex&coverType=Single&applicant1Age=01/01/1980&applicant1History=No&hospitalCoverLevel=Gold&extraCoverLevel=None&paymentFrequency=Monthly&annualDiscountPct=0"
```

## Testing

Run the complete automated test suite:

```bash
npm test
```

Run JavaScript syntax checks:

```bash
npm run check
```

## Useful Node.js commands

If Node.js 22 is not being used, select it before installing dependencies:

```bash
nvm use 22
npm install
npm start
```

If port 3000 is already in use, stop the process using that port or start the application on another port:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
PORT=3001 npm start
```

On Windows, use the equivalent process manager or choose a free port.

## Project structure

```text
.
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── src/
│   ├── database.js
│   ├── quote-calculation.js
│   └── quote-validation.js
├── tests/
│   ├── quote-calculation.test.js
│   └── quote-validation.test.js
├── data/
│   └── quotes.sqlite
├── package.json
├── package-lock.json
└── server.js
```

## Notes

- Prices are calculated in Australian dollars.
- LHC loading applies only to hospital cover and only when an applicant has no prior cover and is over 30.
- The application calculates the loading percentage using the applicant's age and cover history, while keeping the underlying loading ratio for premium calculations.
- The SQLite database persists quotes between server restarts.
