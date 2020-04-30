const { Builder, By, Key, until } = require('selenium-webdriver');

// https://www.goodreads.com/book/review_counts.json?key=rfZeIXRcGIywEb6rLWYrA&isbns=1408839970

export class GoodreadsScraper {
  driver: any;

  constructor(public browser: string) {}

  async start(url: string) {
    await this.buildDriver();
    this.getPage(url);
  }

  async buildDriver() {
    console.log('hi');
    this.driver = await new Builder().forBrowser(this.browser).build();
    // console.log(this.driver);
  }

  async getPage(url: string) {
    try {
      await this.driver.get(url);
      this.driver.quit();
    } catch (e) {
      console.log(e);
    }
  }
}
