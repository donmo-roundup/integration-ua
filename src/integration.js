import { API_URL, TRANSLATIONS_URL, INTEGRATION_URL } from './constants'

class DonmoRoundup {
  #API_URL = API_URL
  #TRANSLATIONS_URL = TRANSLATIONS_URL
  // Required functions from store
  #getExistingDonation
  #getGrandTotal
  #addDonationAction
  #removeDonationAction

  // Custom data from store
  #publicKey
  #isBackendBased
  #orderId
  #width

  #contentData = {}
  #language
  // Integration internal values

  // -- Constants
  #shadow
  #resizeObserver
  #donationBlockElements = ['#donmo-donation-box', '#donmo-donation']

  // -- Variables
  #isLoaded = false
  #currentDonation
  #isRoundedUp = false

  #setIsRoundedUp(value) {
    this.#isRoundedUp = value
  }

  // Layout manipulations

  async #setDefaultContentData() {
    const translationsResponse = await fetch(this.#TRANSLATIONS_URL)
    const translations = await translationsResponse.json()
    const defaultData =
      this.#language && translations[this.#language]
        ? translations[this.#language]
        : translations.en

    for (const key in defaultData) {
      if (!this.#contentData[key]) {
        this.#contentData[key] = defaultData[key]
      }
    }
  }

  #setDefaultContent() {
    this.#shadow.getElementById('contribution-message').innerText =
      this.#contentData.contributionMessage

    this.#shadow.getElementById('funds-title').innerText =
      this.#contentData.funds.title

    this.#shadow.getElementById('prytula-fund-logo').title =
      this.#contentData.funds.prytulaFund

    this.#shadow.getElementById('come-back-alive-logo').title =
      this.#contentData.funds.comeBackAlive

    this.#shadow.getElementById('united24-logo').title =
      this.#contentData.funds.united24

    this.#shadow.getElementById('with-love-message').innerText =
      this.#contentData.withLove

    this.#shadow.getElementById('donmo-roundup-heading').innerText =
      this.#contentData.integrationTitle
  }

  #setDonation(donationAmount) {
    this.#currentDonation = donationAmount || 0.01
    this.#shadow.getElementById('donmo-donation').textContent = (
      donationAmount || 0.01
    ).toFixed(2)
  }

  #setRoundupButtonText(msg) {
    this.#shadow.getElementById('donmo-button-text').textContent = msg
  }

  #setSuccessRoundupView() {
    // Set checkmarks after donation is created
    this.#shadow
      .getElementById('donmo-button-checkmark')
      .style.setProperty('--check-animation', 'checkmark 0.7s forwards')

    this.#shadow
      .getElementById('donmo-donation-checkmark')
      .style.setProperty('--check-animation', 'checkmark 0.7s forwards')

    // Set green input after donation is created
    this.#donationBlockElements.forEach((id) => {
      this.#shadow.querySelector(id).style = `
         background-color: #c7f5eb;
         color: #0e8161;
         `
    })

    // Set thank you message
    this.#setRoundupButtonText(this.#contentData.thankMessage)

    this.#shadow.getElementById('donmo-roundup-button').title =
      this.#contentData.cancelDonationMessage
  }

  #setErrorView() {
    // Show error
    this.#setRoundupButtonText(this.#contentData.errorMessage)

    // Go back to normal view in 2.5s
    setTimeout(() => {
      this.#setClearView()
      this.#setDonation(this.#currentDonation)
    }, 2500)
  }

  #setClearView() {
    this.#setRoundupButtonText(this.#contentData.roundupMessage)

    this.#shadow
      .getElementById('donmo-button-checkmark')
      .style.setProperty('--check-animation', 'none')

    this.#shadow
      .getElementById('donmo-donation-checkmark')
      .style.setProperty('--check-animation', 'none')

    this.#donationBlockElements.forEach((id) => {
      this.#shadow.querySelector(id).style = `
                    background-color: transparent;
                    color: #000;
                    `
    })
    this.#shadow.getElementById('donmo-roundup-button').style =
      'cursor: pointer;'
    this.#shadow.getElementById('donmo-roundup-button').removeAttribute('title')

    this.#shadow.getElementById('donmo-roundup-button').disabled = false
  }

  #responsiveResize() {
    const width = this.#shadow.getElementById('integration').scrollWidth

    if (width < 310) {
      this.#shadow.getElementById('logos').style = `flex-wrap: wrap;`
      this.#shadow.querySelector('h4').style = 'white-space: unset;'
    } else {
      this.#shadow.getElementById('logos').style = `flex-wrap: nowrap;`
      this.#shadow.querySelector('h4').style = 'white-space: nowrap;'
    }

    // Align lables and content horizontally
    if (width > 400) {
      this.#shadow
        .querySelectorAll('#donmo-donation-wrapper, #donmo-funds')
        .forEach((el) => {
          el.style = `
        flex-direction: row;
        align-items: center;
        gap: 15px;`
        })
    } else {
      this.#shadow
        .querySelectorAll('#donmo-funds, #donmo-donation-wrapper')
        .forEach((el) => (el.style = 'flex-direction: column;'))
    }

    // Align content horizontally but leave roundup button below
    if (width > 740) {
      this.#shadow.getElementById('donmo-content').style = `
      flex-direction: row;
      gap: 40px;
      `
    } else {
      this.#shadow.getElementById(
        'donmo-content'
      ).style = `flex-direction: column;`
    }

    // Align integration horizontally including the roundup button
    if (width > 1000) {
      this.#shadow.querySelector('#integration main').style = `
      display: flex;
      align-items: center;
      gap: 40px;
      `

      this.#shadow.getElementById('donmo-content').style.flexBasis = '60%'
      this.#shadow.getElementById('donmo-content').style.marginBottom = '0'
    } else {
      this.#shadow.querySelector('#integration main').style = `display: block;`
      this.#shadow.getElementById('donmo-content').style.marginBottom = '1.3em'
    }
  }

  #disableRoundupButton() {
    this.#shadow.getElementById('donmo-roundup-button').disabled = true
  }
  #enableRoundupButton() {
    this.#shadow.getElementById('donmo-roundup-button').disabled = false
  }

  // Donation operations
  async #calculateDonation(orderAmount) {
    const res = await fetch(
      `${this.#API_URL}/calculate?orderAmount=${orderAmount}`,
      {
        headers: {
          pk: this.#publicKey,
        },
      }
    )
    const { donationAmount } = await res.json()

    return donationAmount
  }

  async #checkDonationAmount() {
    // Fetch (possibly) existing donation by orderId
    const donationResponse = await fetch(
      `${this.#API_URL}/check/${this.#orderId}`,
      {
        headers: {
          pk: this.#publicKey,
        },
      }
    )
    const {
      data: { donationAmount },
    } = await donationResponse.json()
    return donationAmount || null
  }

  async #createDonation() {
    try {
      // If not backend-based, create donation on fly
      if (!this.#isBackendBased) {
        // Donation payload
        const donationDoc = {
          donationAmount: parseFloat(this.#currentDonation),
          orderId: this.#orderId,
        }

        // Create donation request
        const result = await fetch(this.#API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            pk: this.#publicKey,
          },
          body: JSON.stringify(donationDoc),
        })
        const response = await result.json()

        if (!response || response.status !== 200) throw Error
      }

      // Call addDonation callback provided by the store
      await this.#addDonationAction({
        orderId: this.#orderId,
        donationAmount: parseFloat(this.#currentDonation),
      })

      this.#setIsRoundedUp(true)
      this.#setSuccessRoundupView()
    } catch (err) {
      this.#setErrorView()
    }
  }

  async #removeDonation() {
    try {
      // Cancel donation on the fly if not backend-based
      if (!this.#isBackendBased) {
        const result = await fetch(`${this.#API_URL}/cancel/${this.#orderId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            pk: this.#publicKey,
          },
        })

        const response = await result.json()
        if (!response || response.status !== 200) throw Error
      }

      await this.#removeDonationAction()

      this.#setIsRoundedUp(false)
      this.#setClearView()
    } catch (err) {
      this.#setErrorView()
    }
  }

  // Integration logic
  async #initialize() {
    // Initialize shadow
    document.getElementById('donmo-roundup').style.all = 'initial'
    this.#shadow = document
      .getElementById('donmo-roundup')
      .attachShadow({ mode: 'open' })

    // Fetch integration

    const response = await fetch(INTEGRATION_URL)

    const html = await response.text()

    const contentNode = document.createElement('div')
    contentNode.insertAdjacentHTML('beforeend', html)
    this.#shadow.appendChild(contentNode)

    this.#setDefaultContent()

    this.#setDonation(0.01)

    this.#setRoundupButtonText(this.#contentData.roundupMessage)

    // Adjust the integration width on start and every next resize
    this.#resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          const width = entry.contentBoxSize[0].inlineSize
          // trigger on change of integration width
          if (width) {
            this.#responsiveResize()
          }
        }
      }
    })

    this.#resizeObserver.observe(this.#shadow.getElementById('integration'))
  }

  async #syncWithBackend() {
    this.#disableRoundupButton()
    const existingDonation = this.#getExistingDonation()
    const backendDonation = await this.#checkDonationAmount()
    // Improbable but possible discrepancy fix

    // existingDonation is empty but backendDonation exists => remove backendDonation
    if (!existingDonation && backendDonation) {
      this.#removeDonation()
    }

    // existingDonation exists but is different from backendDonation => create backendDonation
    if (existingDonation && existingDonation !== backendDonation) {
      this.#setDonation(existingDonation)
      this.#createDonation()
    }
    this.#enableRoundupButton()
  }

  // triggered on first load and every grandTotal change
  async refresh() {
    if (this.#isLoaded) {
      const existingDonation = this.#getExistingDonation()
      const orderAmount = this.#getGrandTotal()

      if (!existingDonation) {
        const calculatedDonation = await this.#calculateDonation(orderAmount)
        this.#setDonation(calculatedDonation)
        this.#setIsRoundedUp(false)
      }

      if (existingDonation) {
        const calculatedDonation = await this.#calculateDonation(
          orderAmount - existingDonation
        )

        // Compare if the existing donation is the right one or needs to be recalculated

        // If yes - it's already rounded up successfully!
        if (calculatedDonation === existingDonation) {
          this.#setDonation(existingDonation)
          this.#setSuccessRoundupView()
          this.#setIsRoundedUp(true)
        }
        // If no - clean the existing donation and propose the new one
        else {
          await this.#removeDonation()
          this.#setDonation(calculatedDonation)
        }
      }

      if (!this.#isBackendBased) {
        // Resolve backend discrepancy if there is such one (improbable but important!)
        await this.#syncWithBackend()
      }
    }
  }

  async build({
    publicKey,
    orderId,

    getExistingDonation,
    getGrandTotal,
    addDonationAction,
    removeDonationAction,

    roundupMessage,
    thankMessage,
    integrationTitle,
    errorMessage,

    width,
    language = 'uk',
    isBackendBased = false,
  }) {
    try {
      // Initialize the commands
      this.#getExistingDonation = () => {
        const donation = parseFloat(getExistingDonation())
        return donation || 0
      }
      this.#getGrandTotal = getGrandTotal
      this.#addDonationAction = addDonationAction
      this.#removeDonationAction = removeDonationAction

      // Initialize the variables
      this.#publicKey = publicKey
      this.#isBackendBased = isBackendBased

      this.#width = width
      this.#orderId = orderId

      this.#language = language

      this.#contentData.roundupMessage = roundupMessage
      this.#contentData.thankMessage = thankMessage
      this.#contentData.integrationTitle = integrationTitle
      this.#contentData.errorMessage = errorMessage

      await this.#setDefaultContentData()

      // Initialize the integration
      await this.#initialize()
      this.#isLoaded = true

      // Refresh the integration - sets correct donationAmount
      await this.refresh()

      // Main button handler (!)
      this.#shadow.getElementById('donmo-roundup-button').onclick = () => {
        // If already roundedUp, cancel donation on second click
        if (this.#isRoundedUp) {
          this.#shadow
            .getElementById('donmo-roundup-button')
            .style.setProperty(
              '--animation-state',
              'loading 2s linear infinite'
            )

          this.#removeDonation()
        }

        // Otherwise, create donation on click
        else {
          // Loading border animation
          this.#shadow
            .getElementById('donmo-roundup-button')
            .style.setProperty(
              '--animation-state',
              'loading 2s linear infinite'
            )

          this.#createDonation().finally(() =>
            // Disable loading animation
            this.#shadow
              .getElementById('donmo-roundup-button')
              .style.setProperty('--animation-state', 'none')
          )
        }
      }
    } catch (err) {
      console.log('Donmo integration error', err)
      this.#shadow.getElementById('integration').style.display = 'none'
    }
  }
}

export default DonmoRoundup
