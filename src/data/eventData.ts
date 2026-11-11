import { DepartmentInfo, FAQItem, Minister, PrayerFocusItem, Testimony, VolunteerDepartment } from "@/lib/types";

export const EVENT_DETAILS = {
  name: "Intimacy",
  type: "12 Hours Prayer Bootcamp",
  tagline: "A 12-Hour Consecrated Atmosphere of Intercession, Divine Encounter & Spiritual Alignment",
  organiser: "King's Pavilion",
  dateFormatted: "Saturday, 5 December 2026",
  dateIso: "2026-12-05",
  timeFormatted: "8:00 AM WAT",
  startTime: "08:00",
  duration: "12 Hours (8:00 AM - 8:00 PM)",
  timezone: "Africa/Lagos (WAT)",
  venue: {
    name: "IPMAN Event Hall",
    landmark: "Beside Harvard Hotel, Opposite NASFAT",
    street: "Ibadan Road",
    city: "Ile Ife",
    state: "Osun State",
    country: "Nigeria",
    fullAddress: "IPMAN Event Hall, beside Harvard Hotel, opposite NASFAT, Ibadan Road, Ile Ife, Osun State, Nigeria",
  },
  cost: "Free Admission (Registration Required)",
  description:
    "Intimacy is a dedicated 12-hour prayer bootcamp convened by King's Pavilion. Designed for believers seeking deep communion with God, spiritual revival, corporate intercession, and personal transformation through fervent, sustained prayer and Word-centered worship.",
  missingAssets: {
    officialLogo: "Official King's Pavilion logo pending submission by church administration.",
    eventFlyer: "Final high-resolution Intimacy event flyer artwork pending upload by media team.",
    verifiedMapLink: "Official map coordinates and verified transport directions will be updated upon organiser confirmation.",
    officialContactPhone: "Official church inquiry line pending publication.",
    officialContactEmail: "Official church inquiry email pending publication.",
    socialLinks: "Official King's Pavilion social channels will be linked upon verification.",
  },
} as const;

export const VOLUNTEER_DEPARTMENTS: DepartmentInfo[] = [
  {
    name: "Prayer",
    description: "Support the continuous spiritual altar, intercession shifts, and prayer room assistance throughout the 12-hour bootcamp.",
    keyResponsibilities: [
      "Participate in designated pre-event intercession watches",
      "Anchor continuous prayer support during sessions",
      "Minister in altar call and individual prayer ministry as assigned",
    ],
    meetingRequirementNotice: "Mandatory pre-bootcamp prayer briefing schedule will be announced in the departmental channel.",
  },
  {
    name: "Media",
    description: "Manage visual production, live streaming, audio-visual support, photography, and real-time social coverage.",
    keyResponsibilities: [
      "Operate video cameras, audio consoles, and projection equipment",
      "Capture still photography and session highlights",
      "Assist with digital media distribution and recording archival",
    ],
    meetingRequirementNotice: "Media briefing and gear check will take place prior to event day.",
  },
  {
    name: "Ushering",
    description: "Welcome attendees with warmth, guide seating arrangements, facilitate offering collection, and maintain sanctuary order.",
    keyResponsibilities: [
      "Greet and direct attendees entering IPMAN Event Hall",
      "Coordinate hall seating capacity and aisle clearance",
      "Distribute programme materials and assist with crowd flow",
    ],
    meetingRequirementNotice: "Ushering protocols meeting will be held prior to event commencement.",
  },
  {
    name: "Protocol",
    description: "Provide dedicated hospitality, guest logistics, minister care, and coordinate VIP seating arrangements.",
    keyResponsibilities: [
      "Reception and hospitality for visiting ministers and dignitaries",
      "Escort and logistics coordination within the venue",
      "Coordination with security and executive teams",
    ],
    meetingRequirementNotice: "Protocol orientation is required for all assigned volunteers.",
  },
  {
    name: "Sanitation",
    description: "Ensure the venue, washrooms, dining areas, and surrounding grounds remain immaculate, hygienic, and dignified.",
    keyResponsibilities: [
      "Pre-event hall sanitation and readiness",
      "Periodic sanitisation of facilities during the 12-hour event",
      "Post-event comprehensive cleanup and restoration",
    ],
    meetingRequirementNotice: "Sanitation team briefing will precede early hall setup.",
  },
  {
    name: "Care",
    description: "Provide first aid support, emergency comfort, attendee welfare assistance, and hospitality support for special needs.",
    keyResponsibilities: [
      "Provide basic first aid assistance and monitor attendee wellbeing",
      "Support nursing mothers, elderly attendees, and those requiring special assistance",
      "Coordinate rapid response with health personnel if emergency arises",
    ],
    meetingRequirementNotice: "Care and welfare orientation session will be communicated.",
  },
  {
    name: "Logistics",
    description: "Coordinate venue setup, electrical/generator power reliability, stage furniture, ventilation, and material distribution.",
    keyResponsibilities: [
      "Hall layout setup, lighting, and heavy equipment positioning",
      "Monitor power generators and backup electrical equipment",
      "Coordinate delivery and teardown of event rentals",
    ],
    meetingRequirementNotice: "Logistics shift starts with early morning venue prep.",
  },
  {
    name: "Security",
    description: "Oversee compound security, perimeter monitoring, parking control, crowd safety, and entry coordination.",
    keyResponsibilities: [
      "Manage vehicle parking at IPMAN Hall along Ibadan Road",
      "Monitor access gates and ensure crowd safety",
      "Collaborate with venue and local emergency personnel",
    ],
    meetingRequirementNotice: "Security strategy briefing will occur ahead of arrival.",
  },
];

export const PLACEHOLDER_MINISTERS: Minister[] = [
  {
    id: "minister-placeholder-1",
    name: "Keynote Minister (Pending Announcement)",
    title: "Guest Minister",
    biography: "Official minister biography and profile will be published here upon formal announcement by King's Pavilion leadership.",
    ministryPosition: "Apostolic & Prophetic Ministry",
    programmeRole: "Keynote Word & Prayer Session",
    isPlaceholder: true,
    publicationStatus: "draft",
  },
  {
    id: "minister-placeholder-2",
    name: "Host Minister (King's Pavilion)",
    title: "Senior Pastor / Convener",
    biography: "Full pastoral profile and message from the convener will be published once officially confirmed by the secretariat.",
    ministryPosition: "King's Pavilion Leadership",
    programmeRole: "Convener & Bootcamp Host",
    isPlaceholder: true,
    publicationStatus: "draft",
  },
  {
    id: "minister-placeholder-3",
    name: "Worship Leader (Pending Announcement)",
    title: "Guest Psalmist",
    biography: "Worship minister profile and session details will be updated once confirmed by the programme planning committee.",
    ministryPosition: "Prophetic Worship Ministry",
    programmeRole: "Intimacy Worship & Altar Adoration",
    isPlaceholder: true,
    publicationStatus: "draft",
  },
];

export const PLACEHOLDER_TESTIMONIES: Testimony[] = [
  {
    id: "testimony-sample-1",
    slug: "sample-breakthrough-in-prayer",
    testifierName: "Attendee Testimony (Sample Layout)",
    title: "Encountering God's Tangible Presence in Deep Intercession",
    excerpt: "This is a formatted layout placeholder demonstrating how verified testimonies will be presented once reviewed and published by authorised administrators.",
    fullTestimony:
      "This is a sample testimony card to demonstrate the typography, layout, and reading experience of the Intimacy platform. Official testimonies will only be published after verification and explicit consent from testifiers. King's Pavilion strictly adheres to publishing verified experiences of God's grace and divine intervention.",
    isPlaceholder: true,
    publicationStatus: "draft",
    createdAt: "2026-10-01",
  },
  {
    id: "testimony-sample-2",
    slug: "sample-healing-and-restoration",
    testifierName: "Miracle & Healing Experience (Sample Layout)",
    title: "Restoration of Spiritual Fire and Clarity",
    excerpt: "A sample placeholder showing how long-form testimony previews appear on the homepage and public testimony archives.",
    fullTestimony:
      "A demonstration of the public reading layout for Intimacy testimonies. Once the event concludes and verified testimonies are submitted through authorized pastoral channels, they will be curated, formatted, and published with accompanying details.",
    isPlaceholder: true,
    publicationStatus: "draft",
    createdAt: "2026-10-15",
  },
  {
    id: "testimony-sample-3",
    slug: "sample-corporate-breakthrough",
    testifierName: "Answered Prayer (Sample Layout)",
    title: "The Power of Corporate Agreement Across 12 Hours",
    excerpt: "Visual layout placeholder. Real testimonies from previous bootcamp editions will be linked here once provided by the media department.",
    fullTestimony:
      "Demonstrating the card layout, excerpt clipping, and reader modal. The platform does not fabricate personal accounts or spiritual experiences; authentic records will be entered via the administrative dashboard.",
    isPlaceholder: true,
    publicationStatus: "draft",
    createdAt: "2026-10-20",
  },
];

export const PLACEHOLDER_PRAYER_FOCUS: PrayerFocusItem[] = [
  {
    id: "prayer-focus-1",
    title: "Spiritual Revival & The Altar of Fire",
    scriptureReference: "Leviticus 6:13",
    description: "Official prayer focus points approved by the convener will be listed here. Focus on rekindling personal spiritual hunger, purity, and the baptism of prayer.",
    session: "Morning Watch (8:00 AM - 11:00 AM)",
    isDraftPlaceholder: true,
  },
  {
    id: "prayer-focus-2",
    title: "National Transformation & Kingdom Alignment",
    scriptureReference: "2 Chronicles 7:14",
    description: "Official intercession topics for the body of Christ, community impact in Ile Ife, Osun State, and the nation of Nigeria.",
    session: "Midday Intercession (11:00 AM - 3:00 PM)",
    isDraftPlaceholder: true,
  },
  {
    id: "prayer-focus-3",
    title: "Personal Breakthrough, Healing & Prophetic Impartation",
    scriptureReference: "Isaiah 10:27",
    description: "Targeted prayers breaking limitations, activating spiritual gifts, and releasing supernatural breakthroughs for all attendees.",
    session: "Afternoon & Evening Climax (3:00 PM - 8:00 PM)",
    isDraftPlaceholder: true,
  },
];

export const PLACEHOLDER_FAQS: FAQItem[] = [
  {
    id: "faq-1",
    category: "general",
    question: "Is there any registration fee or ticket cost to attend Intimacy?",
    answer: "No. Attendance is 100% free of charge. However, individual registration is required to receive your registration reference and guarantee orderly hall admission.",
    isDraftPlaceholder: false,
  },
  {
    id: "faq-2",
    category: "venue",
    question: "Where is IPMAN Event Hall located in Ile Ife?",
    answer: "IPMAN Event Hall is situated along Ibadan Road in Ile Ife, Osun State. Key landmarks: it is directly beside Harvard Hotel and opposite NASFAT. Landmark signage and ushering team members will guide arriving attendees.",
    isDraftPlaceholder: false,
  },
  {
    id: "faq-3",
    category: "general",
    question: "What is the duration of the prayer bootcamp?",
    answer: "The event is a continuous 12-hour prayer bootcamp running from 8:00 AM WAT to 8:00 PM WAT on Saturday, 5 December 2026. Attendees are encouraged to arrive by 7:30 AM for smooth check-in.",
    isDraftPlaceholder: false,
  },
  {
    id: "faq-4",
    category: "volunteering",
    question: "Can I register as an attendee and also apply to volunteer?",
    answer: "Yes! Applying to serve in one of our eight volunteer departments does not prevent you from registering as an attendee, and vice versa. Each workflow is evaluated independently.",
    isDraftPlaceholder: false,
  },
  {
    id: "faq-5",
    category: "registration",
    question: "What happens after I complete my registration?",
    answer: "In the fully deployed platform (Phase 4), successful registration will generate a unique registration reference and personal QR code for check-in at the venue entrance, with a confirmation delivered to your email.",
    isDraftPlaceholder: false,
  },
  {
    id: "faq-6",
    category: "venue",
    question: "Are public transport and parking available at the venue?",
    answer: "Yes. IPMAN Event Hall is on the major Ibadan Road corridor, accessible by taxis and public transport in Ile Ife. Our Security and Logistics departments will coordinate dedicated on-site vehicle parking.",
    isDraftPlaceholder: false,
  },
];
