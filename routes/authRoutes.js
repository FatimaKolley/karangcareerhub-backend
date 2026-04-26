router.post("/update-password", auth, async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
  
      const [rows] = await db.execute(`SELECT password FROM users WHERE id = ?`, [req.user.id]);
  
      if (!rows.length) return res.status(404).json({ error: "User not found" });
  
      const valid = bcrypt.compareSync(oldPassword, rows[0].password);
      if (!valid) return res.status(400).json({ error: "Old password incorrect" });
  
      const hashed = bcrypt.hashSync(newPassword, 10);
  
      await db.execute(`UPDATE users SET password = ? WHERE id = ?`, [hashed, req.user.id]);
  
      res.json({ message: "Password updated" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  
  