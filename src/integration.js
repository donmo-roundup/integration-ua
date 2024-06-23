import {
  API_URL,
  TRANSLATIONS_URL,
  INTEGRATION_URL,
  CURRENCIES,
} from './constants'
const donationBlockElements = ['#donmo-donation-box', '#donmo-donation']

function DonmoRoundup({
  publicKey,
  orderId,
  currency, // UAH, EUR, USD
  language = 'en',
  elementId,

  getExistingDonation,
  getGrandTotal,
  addDonationAction,
  removeDonationAction,

  roundupMessage,
  thankMessage,
  integrationTitle,
  errorMessage,
}) {
  const lang = ['en', 'uk'].includes(language) ? language : 'en'
  const currencySymbol = CURRENCIES[currency]

  if (!currencySymbol) {
    throw new Error('Given currency is not supported')
  }

  // -- Constants
  document.getElementById(elementId).style.all = 'initial'

  const shadow = document
    .getElementById(elementId)
    .attachShadow({ mode: 'open' })

  // -- Variables
  let isLoaded = false
  let currentDonation = 0.01
  let isRoundedUp = false
  let contentData = {}

  function setDonation(donationAmount) {
    currentDonation = parseFloat(donationAmount) || 0.01
    shadow.getElementById('donmo-donation').textContent =
      currentDonation.toFixed(2)
  }

  function setCurrencySymbol(currencySymbol) {
    shadow.getElementById('donmo-currency').textContent = currencySymbol
  }

  function setRoundedUp(value) {
    isRoundedUp = value
  }

  function setRoundupButtonText(message) {
    shadow.getElementById('donmo-button-text').textContent = message
  }

  function setRoundupButtonAction() {
    shadow.getElementById('donmo-roundup-button').onclick = () => {
      // If already rounded up, cancel donation on second click
      if (isRoundedUp) {
        shadow
          .getElementById('donmo-roundup-button')
          .style.setProperty('--animation-state', 'loading 2s linear infinite')

        removeDonation()
      }

      // Otherwise, create donation on click
      else {
        // Loading border animation
        shadow
          .getElementById('donmo-roundup-button')
          .style.setProperty('--animation-state', 'loading 2s linear infinite')

        createDonation().finally(() =>
          // Disable loading animation
          shadow
            .getElementById('donmo-roundup-button')
            .style.setProperty('--animation-state', 'none')
        )
      }
    }
  }

  function clearView() {
    setRoundupButtonText(contentData.roundupMessage)

    shadow
      .getElementById('donmo-button-checkmark')
      .style.setProperty('--check-animation', 'none')

    shadow
      .getElementById('donmo-donation-checkmark')
      .style.setProperty('--check-animation', 'none')

    donationBlockElements.forEach((id) => {
      shadow.querySelector(id).style = `
                    background-color: transparent;
                    color: #000;
                    `
    })
    shadow.getElementById('donmo-roundup-button').style = 'cursor: pointer;'
    shadow.getElementById('donmo-roundup-button').removeAttribute('title')

    shadow.getElementById('donmo-roundup-button').disabled = false
  }

  function setErrorView() {
    // Show error
    setRoundupButtonText(contentData.errorMessage)

    // Go back to normal view in 2.5s
    setTimeout(() => {
      clearView()
      setDonation(currentDonation)
    }, 2500)
  }

  function setSuccessRoundupView() {
    // Set checkmarks after donation is created
    shadow
      .getElementById('donmo-button-checkmark')
      .style.setProperty('--check-animation', 'checkmark 0.7s forwards')

    shadow
      .getElementById('donmo-donation-checkmark')
      .style.setProperty('--check-animation', 'checkmark 0.7s forwards')

    // Set green input after donation is created
    donationBlockElements.forEach((id) => {
      shadow.querySelector(id).style = `
         background-color: #c7f5eb;
         color: #0e8161;
         `
    })

    // Set thank you message
    setRoundupButtonText(contentData.thankMessage)

    shadow.getElementById('donmo-roundup-button').title =
      contentData.cancelDonationMessage
  }

  async function setContentData(customData) {
    // fetch default data for given language
    const translationsResponse = await fetch(TRANSLATIONS_URL)
    const translations = await translationsResponse.json()

    contentData = translations[lang]
    // fill content data with custom data
    for (const key in contentData) {
      if (customData[key]) {
        contentData[key] = customData[key]
      }
    }
  }

  function setContent() {
    shadow.getElementById('contribution-message').innerText =
      contentData.contributionMessage

    shadow.getElementById('funds-title').innerText = contentData.funds.title

  

    shadow.getElementById('with-love-message').innerText = contentData.withLove

    shadow.getElementById('donmo-roundup-heading').innerText =
      contentData.integrationTitle
  }

  // Donations operations

  async function calculateDonation(orderAmount) {
    const res = await fetch(
      `${API_URL}/donation/calculate?orderAmount=${orderAmount}`,
      {
        headers: {
          pk: publicKey,
        },
      }
    )
    const { donationAmount } = await res.json()

    return donationAmount
  }

  async function createDonation() {
    try {
      const donationDoc = {
        donationAmount: currentDonation,
        orderId,
        currency,
      }

      await addDonationAction(donationDoc)
      setRoundedUp(true)
      setSuccessRoundupView()
    } catch (err) {
      setErrorView()
    }
  }

  async function removeDonation() {
    try {
      await removeDonationAction()

      setRoundedUp(false)
      clearView()
    } catch (err) {
      setErrorView()
    }
  }

  // Integration logic

  // triggered on first load and every grandTotal change
  async function refresh() {
    if (isLoaded) {
      const existingDonation = getExistingDonation() || 0
      const orderAmount = getGrandTotal()

      if (!existingDonation) {
        const calculatedDonation = await calculateDonation(orderAmount)

        setRoundedUp(false)
        clearView()
        setDonation(calculatedDonation)
        setCurrencySymbol(currencySymbol)
      }

      if (existingDonation) {
        const calculatedDonation = await calculateDonation(
          orderAmount - existingDonation
        )

        // Compare if the existing donation is the right one or needs to be recalculated

        // If yes - it's already rounded up successfully
        if (calculatedDonation === existingDonation) {
          setDonation(existingDonation)
          setCurrencySymbol(currencySymbol)
          setSuccessRoundupView()
          setRoundedUp(true)
        }
        // If no - clean the existing donation and propose the new one
        else {
          await removeDonation()
          setDonation(calculatedDonation)
        }
      }
    }
  }

  async function build() {
    const response = await fetch(INTEGRATION_URL)

    const html = await response.text()

    const contentNode = document.createElement('div')
    contentNode.insertAdjacentHTML('beforeend', html)
    shadow.appendChild(contentNode)

    await setContentData({
      roundupMessage,
      thankMessage,
      integrationTitle,
      errorMessage,
    })

    setContent()

    setDonation(0.01)

    setRoundupButtonText(contentData.roundupMessage)
    setRoundupButtonAction()

    // Adjust the integration width on start and every next resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          const width = entry.contentBoxSize[0].inlineSize
          // trigger on change of integration width
          if (width) {
            responsiveResize(shadow)
          }
        }
      }
    })

    resizeObserver.observe(shadow.getElementById('integration'))

    isLoaded = true

    await refresh()
  }

  return { build, refresh }
}

function responsiveResize(shadow) {
  const width = shadow.getElementById('integration').scrollWidth

  if (width < 310) {
    shadow.getElementById('logos').style = `flex-wrap: wrap;`
    shadow.querySelector('h4').style = 'white-space: unset;'
  } else {
    shadow.getElementById('logos').style = `flex-wrap: nowrap;`
    shadow.querySelector('h4').style = 'white-space: nowrap;'
  }

  // Align lables and content horizontally
  if (width > 400) {
    shadow
      .querySelectorAll('#donmo-donation-wrapper, #donmo-funds')
      .forEach((el) => {
        el.style = `
      flex-direction: row;
      align-items: center;
      gap: 15px;`
      })
  } else {
    shadow
      .querySelectorAll('#donmo-funds, #donmo-donation-wrapper')
      .forEach((el) => (el.style = 'flex-direction: column;'))
  }

  // Align content horizontally but leave roundup button below
  if (width > 740) {
    shadow.getElementById('donmo-content').style = `
    flex-direction: row;
    gap: 25px;
    `
  } else {
    shadow.getElementById('donmo-content').style = `flex-direction: column;`
  }

  // Align integration horizontally including the roundup button
  if (width > 1000) {
    shadow.querySelector('#integration main').style = `
    display: flex;
    align-items: center;
    gap: 40px;
    `

    shadow.getElementById('donmo-content').style.flexBasis = '60%'
    shadow.getElementById('donmo-content').style.marginBottom = '0'
  } else {
    shadow.querySelector('#integration main').style = `display: block;`
    shadow.getElementById('donmo-content').style.marginBottom = '1.3em'
  }
}

export default DonmoRoundup
