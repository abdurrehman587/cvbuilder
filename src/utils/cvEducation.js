export const toEducationArray = (source) => {
  if (source == null) return [];
  if (typeof source === 'string') return source.trim() ? [source] : [];
  if (Array.isArray(source)) return source;
  if (typeof source === 'object') return [source];
  return [];
};

export const normalizeEducationEntry = (edu) => {
  if (!edu) return null;
  if (typeof edu === 'string') {
    const trimmed = edu.trim();
    return trimmed ? { degree: trimmed, board: '', year: '', marks: '', details: '' } : null;
  }
  if (typeof edu !== 'object') return null;

  const degree =
    edu.degree ||
    edu.Degree ||
    edu.qualification ||
    edu.Qualification ||
    edu.course ||
    edu.Course ||
    edu.title ||
    edu.Title ||
    edu.name ||
    edu.Name ||
    '';
  const board =
    edu.board ||
    edu.Board ||
    edu.school ||
    edu.School ||
    edu.institute ||
    edu.Institute ||
    edu.institution ||
    edu.university ||
    edu.University ||
    edu.college ||
    edu.College ||
    edu.universityName ||
    '';
  const year =
    edu.year ||
    edu.Year ||
    edu.duration ||
    edu.Duration ||
    edu.period ||
    edu.Period ||
    edu.graduationYear ||
    '';
  const marks =
    edu.marks ||
    edu.Marks ||
    edu.grade ||
    edu.Grade ||
    edu.gpa ||
    edu.GPA ||
    edu.cgpa ||
    '';
  const details =
    edu.details ||
    edu.Details ||
    edu.description ||
    edu.Description ||
    '';
  const normalized = {
    degree: String(degree || '').trim(),
    board: String(board || '').trim(),
    year: String(year || '').trim(),
    marks: String(marks || '').trim(),
    details: String(details || '').trim(),
  };
  const hasContent = Object.values(normalized).some((value) => value !== '');
  return hasContent ? normalized : null;
};

export const coalesceEducation = (...sources) => {
  const merged = [];
  const seen = new Set();

  for (const source of sources) {
    for (const entry of toEducationArray(source)) {
      const normalized = normalizeEducationEntry(entry);
      if (!normalized) continue;
      const key = JSON.stringify(normalized);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(normalized);
    }
  }

  return merged;
};

export const meaningfulEducationCount = (entries) => coalesceEducation(entries).length;

export const pickRicherEducation = (preferred, fallback) => {
  const preferredCount = meaningfulEducationCount(preferred);
  const fallbackCount = meaningfulEducationCount(fallback);
  if (preferredCount >= fallbackCount && preferredCount > 0) {
    return coalesceEducation(preferred);
  }
  if (fallbackCount > 0) {
    return coalesceEducation(fallback);
  }
  return coalesceEducation(preferred, fallback);
};

export const resolvePreviewEducation = (...sources) => {
  const normalized = coalesceEducation(...sources);
  if (normalized.length > 0) return normalized;

  for (const source of sources) {
    const arr = toEducationArray(source);
    if (!arr.length) continue;

    const loose = arr
      .map((entry) => {
        const normalizedEntry = normalizeEducationEntry(entry);
        if (normalizedEntry) return normalizedEntry;

        if (typeof entry === 'string' && entry.trim()) {
          return { degree: entry.trim(), board: '', year: '', marks: '', details: '' };
        }
        if (!entry || typeof entry !== 'object') return null;

        const values = Object.values(entry).filter((v) => v != null && String(v).trim() !== '');
        if (!values.length) return null;

        return {
          degree: String(values[0] || '').trim(),
          board: String(values[1] || '').trim(),
          year: String(values[2] || '').trim(),
          marks: String(values[3] || '').trim(),
          details: String(values.slice(4).join(' ') || '').trim(),
        };
      })
      .filter((entry) => entry && Object.values(entry).some((v) => v && String(v).trim()));

    if (loose.length > 0) return loose;
  }

  return [];
};

export const readStoredFormData = () => {
  try {
    const stored = localStorage.getItem('cvFormData');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const mergePreviewFormData = (formData) => {
  const stored = readStoredFormData();
  if (!stored) return formData || {};
  const hasFormData =
    formData &&
    (formData.name ||
      formData.experience?.length > 0 ||
      meaningfulEducationCount(formData.education) > 0);
  if (!hasFormData) {
    return stored;
  }
  return {
    ...stored,
    ...formData,
    education: pickRicherEducation(formData.education, stored.education),
    experience: Array.isArray(formData.experience) && formData.experience.length > 0
      ? formData.experience
      : (stored.experience || []),
    skills: Array.isArray(formData.skills) && formData.skills.length > 0
      ? formData.skills
      : (stored.skills || []),
    languages: Array.isArray(formData.languages) && formData.languages.length > 0
      ? formData.languages
      : (stored.languages || []),
    otherInfo: Array.isArray(formData.otherInfo) && formData.otherInfo.length > 0
      ? formData.otherInfo
      : (stored.otherInfo || []),
    references: Array.isArray(formData.references) && formData.references.length > 0
      ? formData.references
      : (stored.references || []),
    profileImage: formData.profileImage || stored.profileImage,
  };
};
