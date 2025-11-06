import { Router } from 'express';
import { supabaseAdmin } from '../../lib/supabase';

const router = Router();

router.post('/', async (req, res) => {
  const { email, password, name } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password required' });
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: name ?? null },
  });

  if (error || !data.user) {
    return res.status(400).json({ error: error?.message ?? 'Unable to create user' });
  }

  const profilePayload = {
    id: data.user.id,
    name: name ?? null,
    created_at: new Date().toISOString(),
  };

  const { error: insertError } = await supabaseAdmin.from('profiles').insert(profilePayload);

  if (insertError) {
    return res.status(400).json({ error: insertError.message });
  }

  return res.status(201).json({ user: data.user });
});

export default router;
