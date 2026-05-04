import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import balanceRouter from "./balance";
import generatorRouter from "./generator";
import codmRouter from "./codm";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(balanceRouter);
router.use(generatorRouter);
router.use(codmRouter);
router.use(adminRouter);

export default router;
