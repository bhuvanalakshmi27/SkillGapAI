const ProgressEvent = require("../models/ProgressEvent");

async function recordProgressEvent(userId, type, title, metadata = {}) {
  if (!userId || !type || !title) return null;

  const recent = await ProgressEvent.findOne({
    userId,
    type,
    title,
    occurredAt: { $gte: new Date(Date.now() - 2000) },
  }).sort({ occurredAt: -1 });
  if (recent) return recent;

  return ProgressEvent.create({
    userId,
    type,
    title,
    metadata,
    occurredAt: new Date(),
  });
}

module.exports = {
  recordProgressEvent,
};
