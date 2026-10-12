const { Router } = require("express");
const { asyncRoute, db, requiredString, rowsFromQuery } = require("../lib/db-helpers");

const router = Router();
const interviewQuestionIds = ["preferred_name", "personality", "interests", "memorable_moment", "support_style"];
const twinGenders = ["male", "female", "unspecified"];

function parseInterviewAnswers(value) {
  if (!value) return [];
  try {
    const answers = JSON.parse(value);
    return Array.isArray(answers) ? answers : [];
  } catch {
    return [];
  }
}

// GET /api/twins
router.get("/", asyncRoute(async (req, res) => {
  const rows = await rowsFromQuery(
    `SELECT m.id, m.name, m.era, m.profession, m.summary, m.avatar_url, m.character_spec,
      m.gender, m.owner_user_id, m.created_at, t.created_at AS saved_at, t.interview_completed_at
     FROM user_twins t JOIN masks m ON m.id = t.mask_id
     WHERE t.user_id = ? ORDER BY t.created_at DESC`,
    [req.user.id]
  );
  res.json({ twins: rows.map((row) => ({
    id: row.id,
    name: row.name,
    era: row.era,
    profession: row.profession,
    summary: row.summary,
    avatarUrl: row.avatar_url,
    characterSpec: row.character_spec,
    gender: row.gender,
    isCustomTwin: Boolean(row.owner_user_id),
    interviewCompleted: Boolean(row.interview_completed_at),
    createdAt: row.created_at,
    savedAt: row.saved_at,
  })) });
}));

// POST /api/twins/custom
router.post("/custom", asyncRoute(async (req, res) => {
  const name = requiredString(req.body?.name, "name", 100);
  const gender = twinGenders.includes(req.body?.gender) ? req.body.gender : "unspecified";
  const genderDescription = gender === "unspecified" ? "no gender preference" : `${gender} presentation`;
  const characterSpec = `A private personal AI companion created for one user. Use a ${genderDescription}. You are not a historical figure and must not claim to be human. Be warm, curious, supportive, and natural. Learn how the user likes to communicate from their interview answers and this conversation, then match their level of warmth, formality, and detail without copying or parodying them. If there is little context, begin with a friendly, easygoing style and follow the user's lead. Remember details the user shares, respect their boundaries, and never invent personal facts about them.`;
  const created = await db.execute(
    "INSERT INTO masks (owner_user_id, gender, name, profession, summary, character_spec) VALUES (?, ?, ?, 'Personal companion', ?, ?)",
    [req.user.id, gender, name, "A private AI twin shaped around your personality and conversations.", characterSpec]
  );
  const maskId = created?.insertId || created?.id;
  if (!maskId) throw new Error("Could not create personal twin");
  await db.execute("INSERT INTO user_twins (user_id, mask_id) VALUES (?, ?)", [req.user.id, maskId]);
  res.status(201).json({ maskId, name, gender, isCustomTwin: true });
}));

// GET /api/twins/:maskId/interview
router.get("/:maskId/interview", asyncRoute(async (req, res) => {
  const rows = await rowsFromQuery(
    `SELECT m.id, m.name, m.era, m.profession, m.summary, m.avatar_url, m.character_spec, m.gender, m.owner_user_id,
      t.id AS twin_id, t.interview_answers, t.interview_completed_at
     FROM masks m LEFT JOIN user_twins t ON t.mask_id = m.id AND t.user_id = ?
     WHERE m.id = ? AND (m.owner_user_id IS NULL OR (m.owner_user_id = ? AND t.id IS NOT NULL)) LIMIT 1`,
    [req.user.id, req.params.maskId, req.user.id]
  );
  if (!rows?.length) return res.json({ isTwin: false, answers: [], completed: false, mask: null });
  const row = rows[0];
  res.json({
    isTwin: Boolean(row.twin_id),
    answers: parseInterviewAnswers(row.interview_answers),
    completed: Boolean(row.interview_completed_at),
    mask: {
      id: row.id,
      name: row.name,
      era: row.era,
      profession: row.profession,
      summary: row.summary,
      avatarUrl: row.avatar_url,
      characterSpec: row.character_spec,
      gender: row.gender,
      isCustomTwin: Boolean(row.owner_user_id),
    },
  });
}));

// POST /api/twins/:maskId/interview
router.post("/:maskId/interview", asyncRoute(async (req, res) => {
  const twins = await rowsFromQuery(
    "SELECT id FROM user_twins WHERE user_id = ? AND mask_id = ? LIMIT 1",
    [req.user.id, req.params.maskId]
  );
  if (!twins?.length) return res.status(404).json({ error: "Save this character to Your Twins before starting its interview" });

  const submitted = req.body?.answers;
  if (!Array.isArray(submitted) || submitted.length > interviewQuestionIds.length) {
    return res.status(400).json({ error: "Interview answers are invalid" });
  }
  const seen = new Set();
  const answers = submitted.map((item) => {
    const questionId = item?.questionId;
    if (!interviewQuestionIds.includes(questionId) || seen.has(questionId)) {
      const error = new Error("Interview questions must be answered once each");
      error.status = 400;
      throw error;
    }
    seen.add(questionId);
    return { questionId, answer: requiredString(item?.answer, "answer", 1800) };
  });
  const completed = req.body?.completed === true;
  if (completed && interviewQuestionIds.some((id) => !seen.has(id))) {
    return res.status(400).json({ error: "Answer each interview question before finishing" });
  }

  await db.execute(
    "UPDATE user_twins SET interview_answers = ?, interview_completed_at = ? WHERE user_id = ? AND mask_id = ?",
    [JSON.stringify(answers), completed ? new Date() : null, req.user.id, req.params.maskId]
  );
  res.json({ isTwin: true, answers, completed });
}));

// POST /api/twins/:maskId
router.post("/:maskId", asyncRoute(async (req, res) => {
  const masks = await rowsFromQuery("SELECT id FROM masks WHERE id = ? AND owner_user_id IS NULL LIMIT 1", [req.params.maskId]);
  if (!masks?.length) return res.status(404).json({ error: "Mask not found" });
  await db.execute(
    "INSERT INTO user_twins (user_id, mask_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE mask_id = VALUES(mask_id)",
    [req.user.id, req.params.maskId]
  );
  res.status(201).json({ saved: true, maskId: req.params.maskId });
}));

// DELETE /api/twins/:maskId
router.delete("/:maskId", asyncRoute(async (req, res) => {
  const privateMasks = await rowsFromQuery(
    "SELECT id FROM masks WHERE id = ? AND owner_user_id = ? LIMIT 1",
    [req.params.maskId, req.user.id]
  );
  await db.execute("DELETE FROM user_twins WHERE user_id = ? AND mask_id = ?", [req.user.id, req.params.maskId]);
  if (privateMasks?.length) await db.execute("DELETE FROM masks WHERE id = ? AND owner_user_id = ?", [req.params.maskId, req.user.id]);
  res.json({ saved: false, maskId: req.params.maskId });
}));

module.exports = router;
