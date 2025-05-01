import dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2';


export const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: process.env.PASSWORD,
  database: 'airplanesystem'
});

connection.connect((err) => {
  console.log('Connected to MySQL');
});
