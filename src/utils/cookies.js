export function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true, // JS не может прочитать токен
    secure: true, // обязательно на проде (Vercel/Render — HTTPS)
    sameSite: 'none', // чтобы cookie шла с другого домена (Vercel → Render)
    path: '/api/auth', // refresh используется ТОЛЬКО в auth маршрутах
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/api/auth',
  });
}
