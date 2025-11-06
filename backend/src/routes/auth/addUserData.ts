import { Router } from 'express';
import { supabaseAdmin } from '../../lib/supabase';
import { requireUser } from '../../lib/requireUser';

const router = Router();

router.post('/', requireUser, async (req, res) => {
  const user = (req as any).user;
  const { name, phone } = req.body ?? {};

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .upsert(
      { id: user.id, name: name ?? null, phone: phone ?? null },
      { onConflict: 'id' }
    )
    .select();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json({ profile: data?.[0] ?? null });
});

export default router;
