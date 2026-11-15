# FinTrack - Personal Finance Tracker

FinTrack is a responsive personal finance management application built with HTML, CSS and JavaScript.

It helps users record income and expenses, monitor their financial balance, manage monthly budgets and visualise spending patterns.

## Features

- Record income and expenses.
- Edit and delete transactions.
- Categorise financial transactions.
- Search and filter transaction records.
- Calculate total income, expenses and balance.
- Set and monitor monthly budgets.
- Receive budget overspending warnings.
- Visualise financial information using Chart.js.
- Persist financial records using browser LocalStorage.
- Responsive interface for desktop and mobile devices.

## Technologies

- HTML5
- CSS3
- JavaScript (ES6+)
- Chart.js
- Browser LocalStorage
- Git and GitHub

## Project Structure

```text
project-002-personal-finance-tracker/
│
├── index.html
├── style.css
├── script.js
├── README.md
└── .gitignore
```

## Getting Started

Clone the repository:

```bash
git clone https://github.com/michaelwawiny/personal-finance-tracker.git
```

Enter the project directory:

```bash
cd personal-finance-tracker
```

Start a local server:

```bash
python3 -m http.server 8000
```

Open your browser:

```text
http://localhost:8000
```

## Data Storage

FinTrack uses browser LocalStorage to persist transaction records and budget settings.

Data remains in the browser where it was created. It is not synchronised between devices.

## Future Improvements

- User authentication.
- PostgreSQL database integration.
- Cloud synchronisation.
- Export financial reports.
- Recurring transactions.
- Advanced financial analytics.
- Monthly and annual reports.

## Author

Michael Wawiny

GitHub: https://github.com/michaelwawiny
