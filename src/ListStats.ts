export class ListStats {
  static constructRatingsDistribution(
    distribution: number[]
  ): { [key: string]: number } {
    let distributionObj: { [key: string]: number } = {};
    for (let i = 0; i < distribution.length; i++) {
      distributionObj[distribution.length - i] = distribution[i];
    }
    return distributionObj;
  }

  constructor(
    public grId: string,
    public rank: number,
    public scores: number,
    public votes: number,
    public allRatingsCount: number,
    public ratingsDistribution: { [key: string]: number },
    public averageRating: number,
    public allReviewsCount: number,
    public toReadCount: number,
    public listId: string
  ) {}
}
