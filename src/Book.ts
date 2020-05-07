export class Book {
  constructor(
    public title: string,
    public url: string,
    public grId: string,
    public authorId: string,
    public rank?: number,
    public scores?: number,
    public votes?: number,
    public allRatingsCount?: number,
    public ratingsDistribution?: { [key: string]: number },
    public averageRating?: number,
    public allReviewsCount?: number,
    public toReadCount?: number,
    public listId?: string
  ) {
    this.setBookInfo(title, url, grId);
  }

  setBookInfo(title: string, url: string, grId: string): void {
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

  setList(listId: string): void {
    this.listId = listId;
  }
}
