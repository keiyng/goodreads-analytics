import { Client } from 'pg';
import { dbUser, dbHost, dbName, dbPassword } from './config/keys';

export class PgClient {
  db: Client;
  constructor() {
    this.db = new Client({
      // user: dbUser,
      // host: dbHost,
      // database: dbName,
      // password: dbPassword,
      // port: 5432,
      // ssl: true,

      user: 'Kei',
      host: 'localhost',
      database: 'Kei',
      password: 'secretpassword',
      port: 5432,
    });
  }

  connect() {
    this.db.connect();
  }

  close() {
    this.db.end();
  }

  query(query: string) {
    this.db.query(query, (err, res) => {
      console.log(err, res);
    });
  }
}
