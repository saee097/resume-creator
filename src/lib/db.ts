import type {
  Job,
  InterviewQuestion,
  Profile,
  Resume,
  ResumeVersion,
  User,
} from "./types";
import { id, now } from "./utils";

const SEED_JOBS: Job[] = [
  {
    id: "job_frontend",
    title: "Frontend Engineer",
    company: "Nova Labs",
    location: "Remote",
    type: "Full-time",
    level: "Mid",
    salaryRange: "$90k - $120k",
    description:
      "Build polished, accessible web experiences using React and TypeScript. Work closely with design and product to ship features fast.",
    requirements: [
      "React",
      "TypeScript",
      "CSS",
      "Next.js",
      "Testing",
      "Accessibility",
    ],
    responsibilities: [
      "Implement reusable UI components",
      "Improve performance and accessibility",
      "Collaborate with designers",
    ],
    postedAt: now(),
  },
  {
    id: "job_data",
    title: "Data Scientist",
    company: "Quanta AI",
    location: "New York, NY",
    type: "Full-time",
    level: "Senior",
    salaryRange: "$130k - $170k",
    description:
      "Design models that power recommendation and forecasting products. Own experiments end to end.",
    requirements: [
      "Python",
      "Machine Learning",
      "SQL",
      "Statistics",
      "Pandas",
      "Communication",
    ],
    responsibilities: [
      "Build predictive models",
      "Run A/B experiments",
      "Present insights to stakeholders",
    ],
    postedAt: now(),
  },
  {
    id: "job_pm",
    title: "Product Manager",
    company: "Brightwave",
    location: "San Francisco, CA",
    type: "Full-time",
    level: "Mid",
    salaryRange: "$120k - $150k",
    description:
      "Drive product strategy for our growth surfaces. Partner with engineering and design to deliver impact.",
    requirements: [
      "Roadmapping",
      "Analytics",
      "Communication",
      "Leadership",
      "SQL",
    ],
    responsibilities: [
      "Define product roadmap",
      "Analyze usage data",
      "Align cross-functional teams",
    ],
    postedAt: now(),
  },
  {
    id: "job_design",
    title: "UX Designer",
    company: "Studio Form",
    location: "Remote",
    type: "Contract",
    level: "Mid",
    salaryRange: "$70k - $95k",
    description:
      "Craft intuitive product experiences from research to high-fidelity design for a fast-growing SaaS.",
    requirements: [
      "Figma",
      "User Research",
      "Prototyping",
      "Accessibility",
      "Communication",
    ],
    responsibilities: [
      "Run user research",
      "Produce design systems",
      "Validate with prototypes",
    ],
    postedAt: now(),
  },
  {
    id: "job_devops",
    title: "DevOps Engineer",
    company: "Cloudpeak",
    location: "Austin, TX",
    type: "Full-time",
    level: "Senior",
    salaryRange: "$140k - $180k",
    description:
      "Own our cloud infrastructure and CI/CD. Make deployments boring and reliable.",
    requirements: [
      "AWS",
      "Kubernetes",
      "Terraform",
      "CI/CD",
      "Linux",
      "Monitoring",
    ],
    responsibilities: [
      "Maintain Kubernetes clusters",
      "Automate pipelines",
      "Improve observability",
    ],
    postedAt: now(),
  },
  {
    id: "job_marketing",
    title: "Growth Marketing Manager",
    company: "Launchpad",
    location: "Remote",
    type: "Full-time",
    level: "Mid",
    salaryRange: "$85k - $110k",
    description:
      "Own paid and organic acquisition channels. Use data to scale what works.",
    requirements: [
      "SEO",
      "Paid Ads",
      "Analytics",
      "Communication",
      "Experimentation",
    ],
    responsibilities: [
      "Run acquisition campaigns",
      "Optimize funnel conversion",
      "Report on ROI",
    ],
    postedAt: now(),
  },
];

const SEED_QUESTIONS: InterviewQuestion[] = [
  {
    id: "q_1",
    category: "behavioral",
    level: "All",
    question: "Tell me about a time you disagreed with a teammate. How did you handle it?",
    suggestedAnswer:
      "Use the STAR method: describe the situation, the conflict, the collaborative resolution, and the positive outcome. Emphasize listening and finding common ground.",
  },
  {
    id: "q_2",
    category: "behavioral",
    level: "All",
    question: "Describe a project you are proud of and your specific contribution.",
    suggestedAnswer:
      "Quantify impact (e.g., 'reduced load time by 40%'). Clearly separate what you did from what the team did.",
  },
  {
    id: "q_3",
    category: "situational",
    level: "All",
    question: "How would you prioritize when two urgent deadlines collide?",
    suggestedAnswer:
      "Communicate early with stakeholders, assess business impact, and propose a realistic plan. Show you negotiate scope transparently.",
  },
  {
    id: "q_4",
    category: "technical",
    level: "Engineering",
    question: "Explain the difference between let, const, and var in JavaScript.",
    suggestedAnswer:
      "var is function-scoped and hoisted; let and const are block-scoped. const cannot be reassigned. Prefer const and let for predictability.",
  },
  {
    id: "q_5",
    category: "technical",
    level: "Data",
    question: "How would you handle missing data in a dataset?",
    suggestedAnswer:
      "Assess the mechanism (MCAR, MAR, MNAR), then consider deletion, mean/median imputation, or model-based approaches. Document the choice.",
  },
  {
    id: "q_6",
    category: "general",
    level: "All",
    question: "Where do you see yourself in 3 years?",
    suggestedAnswer:
      "Tie your growth to the company's mission. Show ambition that benefits both you and the team.",
  },
  {
    id: "q_7",
    category: "situational",
    level: "Leadership",
    question: "A direct report is underperforming. What do you do?",
    suggestedAnswer:
      "Gather context, give specific feedback, create a development plan with measurable goals, and follow up consistently.",
  },
  {
    id: "q_8",
    category: "technical",
    level: "Design",
    question: "How do you ensure your designs are accessible?",
    suggestedAnswer:
      "Follow WCAG contrast ratios, support keyboard navigation, use semantic elements, and test with screen readers.",
  },
];

export interface Database {
  users: User[];
  resumes: Resume[];
  resumeVersions: ResumeVersion[];
  profile: Profile;
  jobs: Job[];
  questions: InterviewQuestion[];
}

function seedDatabase(): Database {
  const demoUser: User = {
    id: "user_demo",
    name: "Alex Carter",
    email: "alex@example.com",
    userType: "professional",
    headline: "Full-stack engineer crafting delightful products",
    createdAt: now(),
  };

  const demoResume: Resume = {
    id: "resume_demo",
    userId: demoUser.id,
    title: "My Primary Resume",
    template: "modern",
    contact: {
      fullName: "Alex Carter",
      email: "alex@example.com",
      phone: "+1 555 0100",
      location: "Remote",
      linkedin: "linkedin.com/in/alexcarter",
      github: "github.com/alexcarter",
    },
    summary:
      "Engineer with 5+ years building web products. Passionate about performance, accessibility, and great UX.",
    experience: [
      {
        id: id("exp"),
        company: "TechNova",
        role: "Senior Frontend Engineer",
        startDate: "2021-01",
        current: true,
        location: "Remote",
        bullets: [
          "Led migration to Next.js, cutting load time by 40%",
          "Mentored 4 engineers and established code review standards",
        ],
      },
    ],
    education: [
      {
        id: id("edu"),
        school: "State University",
        degree: "B.S.",
        field: "Computer Science",
        startDate: "2014",
        endDate: "2018",
      },
    ],
    skills: ["React", "TypeScript", "Next.js", "Node.js", "CSS", "Testing"],
    projects: [],
    updatedAt: now(),
  };

  const demoProfile: Profile = {
    id: "profile_demo",
    userId: demoUser.id,
    avatar: { initials: "AC" },
    basicInfo: {
      fullName: demoUser.name,
      headline: demoUser.headline,
      email: demoUser.email,
      phone: demoResume.contact.phone,
      bio: demoResume.summary,
      userType: demoUser.userType,
    },
    location: {
      remoteOnly: true,
      willingToRelocate: false,
    },
    experience: demoResume.experience,
    skills: demoResume.skills,
    languages: [{ language: "English", level: "native" }],
    links: [
      { label: "LinkedIn", url: demoResume.contact.linkedin ?? "" },
      { label: "GitHub", url: demoResume.contact.github ?? "" },
    ],
    preferences: {
      jobTypes: ["Full-time"],
      workModes: ["remote"],
      minSalary: 120000,
      industries: ["Technology", "SaaS"],
      openToOpportunities: true,
    },
    careerGoals: [
      {
        id: id("goal"),
        title: "Lead a frontend engineering team",
        targetDate: "2027",
        description: "Grow into a staff/lead role focused on developer experience.",
      },
    ],
    updatedAt: now(),
  };

  return {
    users: [demoUser],
    resumes: [demoResume],
    resumeVersions: [],
    profile: demoProfile,
    jobs: SEED_JOBS,
    questions: SEED_QUESTIONS,
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __RESUME_DB__: Database | undefined;
}

export function getDb(): Database {
  if (!globalThis.__RESUME_DB__) {
    globalThis.__RESUME_DB__ = seedDatabase();
  }
  return globalThis.__RESUME_DB__;
}
