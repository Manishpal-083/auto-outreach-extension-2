// modules/websiteScanner.js

const WebsiteScanner = {

  hasForm() {

    return document.querySelector("form") !== null;

  },

  hasCalendly() {

    return document.querySelector(
      'iframe[src*="calendly.com"]'
    ) !== null;

  },

  wait(ms) {

    return new Promise(resolve => {

      setTimeout(resolve, ms);

    });

  }

};