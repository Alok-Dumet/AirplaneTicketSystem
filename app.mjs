import dotenv from "dotenv";
dotenv.config();
import express from "express";
import session from "express-session";
import { fileURLToPath } from "url";
import path from "path";
import {router as authorizationRouter} from "./routes/authorizationRoutes.mjs"
import {router as publicRouter} from "./routes/publicRouter.mjs"
import {router as staffRouter} from "./routes/staffRouter.mjs"
import {router as customerRouter} from "./routes/customerRouter.mjs"
import isAuthenticated from "./routes/authorizationRoutes.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

//My view engine is handlebars
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

//I accept post data as key=value pairs
app.use(express.urlencoded({ extended: false }));

//allows me to read req.body as jsons also
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

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

//Handles public info
app.use(publicRouter);

//Handles staff related stuff
app.use(staffRouter);

//Handles customer related stuff
app.use(customerRouter);

//Staff page
app.get("/staffHome", (req, res) => {
  res.render("staffPages/staffHome");
});

//customer page
app.get("/customerHome", (req, res) => {
  res.render("customerPages/customerHome");
});

app.get("/logout", (req, res) => {
  if(req.session.email){
    req.session.destroy(() => res.redirect("/customerLogin"));
  }
  else{
    req.session.destroy(() => res.redirect("/staffLogin"));
  }
});

app.listen(3000);
