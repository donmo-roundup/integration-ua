const constants = {
  production: {
    API_URL: 'https://api.donmo.org/v1/ua/donations',
    TRANSLATIONS_URL: 'https://static.donmo.org/translations.json',
    INTEGRATION_URL: 'https://static.donmo.org/integration.min.html',
  },
  development: {
    API_URL: 'http://localhost:4000/v1/ua/donations',
    TRANSLATIONS_URL: 'http://localhost:4001/static/translations.json',
    INTEGRATION_URL: 'http://localhost:4001/static/integration.min.html',
  },
}

module.exports = constants[process.env.NODE_ENV]
