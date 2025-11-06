import { Router } from 'express';

const router = Router();

router.post('/', async (_req, res) => {
  return res.status(400).json({ error: 'Use frontend Supabase auth for login.' });
});

export default router;
