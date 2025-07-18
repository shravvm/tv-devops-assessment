import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.send('Hello from Express + TypeScript!');
});

router.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

export default router;
