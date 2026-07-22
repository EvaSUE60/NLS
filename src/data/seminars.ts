// data/seminars.ts

export interface SeminarType {
  id: string;
  name: string;
  description?: string;
  category?: string;
  duration?: string;
  maxParticipants?: number;
}

export const SEMINAR_TYPES: SeminarType[] = [
  {
    id: "engaging-islam",
    name: "Engaging Islam",
    category: "Interfaith Engagement",
    description: "Understanding and engaging with Islamic communities",
  },
  {
    id: "engaging-eotc",
    name: "Engaging the EOTC",
    category: "Interfaith Engagement",
    description: "Understanding and engaging with Ethiopian Orthodox Tewahedo Church",
  },
  {
    id: "mission-mobilization",
    name: "Mission Mobilization",
    category: "Mission Strategy",
    description: "Strategies for mobilizing churches and individuals for mission",
  },
  {
    id: "mobilizing-small-groups",
    name: "Mobilizing Small Groups for Mission",
    category: "Small Groups",
    description: "Equipping small groups for effective mission engagement",
  },
  {
    id: "urban-poor-ministry",
    name: "Urban Poor Ministry",
    category: "Community Ministry",
    description: "Ministry approaches for urban poor communities",
  },
  {
    id: "mission-social-transformation",
    name: "Mission and Social Transformation",
    category: "Mission Strategy",
    description: "Integrating mission with social transformation",
  },
  {
    id: "profession-as-mission",
    name: "Profession as a Mission",
    category: "Workplace Ministry",
    description: "Viewing your profession as a mission field",
  },
  {
    id: "intentional-disciple-making",
    name: "Intentional Disciple-Making",
    category: "Discipleship",
    description: "Strategies for intentional disciple-making",
  },
  {
    id: "youth-culture",
    name: "Youth Culture",
    category: "Youth Ministry",
    description: "Understanding and engaging with youth culture",
  },
  {
    id: "scattered-for-purpuse",
    name: "Scattered for Purpose",
    category: "Mission Strategy",
    description: "Understanding mission in the context of migration",
  },
  {
    id: "spiritual-formation",
    name: "Spiritual Formation",
    category: "Spiritual Formation",
    description: "Maintaining spiritual health and fitness for mission",
  },
  {
    id: "digital-discernment",
    name: "Digital Discernment",
    category: "Digital Ministry",
    description: "Discerning and engaging in the digital space",
  }
];

// Helper functions
export const getSeminarById = (id: string): SeminarType | undefined => {
  return SEMINAR_TYPES.find((seminar) => seminar.id === id);
};

export const getSeminarByName = (name: string): SeminarType | undefined => {
  return SEMINAR_TYPES.find(
    (seminar) => seminar.name.toLowerCase() === name.toLowerCase()
  );
};

export const getSeminarsByCategory = (category: string): SeminarType[] => {
  return SEMINAR_TYPES.filter(
    (seminar) => seminar.category === category
  );
};

export const getSeminarCategories = (): string[] => {
  const categories = new Set(SEMINAR_TYPES.map((s) => s.category).filter(Boolean));
  return Array.from(categories) as string[];
};

export const getSeminarNames = (): string[] => {
  return SEMINAR_TYPES.map((s) => s.name);
};

export const getSeminarOptions = (): { label: string; value: string }[] => {
  return SEMINAR_TYPES.map((s) => ({
    label: s.name,
    value: s.id,
  }));
};

// Validation function
export const isValidSeminarType = (seminarType: string): boolean => {
  return SEMINAR_TYPES.some(
    (s) => s.name.toLowerCase() === seminarType.toLowerCase() || s.id === seminarType
  );
};

// Get seminar by name or id
export const findSeminar = (search: string): SeminarType | undefined => {
  return SEMINAR_TYPES.find(
    (s) =>
      s.name.toLowerCase() === search.toLowerCase() ||
      s.id.toLowerCase() === search.toLowerCase()
  );
};

// Default export
export default SEMINAR_TYPES;