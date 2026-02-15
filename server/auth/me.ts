app.get("/auth/me", requireUser, (req: AuthedRequest, res: Response) => {
  return res.json({ user: req.user });
});
