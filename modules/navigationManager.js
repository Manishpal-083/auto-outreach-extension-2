// modules/navigationManager.js

const NavigationManager = {

  keywords: [
    "contact",
    "contact us",
    "contact-us",
    "get in touch",
    "talk to us",
    "support",
    "sales",
    "book demo",
    "demo",
    "enquiry",
    "inquiry"
  ],

  findContactLink() {

    const links = document.querySelectorAll("a");

    for (const link of links) {

      const text = (link.textContent || "")
        .trim()
        .toLowerCase();

      const href = (link.href || "")
        .trim()
        .toLowerCase();

      for (const keyword of this.keywords) {

        if (
          text.includes(keyword) ||
          href.includes(keyword)
        ) {

          return link.href;

        }

      }

    }

    return null;

  }

};