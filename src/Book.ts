export class Book {
  constructor(
    protected title: string,
    protected url: string,
    protected grId: number,
    protected rank?: number,
    protected scores?: number,
    protected votes?: number,
    protected allRatingsCount?: number,
    protected ratingsDistribution?: { [key: string]: number },
    protected averageRating?: number,
    protected allReviewsCount?: number,
    protected toReadCount?: number,
    protected listId?: number
  ) {
    this.setBookInfo(title, url, grId);
  }

  setBookInfo(title: string, url: string, grId: number): void {
    this.title = title;
    this.url = url;
    this.grId = grId;
  }

  setRank(rank: number): void {
    this.rank = rank;
  }

  setScores(scores: number): void {
    this.scores = scores;
  }
  setVotes(votes: number): void {
    this.votes = votes;
  }

  setRatingsDistribution(distribution: number[]): void {
    let distributionObj: { [key: string]: number } = {};
    for (let i = 0; i < distribution.length; i++) {
      distributionObj[distribution.length - i] = distribution[i];
    }
    this.ratingsDistribution = distributionObj;
  }

  setAllRatingsCount(ratings: number): void {
    this.allRatingsCount = ratings;
  }

  setAverageRating(averageRating: number): void {
    this.averageRating = averageRating;
  }

  setToReadCount(toRead: number): void {
    this.toReadCount = toRead;
  }

  setAllReviewsCount(reviews: number): void {
    this.allReviewsCount = reviews;
  }

  setList(listId: number): void {
    this.listId = listId;
  }
}
