export type TeamMember = {
  slug: string;
  name: string;
  pronouns: string;
  role: string;
  shortBio: string;
  bio: string[];
  qualifications: string[];
  keyFacts: { label: string; value: string }[];
  imageSrc: string;
  imagePosition?: string;
  /** Optional personal Instagram — falls back to studio socialLinks when unset */
  instagram?: string;
  /** Optional personal Facebook — falls back to studio socialLinks when unset */
  facebook?: string;
};

export const qualificationBadges = [
  {
    src: "/badges/xpert-pole-1-2.png",
    alt: "XPERT Pole Fitness Levels 1 & 2 certificate badge",
  },
  {
    src: "/badges/xpert-science-of-heels.png",
    alt: "XPERT Essential Science of Heels certificate badge",
  },
  {
    src: "/badges/sc-hoop-beginners.png",
    alt: "Spin City Certified Hoop Beginners badge",
  },
  {
    src: "/badges/sc-intermediate-hoop.png",
    alt: "Spin City Certified Intermediate Hoop badge",
  },
  {
    src: "/badges/sc-grounded-hoop.png",
    alt: "Spin City Certified Grounded Hoop badge",
  },
  {
    src: "/badges/sc-silks-beginners.jpg",
    alt: "Spin City Certified Silks Instructor Beginners badge",
  },
  {
    src: "/badges/silks-cert.jpeg",
    alt: "Aerial silks certification badge",
  },
] as const;

export const teamMembers: TeamMember[] = [
  {
    slug: "rosie",
    name: "Rosie",
    pronouns: "She/her",
    role: "Co-founder & Instructor",
    shortBio:
      "Rosie has been teaching pole across Nottinghamshire for 16 years, with a love of spins, tricks, and helping students achieve what once felt impossible.",
    bio: [
      "Rosie has been teaching pole across Nottinghamshire for 16 years.",
      "Her favourite thing about pole is that there is always something new to work on and something old to finesse. She loves spins, spinny pole, tricks and flips.",
      "She loves seeing students working and achieving things they never thought possible, especially when it comes to nailing a nemesis move or cheerleading performances.",
      "Rosie loves to teach all levels and focuses on variations and combinations of moves alongside conditioning and preparation for more advanced movements.",
    ],
    qualifications: [
      "Pole Passion Beginner",
      "Pole Passion Advanced",
      "XPERT Levels 1–2",
      "XPERT Levels 3–4",
      "XPERT Essential Science of Heels",
    ],
    keyFacts: [
      { label: "Years of experience with pole", value: "17" },
      { label: "Years teaching pole", value: "16" },
      { label: "Years of experience with aerial hoop", value: "14" },
      { label: "Favourite move", value: "All of them" },
      { label: "Most likely to say", value: "“Mate”" },
    ],
    imageSrc: "/team/rosie.jpeg",
  },
  {
    slug: "jacqui",
    name: "Jacqui",
    pronouns: "She/Her",
    role: "Co-founder & Instructor",
    shortBio:
      "Jacqui returned to pole after Covid and never looked back — now completely addicted to pole and aerial, with a passion for flowy movement and seamless combos.",
    bio: [
      "Jacqui started pole dancing in 2019, attended four classes, and decided it was too hard and gave up. Then, after Covid, she decided to give it another try and has never looked back.",
      "Since returning, she has become completely addicted to all things pole and aerial, not only enjoying time in the studio but also performing in showcases and competitions.",
      "She loves anything flowy and enjoys combining moves to create stunning, seamless combos.",
      "Alongside her passion for pole and aerial, Jacqui is also a childminder and holds a GTTP and an Early Years Degree.",
    ],
    qualifications: [
      "XPERT Certified Pole Fitness Level 1 & 2",
      "XPERT Certified Flying Pole",
      "XPERT Certified Science of Heels",
      "Spin City Aerial Hoop",
      "Spin City Silks",
      "Spin City Trapeze",
      "Spin City Grounded Hoop",
      "Spin City Teaching Kids 4–12",
    ],
    keyFacts: [
      { label: "Years of experience with pole", value: "5" },
      { label: "Years of experience with hoop", value: "4" },
      { label: "Years teaching", value: "2" },
      { label: "Favourite move", value: "Anything that’s been worth the work" },
      { label: "Most likely to say", value: "“Breathe!”" },
    ],
    imageSrc: "/team/jacqui.jpeg",
  },
  {
    slug: "sarah",
    name: "Sarah",
    pronouns: "She/Her",
    role: "Co-founder & Instructor",
    shortBio:
      "Sarah found pole after her second child and was hooked within months — now dedicated to helping others who don’t fit the stereotype of a pole dancer.",
    bio: [
      "Sarah found pole when she was looking for a style of fitness that didn’t feel as boring or intimidating as the gym after having her 2nd child. Week 1 was hard. Weeks 2 and 3 were still hard… by month two, she was completely hooked.",
      "After discovering choreography classes, Sarah entered her first competition and placed third.",
      "This ignited a passion to help others, especially those who don’t fit the stereotype of a pole dancer. That passion led her to become an instructor in 2024.",
      "Her family and friends have been an amazing support with her children throughout this time, encouraging her to throw herself into it all, and she cannot thank them enough.",
    ],
    qualifications: [
      "XPERT Pole Fitness Levels 1 & 2",
      "Spin City Spin Pole",
      "XPERT Science of Heels",
    ],
    keyFacts: [
      { label: "Years of experience with pole", value: "4" },
      { label: "Years teaching", value: "2" },
      { label: "Favourite move", value: "Anything leg grippy — thick thighs save lives" },
      { label: "Most likely to say", value: "“Look at you go!”" },
    ],
    imageSrc: "/team/sarah.jpeg",
  },
  {
    slug: "jane",
    name: "Jane",
    pronouns: "She/Her",
    role: "Instructor",
    shortBio:
      "Jane discovered pole at 19 and never looked back — expanding into hoop, silks, sling and more, with a special love for teaching children and young people.",
    bio: [
      "Jane discovered pole at 19 years old and instantly fell in love, and what started as a new hobby quickly became a lifelong passion.",
      "Over the years, Jane has expanded her aerial journey to include hoop, silks, sling and more. Creating a welcoming, supportive environment where every achievement is celebrated is at the heart of every class.",
      "She loves teaching all abilities, whether it’s helping someone conquer their very first spin or perfecting more advanced skills.",
      "Becoming a mum sparked a love for teaching children, and she especially enjoys helping young people discover confidence, resilience and a sense of achievement through aerial arts.",
      "Jane loves proving that strength isn’t about size and believes everyone is capable of achieving more than they think with the right support and encouragement.",
    ],
    qualifications: ["Spin City Silks", "Spin City Teaching Children"],
    keyFacts: [
      { label: "Years of experience with pole", value: "13" },
      { label: "Years of experience with aerial", value: "10" },
      { label: "Years teaching", value: "12" },
      { label: "Favourite move", value: "Iron X" },
      { label: "Most likely to say", value: "“Point your toes”" },
    ],
    imageSrc: "/team/jane.jpg",
  },
  {
    slug: "zane",
    name: "Zane",
    pronouns: "She/her",
    role: "Instructor",
    shortBio:
      "Zane discovered pole during lockdown and found a passion for strength, conditioning and meeting students exactly where they are.",
    bio: [
      "Zane first discovered pole during lockdown and it lit a fire in her soul.",
      "Pole became so much more than just another hobby; it became a passion and a place where she truly found herself.",
      "She joined CrossFit before moving into bodybuilding-style training, developing a love for strength work, conditioning, mobility and nutrition.",
      "Zane began teaching pole in 2023.",
      "Her aim is to meet students where they are, guide them through their journey, and know exactly when to add a little tough love — she knows you’ve got one more rep in you.",
    ],
    qualifications: ["XPERT Pole Level 1 & 2 Instructor"],
    keyFacts: [
      { label: "Years of experience with pole", value: "6" },
      { label: "Years teaching pole", value: "4" },
      { label: "Favourite move", value: "Anything humbling" },
      { label: "Most likely to say", value: "“You can do it”" },
    ],
    imageSrc: "/team/zane.jpeg",
  },
];

export function getTeamMember(slug: string) {
  return teamMembers.find((member) => member.slug === slug);
}
