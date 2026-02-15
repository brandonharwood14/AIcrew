app.post("/auth/logout", requireUser, async (req: AuthedRequest, res: Response) => {
  // delete server-side session (recommended)
  if (req.sessionId) {
    await prisma.authSession.delete({ where: { id: req.sessionId } }).catch(() => {});
  }

  // clear cookie
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // local dev
    path: "/",
  });

  return res.json({ ok: true });
});
