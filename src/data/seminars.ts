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
    id: "called-for-campus-ministry",
    name: "Called for Campus Ministry",
    category: "Calling",
    description: " Called for Campus Ministry",
  },
  {
    id: "leadership-in-the-marketplace",
    name: "Leadership in the Marketplace",
    category: "Leadership",
    description: "Leadership in the Marketplace",
  },
  {
    id: "campus-mobilization",
    name: "Campus Mobilization",
    category: "Mission",
    description: "mission engagement",
  },
  {
    id: "team-leadership",
    name: "Team Leadership",
    category: "Leadership",
    description: "Team Leadership",
  },
  {
    id: "the-kingdom-of-god",
    name: "The Kingdom of God",
    category: "Mission",
    description: "The Kingdom of God",
  },
  {
    id: "profession-as-mission",
    name: "Profession as a Mission",
    category: "Mission",
    description: "Viewing your profession as a mission field",
  },
  {
    id: "christian-relationships-and-purity",
    name: "Christian Relationships and Purity",
    category: "Relationship",
    description: "Christian Relationships and Purity",
  },
  {
    id: "youth-culture",
    name: "Youth Culture",
    category: "Youth Ministry",
    description: "Understanding and engaging with youth culture",
  },
  {
    id: "spiritual-fitness",
    name: "Spiritual Fitness",
    category: "Mission",
    description: " Spiritual Fitness",
  },
  {
    id: "mental-health-and-healing",
    name: "Mental Health and Healing",
    category: "Healing",
    description: "Mental Health and Healing",
  },
  {
    id: "spirituality-and-leadership",
    name: "Spirituality and Leadership",
    category: "Leadership",
    description: "Spirituality and Leadership",
  },
  {
    id: "a-kingdom-approach-to-artificial-intelligence",
    name: "A Kingdom Approach to Artificial Intelligence",
    category: "AI",
    description: "A Kingdom Approach to Artificial Intelligence",
  },
  {
    id: "scripture-engagement",
    name: "Scripture Engagement",
    category: "Scripture",
    description: "Scripture Engagement",
  },
  {
    id: "discipling-through-small-groups",
    name: "Discipling Through Small Groups",
    category: "Discipleship",
    description: "Discipling Through Small Groups",
  },
  {
    id: "discipleship-and-social-transformation",
    name: "Discipleship and Social Transformation",
    category: "Discipleship",
    description: "Discipleship and Social Transformation",
  },
  {
    id: "christian-counselling",
    name: "Christian Counselling",
    category: "Counselling",
    description: "Christian Counselling",
  },
  {
    id: "christ-centered-preaching",
    name: "Christ-Centered Preaching",
    category: "Counselling",
    description: "Christ-Centered Preaching",
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