import fs from 'fs';
import path from 'path';
import { WebElement, Builder, By } from 'selenium-webdriver';
import { Book } from './Book';
import { Mailer } from './Mailer';

export class GoodreadsScraper {
  driver: any;

  constructor(public browser: string) {}

  async handlePopup(popupCloseBtnCssSelector: string) {
    let closeBtn: WebElement | null = null;
    try {
      closeBtn = await this.driver.findElement(
        By.css(popupCloseBtnCssSelector)
      );
    } catch (err) {
      if (err.name !== 'NoSuchElementError') {
        console.log(err);
      }
    }

    if (closeBtn) {
      await closeBtn.click();
    }
    return;
  }

  async takeErrorScreenshot() {
    const screenshot: Promise<string> = await this.driver.takeScreenshot();
    const filename: string = `error-${new Date()}.png`;
    const filePath = path.join(__dirname, '..', 'error_screenshots', filename);
    fs.writeFileSync(filePath, screenshot, 'base64');

    return { filePath, filename };
  }

  async scrapeShouldReadAtLeastOnceList(url: string) {
    // get list page
    await this.getPage(url);
    const books = await this.getVotedBookList(50);

    this.driver.close();
    // get book details page
    for (let book of books) {
      await this.getPage(book['url']);
      const bookWithDetails = await this.getBookDetails(book);
      console.log(bookWithDetails);
      // TODO: save to db
      this.driver.close();
      break;
    }
    this.driver.quit();
  }

  async buildDriver() {
    this.driver = await new Builder().forBrowser(this.browser).build();
  }

  async getPage(url: string) {
    try {
      await this.buildDriver();
      await this.driver.get(url);
    } catch (err) {
      console.log(err);
      const { filePath, filename } = await this.takeErrorScreenshot();
      new Mailer().sendErrorEmail(
        filePath,
        filename,
        `GoodreadsScraper Error - ${new Date()}`,
        `<img src="cid:gr-err-ss"/><div>Error Message: ${err} </div>`
      );
      this.driver.quit();
    }
  }

  async getVotedBookList(count: number) {
    const books: Book[] = [];

    try {
      const bookInfo: WebElement[] = await this.driver.findElements(
        By.css('#all_votes tr .bookTitle')
      );

      const scores: WebElement[] = await this.driver.findElements(
        By.css('#all_votes .smllText a:first-of-type')
      );

      const votes: WebElement[] = await this.driver.findElements(
        By.css('#all_votes .smallText a:nth-of-type(2)')
      );

      for (let i = 0; i < count; i++) {
        const title: string = await bookInfo[i].getText();
        const url: string = await bookInfo[i].getAttribute('href');

        const idStartIndex: number = url.indexOf('show/') + 5;
        const idEndIndex: number =
          url.slice(idStartIndex).search(/\D/) + idStartIndex;
        const grId: number = Number(url.slice(idStartIndex, idEndIndex));

        const rank: number = i + 1;
        let score: string = await scores[i].getText();
        score = score.replace(/[\D]/g, '');
        let vote: string = await votes[i].getText();
        vote = vote.replace(/[\D]/g, '');

        const book: Book = new Book(title, url, grId);
        book.setRank(rank);
        book.setScores(parseInt(score));
        book.setVotes(parseInt(vote));
        books.push(book);
      }
    } catch (err) {
      console.log(err);
      const { filePath, filename } = await this.takeErrorScreenshot();
      new Mailer().sendErrorEmail(
        filePath,
        filename,
        `GoodreadsScraper Error - ${new Date()}`,
        `<img src="cid:gr-err-ss"/><div>Error Message: ${err} </div>`
      );
    }

    return books;
  }

  async getBookDetails(book: Book) {
    try {
      const ratingDetails: WebElement = await this.driver.findElement(
        By.id('rating_details')
      );
      this.driver.sleep(2000);

      await this.handlePopup('.modal__content > .modal__close > button');
      await ratingDetails.click();

      const ratingsDistributionRows: WebElement[] = await this.driver.findElements(
        By.css('#moreBookData #rating_distribution tr')
      );

      const allEditionsDetails: WebElement[] = await this.driver.findElements(
        By.css(
          '#moreBookData table:nth-of-type(2) tr:first-of-type  > td:nth-of-type(2) span'
        )
      );

      let ratingsDistribution: number[] = [];
      for (let row of ratingsDistributionRows) {
        const rating: WebElement = await row.findElement(
          By.css('td:nth-of-type(2)')
        );
        const ratingStats: string = await rating.getText();
        let ratingCount: number = 0;
        const match: RegExpMatchArray | null = ratingStats.match(/\(([^)]+)\)/);
        if (match) {
          ratingCount = parseInt(match[1]);
          ratingsDistribution.push(ratingCount);
        }
      }

      book.setRatingsDistribution(ratingsDistribution);
      const averageRating = await allEditionsDetails[0].getText();
      const allRatingsCount = await allEditionsDetails[1].getText();
      const allReviewsCount = await allEditionsDetails[2].getText();
      const toReadCount = await allEditionsDetails[4].getText();

      book.setAverageRating(parseFloat(averageRating));
      book.setAllRatingsCount(parseInt(allRatingsCount));
      book.setAllReviewsCount(parseInt(allReviewsCount));
      book.setToReadCount(parseInt(toReadCount));

      return book;
    } catch (err) {
      console.log(err);
      const { filePath, filename } = await this.takeErrorScreenshot();
      new Mailer().sendErrorEmail(
        filePath,
        filename,
        `GoodreadsScraper Error - ${new Date()}`,
        `<img src="cid:gr-err-ss"/><div>Error Message: ${err} </div>`
      );
    }
  }
}
