import Announcement from "../models/Announcement.js";

const MAX_FEATURED = 6; // Home mostra no máx. 6 anúncios destacados

async function countFeatured(excludeId) {
  const filter = { featuredHome: true };
  if (excludeId) filter._id = { $ne: excludeId };
  return Announcement.countDocuments(filter);
}

export async function listPublicAnnouncements(req, res) {
  const announcements = await Announcement.find({ featuredHome: true })
    .sort({ createdAt: -1 })
    .limit(MAX_FEATURED);
  res.json(announcements);
}

export async function listAllAnnouncements(req, res) {
  const announcements = await Announcement.find().sort({ createdAt: -1 });
  res.json(announcements);
}

export async function createAnnouncement(req, res) {
  try {
    if (req.body.featuredHome) {
      const featuredCount = await countFeatured();
      if (featuredCount >= MAX_FEATURED) {
        return res.status(400).json({
          error: `Limite de ${MAX_FEATURED} anúncios destacados na Home atingido. Remova o destaque de algum antes de adicionar outro.`,
        });
      }
    }
    const announcement = await Announcement.create(req.body);
    res.status(201).json(announcement);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateAnnouncement(req, res) {
  try {
    if (req.body.featuredHome) {
      const featuredCount = await countFeatured(req.params.id);
      if (featuredCount >= MAX_FEATURED) {
        return res.status(400).json({
          error: `Limite de ${MAX_FEATURED} anúncios destacados na Home atingido. Remova o destaque de algum antes de adicionar outro.`,
        });
      }
    }
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!announcement) return res.status(404).json({ error: "Anúncio não encontrado." });
    res.json(announcement);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteAnnouncement(req, res) {
  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}
