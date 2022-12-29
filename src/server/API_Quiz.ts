import express from "express";
import { Question, Quiz } from "../quiz";
import { db, lti } from "./shared";

const quizCol = db.collection<Quiz>("quizzes");
const questionCol = db.collection<Question>("quiz-questions");

export const useAPI_Quiz = async (app: express.Application) => {
  // database stuff for full text search questions
  await questionCol.createIndex({ question: "text" });

  /* 
  
  
  
  */

  app.post("/quiz", async (req, res) => {
    const parsed = Quiz.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).send({ message: "Invalid quiz" }).end();
      return;
    }

    const quizNew = parsed.data;

    const lineItem = {
      scoreMaximum: quizNew.questions.length,
      label: quizNew.title,
      resourceId: quizNew.id,
      tag: "quiz",
    };

    // @ts-ignore
    await lti.Grade.createLineItem(res.locals.token, lineItem);

    await quizCol.insertOne(req.body);

    return res.status(201).send({ message: "Quiz created" }).end();
  });

  /* 
  
  
  docs: https://cvmcosta.me/ltijs/#/deeplinking
  
  
  */
  app.post("/quiz/deep-link", async (req, res) => {
    const parsed = Quiz.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).send({ message: "Invalid quiz" }).end();
      return;
    }

    const quiz = parsed.data;

    const items = [
      {
        type: "ltiResourceLink",
        title: quiz.title,
        // url: "/", // none
        custom: {
          type: "quiz",
          quizId: quiz.id,
        },
      },
    ];

    const deepLinkingFormHTML = await lti.DeepLinking.createDeepLinkingForm(
      res.locals.token,
      items,
      { message: "Successfully registered quiz!" }
    );

    return res.status(200).json({
      deepLinkingFormHTML,
    });
  });

  /* 
  
  
  

  */

  app.get("/quiz", async (req, res) => {
    const quizzes = await quizCol.find({}).toArray();
    return res.status(200).send(quizzes).end();
  });

  /* 
  
  
 
 
  */

  app.get("/quiz/:quizId", async (req, res) => {
    const quizId = req.params.quizId;

    const found = await quizCol.findOne({ id: quizId });

    if (!found) {
      return res.status(404).json({ message: "quiz not found" }).end();
    }

    return res.status(200).json(found).end();
  });

  /* 
  
  
 
 
  */

  app.post("/quiz-question", async (req, res) => {
    console.log(req.body);

    const parsed = Question.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).send({ message: "Invalid quiz question" }).end();
      return;
    }

    const questionNew = parsed.data;

    await questionCol.insertOne(questionNew);
    res.status(201).send({ message: "Quiz question created" }).end();
    return;
  });

  /* 
  
  
 
 
  */

  app.delete("/quiz-question/:id", async (req, res) => {
    const questionId = req.params.id;
    await questionCol.deleteOne({ id: questionId });
    res.status(201).send({ message: "Quiz question created" }).end();
  });

  /* 
  
  
 
 
  */

  app.post("/quiz-question-search", async (req, res) => {
    console.log(req.query);
    const found = questionCol.find({});
    const hits = await found.toArray();
    console.log(hits);
    res.status(200).send(hits).end();
  });
};
