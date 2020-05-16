import fs from 'fs';
import path from 'path';
import { WebElement, Builder, By } from 'selenium-webdriver';
import { Book } from './Book';
import { Mailer } from './Mailer';
import { PgClient } from './PgClient';
import { ListStats } from './ListStats';

export class GoodreadsScraper {
  driver: any;

  constructor(public browser: string) {}

  async scrapeList(url: string) {
    try {
      // get list page
      await this.getPage(url);
      const list = await this.getList(50);
      this.saveList(list);
      this.driver.close();

      // get book details page
      for (let item of list) {
        await this.getPage(item.book['url']);
        const listStats = await this.getListStats(item);
        this.driver.close();
        // this.saveListStats(listStats);
        break;
      }
      this.driver.quit();
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

  async buildDriver() {
    this.driver = await new Builder().forBrowser(this.browser).build();
  }

  async getPage(url: string): Promise<void> {
    await this.buildDriver();
    await this.driver.get(url);
  }

  async getList(count: number): Promise<{ [key: string]: any }[]> {
    const list: {
      book: Book;
      rank: number;
      scores: number;
      votes: number;
      listId: string;
    }[] = [];

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

      const book = new Book(title, url, grId, authorId);
      const details = {
        rank,
        scores: parseInt(score),
        votes: parseInt(vote),
        listId,
      };

      list.push({ book, ...details });
    }

    return list;
  }

  async getListStats(listItem: { [key: string]: any }): Promise<ListStats> {
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

    const averageRating = await allEditionsDetails[0].getText();
    const allRatingsCount = await allEditionsDetails[1].getText();
    const allReviewsCount = await allEditionsDetails[2].getText();
    const toReadCount = await allEditionsDetails[4].getText();

    const distribution = ListStats.constructRatingsDistribution(
      ratingsDistribution
    );

    const stats = new ListStats(
      listItem.book.grId,
      listItem.rank,
      listItem.scores,
      listItem.votes,
      parseInt(allRatingsCount),
      distribution,
      parseFloat(averageRating),
      parseInt(allReviewsCount),
      parseInt(toReadCount),
      listItem.listId
    );
    return stats;
  }

  async saveList(list: { [key: string]: any }[]) {
    const db = new PgClient();
    db.connect();

    for (let listItem of list) {
      const query = `select * from book where gr_id = $1`;
      const values = [listItem.book['grId']];
      const exists: { [key: string]: any }[] = await db.query(query, values);
      if (exists.length === 0) {
        const insertBook =
          'insert into book (title, gr_id, url, author_ids, list_ids) values ($1, $2, $3, $4, $5)';
        const bookValues = [
          listItem.book['title'],
          listItem.book['grId'],
          listItem.book['url'],
          [listItem.book['authorId']],
          [listItem.book['listId']],
        ];

        await db.query(insertBook, bookValues);
      }
    }

    db.close();
  }

  async saveListStats(listStats: ListStats) {
    const db = new PgClient();
    db.connect();

    const insertStats =
      'insert into list_stats (gr_id, list_id, rank, scores, votes, all_ratings_count, ratings_distribution, average_rating, all_reviews_count, to_read_count) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)';

    const statsValues = [
      listStats['grId'],
      listStats['listId'],
      listStats['rank'],
      listStats['scores'],
      listStats['votes'],
      listStats['allRatingsCount'],
      listStats['ratingsDistribution'],
      listStats['averageRating'],
      listStats['allReviewsCount'],
      listStats['toReadCount'],
    ];

    await db.query(insertStats, statsValues);

    db.close();
  }

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
}
