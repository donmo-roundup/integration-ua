const constants = {
  production: {
    API_URL: 'https://api.donmo.org/v1',
    TRANSLATIONS_URL: 'https://static.donmo.org/translations.json',
    INTEGRATION_URL: 'https://static.donmo.org/integration.html',
    CURRENCIES: {
      UAH: '₴',
      EUR: '€',
      USD: '$',
    },
  },
  development: {
    API_URL: 'http://localhost:5000/v1',
    TRANSLATIONS_URL: 'http://localhost:4001/static/translations.json',
    INTEGRATION_URL: 'http://localhost:4001/static/integration.html',
    CURRENCIES: {
      UAH: '₴',
      EUR: '€',
      USD: '$',
    },
  },
}

module.exports = constants[process.env.NODE_ENV]
