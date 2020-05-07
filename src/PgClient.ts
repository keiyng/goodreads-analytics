import { Client, QueryResult } from 'pg';
import { dbUser, dbHost, dbName, dbPassword } from './config/keys';

export class PgClient {
  db: Client;
  constructor() {
    this.db = new Client({
      user: dbUser,
      host: dbHost,
      database: dbName,
      password: dbPassword,
      port: 5432,
      ssl: true,

      //   user: 'Kei',
      //   host: 'localhost',
      //   database: 'Kei',
      //   password: 'secretpassword',
      //   port: 5432,
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
