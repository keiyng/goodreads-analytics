import { Client, QueryResult } from 'pg';
import keys from './config/keys';

export class PgClient {
  db: Client;
  constructor() {
    this.db = new Client({
      user: keys.dbUser,
      host: keys.dbHost,
      database: keys.dbName,
      password: keys.dbPassword,
      port: 5432,
      ssl: true,
    });
  }

  connect() {
    this.db.connect();
  }

  close() {
    this.db.end();
  }

  async query(
    query: string,
    values?: any[]
  ): Promise<{ [key: string]: any }[]> {
    let results: { [key: string]: any }[] = [];
    try {
      const query_results: QueryResult = await this.db.query(query, values);
      results = query_results.rows;
    } catch (err) {
      console.log(err);
    }

    return results;
  }
}
