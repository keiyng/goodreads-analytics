import fs from 'fs';
import path from 'path';
import { WebElement, Builder, By } from 'selenium-webdriver';
import { Book } from './Book';
import { Mailer } from './Mailer';
import { PgClient } from './PgClient';

export class GoodreadsScraper {
  driver: any;

  constructor(public browser: string) {}

  async handlePopup(popupCloseBtnCssSelector: string): Promise<void> {
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

  async takeErrorScreenshot(): Promise<{ [key: string]: string }> {
    const screenshot: Promise<string> = await this.driver.takeScreenshot();
    const filename: string = `error-${new Date()}.png`;
    const filePath = path.join(__dirname, '..', 'error_screenshots', filename);
    fs.writeFileSync(filePath, screenshot, 'base64');

    return { filePath, filename };
  }

  async saveBookToDb(book: Book) {
    const db = new PgClient();
    db.connect();

    const query = `select * from book where gr_id = $1`;
    const values = [book['grId']];
    const exists: { [key: string]: any }[] = await db.query(query, values);

    if (exists.length === 0) {
      const insertBook =
        'insert into book (title, gr_id, url, author_ids, list_ids) values ($1, $2, $3, $4, $5)';
      const bookValues = [
        book['title'],
        book['grId'],
        book['url'],
        [book['authorId']],
        [book['listId']],
      ];

      await db.query(insertBook, bookValues);
    }

    const insertDetails =
      'insert into list_stats (gr_id, list_id, rank, scores, votes, all_ratings_count, ratings_distribution, average_rating, all_reviews_count, to_read_count) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)';
    const detailsValues = [
      book['grId'],
      book['listId'],
      book['rank'],
      book['scores'],
      book['votes'],
      book['allRatingsCount'],
      book['ratingsDistribution'],
      book['averageRating'],
      book['allReviewsCount'],
      book['toReadCount'],
    ];

    await db.query(insertDetails, detailsValues);

    db.close();
  }

  async scrapeShouldReadAtLeastOnceList(url: string) {
    // get list page
    await this.getPage(url);
    const books = await this.getVotedBookList(50);
    this.driver.close();

    // get book details page
    let counter = 0;
    for (let book of books) {
      counter++;
      await this.getPage(book['url']);
      const bookWithDetails = await this.getBookDetails(book);
      console.log(bookWithDetails);
      this.driver.close();
      this.saveBookToDb(bookWithDetails);
    }
    this.driver.quit();
  }

  async buildDriver() {
    this.driver = await new Builder().forBrowser(this.browser).build();
  }

  async getPage(url: string): Promise<void> {
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
    }
  }

  private getIdFromUrl(
    url: string,
    key: string,
    searchExpression: RegExp
  ): string {
    const idStartIndex: number = url.indexOf(key) + key.length;
    const idEndIndex: number =
      url.slice(idStartIndex).search(searchExpression) + idStartIndex;
    return url.slice(idStartIndex, idEndIndex);
  }

  async getVotedBookList(count: number): Promise<Book[]> {
    const books: Book[] = [];

    try {
      const bookInfo: WebElement[] = await this.driver.findElements(
        By.css('#all_votes tr .bookTitle')
      );

      const author: WebElement[] = await this.driver.findElements(
        By.css('a[class="authorName"]')
      );

      const scores: WebElement[] = await this.driver.findElements(
        By.css('#all_votes .smallText a:first-of-type')
      );

      const votes: WebElement[] = await this.driver.findElements(
        By.css('#all_votes .smallText a:nth-of-type(2)')
      );

      const currentUrl: string = await this.driver.getCurrentUrl();
      const listId: string = this.getIdFromUrl(currentUrl, 'show/', /\D/);

      for (let i = 0; i < count; i++) {
        const title: string = await bookInfo[i].getText();
        const url: string = await bookInfo[i].getAttribute('href');
        const authorUrl: string = await author[i].getAttribute('href');
        const authorId: string = this.getIdFromUrl(authorUrl, 'show/', /\D/);
        const grId: string = this.getIdFromUrl(url, 'show/', /\D/);
        const rank: number = i + 1;
        let score: string = await scores[i].getText();
        score = score.replace(/[\D]/g, '');
        let vote: string = await votes[i].getText();
        vote = vote.replace(/[\D]/g, '');

        const book: Book = new Book(title, url, grId, authorId);
        book.setRank(rank);
        book.setScores(parseInt(score));
        book.setVotes(parseInt(vote));
        book.setList(listId);
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

  async getBookDetails(book: Book): Promise<Book> {
    let currentBook = book;
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

      currentBook.setRatingsDistribution(ratingsDistribution);
      const averageRating = await allEditionsDetails[0].getText();
      const allRatingsCount = await allEditionsDetails[1].getText();
      const allReviewsCount = await allEditionsDetails[2].getText();
      const toReadCount = await allEditionsDetails[4].getText();

      currentBook.setAverageRating(parseFloat(averageRating));
      currentBook.setAllRatingsCount(parseInt(allRatingsCount));
      currentBook.setAllReviewsCount(parseInt(allReviewsCount));
      currentBook.setToReadCount(parseInt(toReadCount));
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
    return book;
  }
}
