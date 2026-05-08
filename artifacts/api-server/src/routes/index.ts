import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import balanceRouter from "./balance";
import generatorRouter from "./generator";
import codmRouter from "./codm";
import adminRouter from "./admin";
import smsRouter from "./sms";
import tgRouter from "./tg";
import feedbackRouter from "./feedback";
import checkerRouter from "./checker";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(balanceRouter);
router.use(generatorRouter);
router.use(codmRouter);
router.use(adminRouter);
router.use(smsRouter);
router.use(tgRouter);
router.use(feedbackRouter);
router.use(checkerRouter);

export default router;
