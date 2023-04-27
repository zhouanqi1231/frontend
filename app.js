const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

// 导入相应的`.js`文件 ===============================
const indexRouter = require("./routes/index");
const testRouter = require("./routes/test");
const test2Router = require("./routes/test2");
const referenceRouter = require("./routes/reference");
// 导入相应的`.js`文件 ===============================

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// 路由和文件一一对应 ================================
app.use("/", indexRouter);
app.use("/index", indexRouter);
app.use("/test", testRouter);
app.use("/test2", test2Router);
app.use("/reference", referenceRouter);
// 路由和文件一一对应 ================================

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
