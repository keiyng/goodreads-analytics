import { GoodreadsScraper } from './Scraper';

const scraper = new GoodreadsScraper('chrome');
scraper.scrapeShouldReadAtLeastOnceList(
  'https://www.goodreads.com/list/show/264.Books_That_Everyone_Should_Read_At_Least_Once'
);
