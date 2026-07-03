export const siteConfig = {
  name: "Wild Hearts Collective",
  tagline: "Inclusive aerial & pole studio · Community hub",
  bookingNote:
    "All classes need to be booked in advance. Some courses and private lessons require deposits to secure your place.",
  levelNote:
    "We have classes for all abilities. If you are unsure which level is right for you, please contact us and we can advise you.",
  arrivalNote:
    "Please arrive 5–10 minutes before the start of your class.",
};

export const contact = {
  name: "Wild Hearts Collective",
  phone: "Phone coming soon",
  email: "hello@wildheartscollective.co.uk",
  address: "Address coming soon",
};

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/classes", label: "Classes" },
  { href: "/community", label: "Community" },
  { href: "/parties", label: "Parties" },
  { href: "/hire", label: "Hire" },
  { href: "/contact", label: "Contact" },
  { href: "/book", label: "Book" },
];

export const mainNavLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/community", label: "Community" },
  { href: "/parties", label: "Parties" },
  { href: "/hire", label: "Hire" },
  { href: "/contact", label: "Contact" },
];

export const classMenuLinks = [
  { href: "/classes/pole", label: "Pole Dancing", icon: "pole" as const },
  { href: "/classes/aerial-hoop", label: "Aerial Hoop", icon: "hoop" as const },
  { href: "/classes/aerial-silks", label: "Aerial Silks", icon: "silks" as const },
  { href: "/classes", label: "All Classes", icon: "grid" as const },
  { href: "/classes/creative-arts-workshops", label: "Creative Arts Workshops", icon: "arts" as const },
];

export const footerLinks = [
  ...navLinks,
  { href: "/faqs", label: "FAQs" },
  { href: "/terms", label: "Terms & Conditions" },
];

export const footerDescription =
  "An inclusive aerial and pole studio and community hub — welcoming all bodies, ages, and abilities to spin, climb, stretch, and connect.";

export const footerServiceLinks = [
  { href: "/classes/pole", label: "Pole Dancing" },
  { href: "/classes/aerial-hoop", label: "Aerial Hoop" },
  { href: "/classes/aerial-silks", label: "Aerial Silks" },
  { href: "/classes/creative-arts-workshops", label: "Creative Arts Workshops" },
  { href: "/parties", label: "Parties & Events" },
  { href: "/hire", label: "Studio Hire" },
];

export const memberAccessLinks = [
  { href: "/membership", label: "Membership" },
  { href: "/register", label: "Sign up" },
  { href: "/login", label: "Login" },
] as const;

export const footerQuickLinks = [
  { href: "/about", label: "About Us" },
  { href: "/classes", label: "Our Classes" },
  { href: "/membership", label: "Membership" },
  { href: "/book", label: "Book a Class" },
  { href: "/community", label: "Community Hub" },
  { href: "/faqs", label: "FAQs" },
  { href: "/contact", label: "Contact" },
];

export const footerLegalLinks = [
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/cookie-policy", label: "Cookie Policy" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/privacy", label: "Data Privacy" },
];

export const homeStats = [
  {
    value: "3+",
    label: "Qualified co-founder instructors",
  },
  {
    value: "4",
    label: "Disciplines — pole, hoop, silks & workshops",
  },
  {
    value: "100%",
    label: "Inclusive, body-positive teaching",
  },
  {
    value: "All",
    label: "Levels, ages & abilities welcome",
  },
];

export const whyChooseUs = {
  title: "Why You Choose Us",
  intro:
    "Wild Hearts Collective is more than a studio — it is a place to feel seen, supported, and inspired. Here is what makes us different.",
  reasons: [
    {
      title: "Inclusive for every body",
      description:
        "All shapes, sizes, ages, and abilities are welcome. We celebrate what your body can do — never what it looks like.",
    },
    {
      title: "Qualified, caring instructors",
      description:
        "Rosie, Jacqui, and Sarah are certified aerial teachers with DBS checks and first aid training — passionate about safe, supportive teaching.",
    },
    {
      title: "Progress at your pace",
      description:
        "No pressure, no comparison. Beginner-friendly classes with clear progressions so you build strength and confidence step by step.",
    },
    {
      title: "A true community hub",
      description:
        "Beyond pole and aerial, we host creative workshops, parties, and events — a space to move, create, and find your people.",
    },
    {
      title: "Safety comes first",
      description:
        "Proper warm-ups, spotting, and equipment care are built into every session so you can explore movement with confidence.",
    },
    {
      title: "Something for everyone",
      description:
        "From your first spin to advanced combinations, private lessons to open training — we help you find the right class for you.",
    },
  ],
};

export const socialLinks = [
  { href: "#", label: "Instagram" },
  { href: "#", label: "Facebook" },
];

export const founders = [
  {
    name: "Rosie",
    role: "Co-founder & Instructor",
    bio: "Qualified aerial instructor passionate about creating an inclusive space where every body feels welcome to move.",
    imageSrc: "/team/rosie.jpg",
  },
  {
    name: "Jacqui",
    role: "Co-founder & Instructor",
    bio: "Dedicated to safe, supportive teaching that helps students build confidence at their own pace.",
    imageSrc: "/team/jacqui.jpg",
  },
  {
    name: "Sarah",
    role: "Co-founder & Instructor",
    bio: "Committed to community, creativity, and high-quality instruction across pole and aerial arts.",
    imageSrc: "/team/sarah.jpg",
  },
];

export const values = [
  "Inclusivity",
  "Safety",
  "Community",
  "Creativity",
];

export const classes = [
  {
    slug: "pole",
    title: "Pole Dancing",
    shortDescription:
      "Build strength, flow, and confidence in a supportive studio environment for all levels.",
    intro:
      "Pole is a full-body workout disguised as pure fun. Whether you are stepping up to the pole for the first time or refining advanced combinations, our classes celebrate progress over perfection.",
    description:
      "Our pole programme blends technique, strength, and artistry in a clean, inclusive studio. Qualified instructors guide you through safe progressions — from foundational grips and spins to dynamic flow and choreography — always at a pace that respects your body and your goals.",
    levels: "Beginner to advanced",
    href: "/classes/pole",
    gradient: "from-pink-light via-pink-soft to-background",
    imageKey: "pole" as const,
    whatToExpect: [
      "A thorough warm-up and mobility focus before any pole work",
      "Clear, step-by-step teaching with spotting when needed",
      "Strength-building drills alongside spins, climbs, and combos",
      "A supportive, body-positive environment with no pressure to perform",
    ],
    highlights: [
      {
        title: "Build real strength",
        description:
          "Develop grip strength, core control, and upper-body power while having fun — many students are amazed by what they achieve in their first few weeks.",
      },
      {
        title: "Find your flow",
        description:
          "Learn to link moves with musicality and expression, whether you prefer athletic pole or softer, dance-inspired movement.",
      },
      {
        title: "Progress with confidence",
        description:
          "Mixed-level and ability-specific sessions mean you are always challenged appropriately, with instructors who know when to push and when to support.",
      },
      {
        title: "A welcoming studio",
        description:
          "No experience needed. No judgment. Just qualified teaching, clean equipment, and a community that cheers you on.",
      },
    ],
    whatToWear:
      "Shorts or fitted leggings and a vest or sports top work best — skin contact helps with grip. Bring water, avoid lotion on class day, and layers for warm-up and cool-down.",
    whoFor:
      "Open to adults of all shapes, sizes, and abilities. Complete beginners are warmly welcome. If you have injuries or health concerns, let your instructor know so we can adapt exercises safely.",
  },
  {
    slug: "aerial-hoop",
    title: "Aerial Hoop",
    shortDescription:
      "Learn beautiful poses, spins, and transitions on the hoop with fully qualified instructors.",
    intro:
      "Aerial hoop — also called lyra — combines strength, grace, and playfulness as you move through mounts, shapes, and spins suspended in the air.",
    description:
      "Discover aerial hoop in our welcoming studio, where patient instructors break down each skill into manageable steps. From your first seat on the hoop to flowing sequences and dynamic movement, every class prioritises safe technique, spotting, and building confidence at height.",
    levels: "All levels",
    href: "/classes/aerial-hoop",
    gradient: "from-pink-soft via-pink-light to-background",
    imageKey: "aerial-hoop" as const,
    whatToExpect: [
      "Warm-up focused on shoulders, core, and grip strength",
      "Foundation mounts and balanced shapes before dynamic work",
      "Spotting and crash-mat safety built into every session",
      "Creative transitions tailored to your current level",
    ],
    highlights: [
      {
        title: "Sculpt and strengthen",
        description:
          "Hoop training builds functional strength through pulls, holds, and controlled movement — you'll feel the difference on and off the apparatus.",
      },
      {
        title: "Create stunning shapes",
        description:
          "Learn elegant poses and lines that look impressive from day one, with progressions that help you feel secure and supported.",
      },
      {
        title: "Patient, expert teaching",
        description:
          "Our instructors specialise in making aerial accessible, explaining terminology clearly and celebrating every small win.",
      },
      {
        title: "Perfect for beginners",
        description:
          "Intro sessions are designed for first-timers — no prior aerial or gymnastics experience required.",
      },
    ],
    whatToWear:
      "Fitted clothing that covers the backs of knees and torso — leggings and a close-fitting top are ideal. Remove jewellery and avoid zips that could catch on the hoop.",
    whoFor:
      "Suitable for teens and adults of all abilities. Beginners and improvers alike will find a class level that fits. Contact us if you are unsure which session to book.",
  },
  {
    slug: "aerial-silks",
    title: "Aerial Silks",
    shortDescription:
      "Climb, wrap, and create stunning lines with step-by-step instruction from certified teachers.",
    intro:
      "Aerial silks invite you to climb, wrap, and descend through the air — a breathtaking discipline that builds strength, flexibility, and creative expression.",
    description:
      "Our silks classes focus on safe wraps, controlled descents, and progressive strength work. Instructors guide you from foundational foot locks and climbs to beautiful sequences, always emphasising technique, spotting, and listening to your body.",
    levels: "All levels",
    href: "/classes/aerial-silks",
    gradient: "from-background via-pink-light to-pink-soft",
    imageKey: "aerial-silks" as const,
    whatToExpect: [
      "Conditioning exercises to prepare wrists, shoulders, and core",
      "Step-by-step wrap breakdowns before attempting full sequences",
      "Low-height progressions for beginners building confidence",
      "Creative freedom as you advance, with safety always first",
    ],
    highlights: [
      {
        title: "Full-body conditioning",
        description:
          "Silks training develops grip endurance, core stability, and flexibility — a rewarding challenge for mind and body.",
      },
      {
        title: "Express yourself in the air",
        description:
          "Combine wraps, drops, and poses into flowing sequences that feel uniquely yours, guided by experienced teachers.",
      },
      {
        title: "Structured progressions",
        description:
          "We never rush skills. Each level builds on the last so you develop solid foundations before moving to advanced work.",
      },
      {
        title: "Inclusive teaching",
        description:
          "Adaptations and alternatives are always available — our priority is that you feel capable, safe, and inspired.",
      },
    ],
    whatToWear:
      "Leggings that cover legs fully and a fitted top — avoid loose fabric that can get caught in wraps. No jewellery or lotions. Bring water and a layer for warm-up.",
    whoFor:
      "All levels welcome, from complete beginners to experienced aerialists. Silks require patience and persistence — perfect for anyone who enjoys a challenge in a supportive setting.",
  },
  {
    slug: "creative-arts-workshops",
    title: "Creative Arts Workshops",
    shortDescription:
      "Arts and crafts sessions for creative expression, wellbeing, and connection.",
    intro:
      "Not every visit to Wild Hearts has to be about aerial or pole. Our creative arts workshops offer a calm, inclusive space to make, explore, and connect — open to all ages and abilities.",
    description:
      "From seasonal crafts and mindful making to collaborative community projects, our workshop programme is designed to complement our movement classes. Whether you want to unwind, try something new, or meet like-minded people, there is a session for you.",
    levels: "Workshops for all ages",
    href: "/classes/creative-arts-workshops",
    gradient: "from-pink-light via-background to-pink-soft",
    imageKey: "community" as const,
    whatToExpect: [
      "Guided, beginner-friendly sessions — no artistic experience needed",
      "All materials provided unless stated otherwise on the booking",
      "A relaxed, social atmosphere with plenty of encouragement",
      "Rotating themes throughout the year — check our timetable for upcoming dates",
    ],
    highlights: [
      {
        title: "Creativity for wellbeing",
        description:
          "Making with your hands is a powerful way to de-stress, express yourself, and take a break from the everyday.",
      },
      {
        title: "All ages welcome",
        description:
          "Family-friendly sessions sit alongside adult-only workshops — something for everyone in the community.",
      },
      {
        title: "Community connection",
        description:
          "Meet new people, share ideas, and be part of a hub that celebrates creativity as much as movement.",
      },
      {
        title: "Local collaborations",
        description:
          "We partner with local makers and small businesses to bring fresh, inspiring workshop themes to the studio.",
      },
    ],
    whatToWear:
      "Comfortable clothes you do not mind getting a little paint, glue, or glitter on. Aprons are provided. Just bring yourself and a willingness to try something new.",
    whoFor:
      "Open to all ages and abilities — perfect for families, friends, or anyone looking for a creative outlet. No movement or fitness background required. Contact us for age guidance on specific sessions.",
  },
];

export const timetable = [
  {
    day: "Tuesday",
    classes: [
      {
        time: "6:00 pm – 7:00 pm",
        title: "Mixed Level Pole",
        description:
          "Suitable for those with some previous pole experience. Instructor-led class covering spins, climbs, and combinations.",
      },
    ],
  },
  {
    day: "Thursday",
    classes: [
      {
        time: "6:00 pm – 7:00 pm",
        title: "Intro to Aerial Hoop",
        description:
          "Perfect for beginners. Learn aerial terminology, basic mounts, shapes, and short transitions to build confidence.",
      },
      {
        time: "7:15 pm – 8:15 pm",
        title: "Mixed Ability Aerial",
        description:
          "A relaxed, supportive class for aerialists of all levels. Beginners welcome.",
      },
    ],
  },
  {
    day: "Saturday",
    classes: [
      {
        time: "By appointment",
        title: "Open Training & Workshops",
        description:
          "Private sessions and creative arts workshops. Please contact us to enquire.",
      },
    ],
  },
];

export const faqs = [
  {
    question: "Do I need to book in advance?",
    answer:
      "Yes. All classes must be booked in advance through this website. Some courses and private lessons require a deposit.",
  },
  {
    question: "What should I wear?",
    answer:
      "Comfortable clothing that allows free movement. For pole and aerial, shorts or fitted leggings work well. Avoid lotion on the day of class.",
  },
  {
    question: "I'm a complete beginner — is that okay?",
    answer:
      "Absolutely. We welcome all abilities and have classes specifically designed for beginners. Contact us if you need help choosing the right class.",
  },
  {
    question: "Are your instructors qualified?",
    answer:
      "Yes. Our team are certified aerial instructors with DBS checks and first aid training.",
  },
  {
    question: "Can children attend?",
    answer:
      "We offer classes and party packages for young people. Contact us to discuss age-appropriate options.",
  },
];
