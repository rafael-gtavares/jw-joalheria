import User, { GENDERS } from "../models/User.js";

const MIN_AGE_YEARS = 13;

// Valida e normaliza birthDate/gender vindos do cliente. Retorna só os
// campos presentes no corpo; lança Error (mensagem segura) se inválidos.
// "" ou null em birthDate limpa o campo.
function parseDemographics(body = {}) {
  const result = {};

  if (body.birthDate !== undefined) {
    if (body.birthDate === "" || body.birthDate === null) {
      result.birthDate = null;
    } else {
      const raw = String(body.birthDate);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        throw new Error("Data de nascimento inválida.");
      }
      // Meio-dia UTC evita que fusos horários desloquem o dia.
      const date = new Date(`${raw}T12:00:00.000Z`);
      const now = new Date();
      const limit = new Date(now);
      limit.setFullYear(limit.getFullYear() - MIN_AGE_YEARS);

      if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw) {
        throw new Error("Data de nascimento inválida.");
      }
      if (date.getUTCFullYear() < 1900 || date > now) {
        throw new Error("Data de nascimento inválida.");
      }
      if (date > limit) {
        throw new Error(`É necessário ter ao menos ${MIN_AGE_YEARS} anos.`);
      }
      result.birthDate = date;
    }
  }

  if (body.gender !== undefined) {
    if (!GENDERS.includes(body.gender)) {
      throw new Error("Opção de sexo inválida.");
    }
    result.gender = body.gender;
  }

  return result;
}

function profileResponse(user) {
  return {
    uid: user.uid,
    name: user.name,
    email: user.email,
    provider: user.provider,
    role: user.role,
    birthDate: user.birthDate ? user.birthDate.toISOString().slice(0, 10) : "",
    gender: user.gender || "nao_informado",
  };
}

// Chamado pelo frontend logo após signup/login (email/senha ou Google) para
// garantir que exista um documento de perfil correspondente ao uid do Firebase.
// Idempotente: se já existir, apenas atualiza nome/email/provider.
export async function syncProfile(req, res) {
  try {
    const { uid, email, role } = req.user;
    const { name, provider } = req.body;

    let demographics;
    try {
      demographics = parseDemographics(req.body);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    const { birthDate, ...otherDemographics } = demographics;

    const update = {
      uid,
      email,
      role, // vem do token (Custom Claim), nunca do corpo da requisição
      ...(name ? { name } : {}),
      ...(provider ? { provider } : {}),
      ...otherDemographics,
    };
    if (birthDate) update.birthDate = birthDate;

    const user = await User.findOneAndUpdate({ uid }, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });

    res.json(profileResponse(user));
  } catch (err) {
    res.status(400).json({ error: "Não foi possível sincronizar o perfil." });
  }
}

export async function me(req, res) {
  try {
    const profile = await User.findOne({ uid: req.user.uid });
    res.json({
      uid: req.user.uid,
      email: req.user.email,
      role: req.user.role,
      name: profile?.name || req.user.name || "",
      birthDate: profile?.birthDate ? profile.birthDate.toISOString().slice(0, 10) : "",
      gender: profile?.gender || "nao_informado",
    });
  } catch (err) {
    console.error("Erro ao carregar perfil:", err);
    res.status(500).json({ error: "Não foi possível carregar o perfil." });
  }
}

export async function updateProfile(req, res) {
  try {
    const { name } = req.body;

    let demographics;
    try {
      demographics = parseDemographics(req.body);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    const update = {
      uid: req.user.uid,
      email: req.user.email,
      role: req.user.role, // sempre vem do token, nunca do corpo da requisição
      ...(name !== undefined ? { name } : {}),
    };
    const ops = { $set: update };

    if ("gender" in demographics) update.gender = demographics.gender;
    if ("birthDate" in demographics) {
      if (demographics.birthDate) update.birthDate = demographics.birthDate;
      else ops.$unset = { birthDate: "" };
    }

    const user = await User.findOneAndUpdate({ uid: req.user.uid }, ops, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
    res.json(profileResponse(user));
  } catch (err) {
    res.status(400).json({ error: "Não foi possível atualizar o perfil." });
  }
}
