import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import session from 'express-session';
import { fileURLToPath } from 'url';
import path from 'path';
import { connection } from './db.mjs';
import {router as authorizationRouter} from "./routes/authorizationRoutes.mjs"
import isAuthenticated from './routes/authorizationRoutes.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

//My view engine is handlebars
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

//I accept post data as key=value pairs
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

//Setting up sessions. Adds the .user property to req
app.use(session({
  secret: "non-secure temporary key",
  resave: false,
  saveUninitialized: true
}));

//lets all my handlebars access my user data
//As in, {{user.username}} can retrive username
app.use((req, res, next) => {
    res.locals.user = req.session;
    next();
  });

//Log every path visited for testing
app.use((req, res, next) => {
    console.log(req.path.toUpperCase(), req.body);
    next();
});

//Won't let you access other pages without being logged in
app.use(isAuthenticated);

//Handles login and register routes
app.use(authorizationRouter);

//Home page
app.get('/', (req, res) => {
  res.render('index');
});

// app.post('/post', (req, res) => {
//     let username = req.session.username;
//     let blog = req.body.blog;
//     connection.query('INSERT INTO blog (blog_post, username) VALUES (?, ?)', [blog, username], () => {
//         res.redirect('/');
//     });
// });

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/customerLogin'));
});

app.listen(3000);
