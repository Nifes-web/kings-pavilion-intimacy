import { supabaseServer } from "@/lib/supabaseClient";
import {
  EVENT_DETAILS,
  PLACEHOLDER_FAQS,
  PLACEHOLDER_TESTIMONIES,
} from "@/data/eventData";
import { getAssetAssignments } from "@/lib/mediaService";
export { getAssetAssignments };

// Fallback ministers with verified portrait asset paths
export const FALLBACK_MINISTERS = [
  {
    id: "david-olayiwola",
    slug: "david-olayiwola",
    name: "Pastor David Olayiwola",
    role_title: "Minister",
    category: "Minister",
    biography: "",
    photo_url: "/assets/ministers/portraits/david-olayiwola.jpg",
    display_order: 1,
    is_published: true,
  },
  {
    id: "amas-amajo",
    slug: "amas-amajo",
    name: "Pastor Amas Amajo",
    role_title: "Guest Minister",
    category: "Guest Minister",
    biography:
      "Pastor Amas Amajo holds a Bachelor’s degree in History and International Relations and a Postgraduate Diploma in Theology. He is an international evangelist and teacher of God’s Word. His ministry has reached campuses and churches through conferences, crusades, and the Amas Amajo Radio broadcast and other media platforms. As a pastor in RCCG, he currently serves as Pastor in Charge of Youth Province 23, headquartered in Ile-Ife, Osun State.",
    photo_url: "/assets/ministers/portraits/amas-amajo.jpg",
    display_order: 2,
    is_published: true,
  },
  {
    id: "isaiah-adesupo",
    slug: "isaiah-adesupo",
    name: "Pastor Isaiah Adebambowale Adesupo",
    role_title: "Guest Minister",
    category: "Guest Minister",
    biography:
      "Pastor Engr. Isaiah Adebambowale Adesupo is the Pastor in Charge of UMCA Redemption Chapel, Ilesa, Osun State, and the Founder/MD/CEO of Adebambowale Engineering Limited. A minister with a dual mandate in the marketplace and in ministry, he holds a Master of Divinity from UMCATS, Ilorin.",
    photo_url: "/assets/ministers/portraits/isaiah-adebambowale-adesupo.jpg",
    display_order: 3,
    is_published: true,
  },
  {
    id: "victor-olamide",
    slug: "victor-olamide",
    name: "Pastor Victor Olamide",
    role_title: "Guest Minister",
    category: "Guest Minister",
    biography:
      "Pastor Victor Olamide is a man set apart by God for the work of the ministry, called to raise men, build lives, and advance the purposes of God in his generation. He serves as the set man of Adullam Ministries.",
    photo_url: "/assets/ministers/portraits/victor-olamide.jpg",
    display_order: 4,
    is_published: true,
  },
  {
    id: "fikayo-afolabi",
    slug: "fikayo-afolabi",
    name: "Pastor Fikayo Afolabi",
    role_title: "Guest Minister",
    category: "Guest Minister",
    biography:
      "Fikayo Afolabi is a passionate minister of God, teacher, mentor, and visionary leader with a deep burden for teenagers and young people. He is the President of Christ Alignment Mission and convener of Pneuma Summit.",
    photo_url: "/assets/ministers/portraits/fikayo-afolabi.jpg",
    display_order: 5,
    is_published: true,
  },
  {
    id: "uche-peter",
    slug: "uche-peter",
    name: "Uche Peter",
    role_title: "Minister",
    category: "Minister",
    biography:
      "Uchechukwu Peter Isioma, popularly known as Uche Peter, serves as the Head of the Burden Bearers Prayer Network, a community of believers committed to intercession and spiritual growth.",
    photo_url: "/assets/ministers/portraits/uche-peter.jpg",
    display_order: 6,
    is_published: true,
  },
  {
    id: "bethel-emmanuel",
    slug: "bethel-emmanuel",
    name: "Bethel Emmanuel",
    role_title: "Minstrel",
    category: "Minstrel",
    biography: "",
    photo_url: "/assets/ministers/portraits/bethel-emmanuel.jpg",
    display_order: 7,
    is_published: true,
  },
];

// Fallback Section Contents
export const FALLBACK_SITE_CONTENT: Record<
  string,
  { title: string; subtitle?: string; content: Record<string, any> }
> = {
  hero: {
    title: "12 Hours of Prayer, Warfare & Consecration",
    subtitle: "King's Pavilion Presents • Hour of Incubation",
    content: {
      headline_highlight: "INTIMACY",
      event_tag: "Bootcamp 2026",
      description:
        "A consecrated 12-hour spiritual altar convened at IPMAN Event Hall, Ile Ife, Osun State. Join united intercessors for sustained prayer, prophetic worship, and spiritual revival.",
      date: "Sat, 5 Dec 2026",
      time: "8:00 AM WAT (12 Continuous Hours)",
      venue: "IPMAN Hall, Ibadan Rd, Ile Ife",
      admission: "Free Admission",
      register_button_text: "Register to Attend (Free)",
      volunteer_button_text: "Apply as Volunteer",
    },
  },
  about: {
    title: "A Consecrated 12-Hour Spiritual Altar",
    subtitle: "The Vision & Sacred Calling",
    content: {
      description:
        "Intimacy is a dedicated 12-hour prayer bootcamp convened by King's Pavilion. Designed for believers seeking deep communion with God, spiritual revival, corporate intercession, and personal transformation through fervent, sustained prayer and Word-centered worship.",
      coreFocus: [
        "12 Continuous Hours of Consecrated Prayer",
        "Apostolic & Prophetic Exhortation",
        "Deep Worship & Altar Ministry",
        "Corporate Intercession for the Land",
      ],
    },
  },
  event_info: {
    title: "Venue, Location & Directions",
    subtitle: "IPMAN Event Hall • Ile Ife",
    content: {
      date: EVENT_DETAILS.dateFormatted,
      time: EVENT_DETAILS.timeFormatted,
      venueName: EVENT_DETAILS.venue.name,
      landmark: EVENT_DETAILS.venue.landmark,
      address: EVENT_DETAILS.venue.fullAddress,
      admissionNote: "Admission is completely free; registration is required.",
    },
  },
  volunteer_callout: {
    title: "Serve in the Courts of the Lord",
    subtitle: "Consecrated Volunteer Opportunities",
    content: {
      headline: "Serve in One of 8 Consecrated Departments",
      description:
        "Applicants select exactly one consecrated service department: Prayer, Media, Ushering, Protocol, Sanitation, Care, Logistics, or Security for the 12 Hours Prayer Bootcamp.",
      note: "Volunteer registration is evaluated independently of attendee registration.",
    },
  },
  closing_cta: {
    title: "Secure Your Seat at the Altar",
    subtitle: "Join Believers in 12 Hours of Continuous Prayer",
    content: {
      headline: "Join the Altar of Incubation. Free Registration Pass.",
      description:
        "Do not miss this 12-hour sacred encounter. Reserve your attendee place today.",
      primaryCta: "Register to Attend Now",
      secondaryCta: "Apply as Volunteer",
    },
  },
  expectations: {
    title: "Explore the Bootcamp Experience",
    subtitle: "Programme Dimensions",
    content: {
      description:
        "Four consecrated pillars orchestrating an unforgettable 12-hour prayer incubation at IPMAN Event Hall.",
      ctaText: "Register for the Full 12 Hours",
      items: [
        {
          title: "12-Hour Continuous Intercession",
          desc: "A full day of focused prayer, from 8 AM to 8 PM, unbroken worship for the kingdom.",
        },
        {
          title: "Deep Prophetic Worship",
          desc: "Heart-felt worship inviting God's presence and prophetic insight.",
        },
        {
          title: "Spiritual Warfare",
          desc: "Targeted prayers breaking chains and standing firm in authority.",
        },
        {
          title: "Incubation & Impartation",
          desc: "Quiet waiting on God for personal callings and fresh anointing.",
        },
      ],
    },
  },
  prayer_focus: {
    title: "Official Prayer Focus",
    subtitle: "Themes of Intercession",
    content: {
      description:
        "Strategic corporate prayer focuses guiding the 12-hour prayer incubation watches.",
      note: "Corporate themes are public. Personal prayer points submitted during individual registration remain strictly confidential.",
      focuses: [
        {
          id: "prayer-focus-1",
          title: "Spiritual Revival & The Altar of Fire",
          scriptureReference: "Leviticus 6:13",
          description:
            "Official prayer focus points approved by the convener will be listed here. Focus on rekindling personal spiritual hunger, purity, and the baptism of prayer.",
          session: "Morning Watch (8:00 AM - 11:00 AM)",
        },
        {
          id: "prayer-focus-2",
          title: "National Transformation & Kingdom Alignment",
          scriptureReference: "2 Chronicles 7:14",
          description:
            "Official intercession topics for the body of Christ, community impact in Ile Ife, Osun State, and the nation of Nigeria.",
          session: "Midday Intercession (11:00 AM - 3:00 PM)",
        },
        {
          id: "prayer-focus-3",
          title: "Personal Breakthrough, Healing & Prophetic Impartation",
          scriptureReference: "Isaiah 10:27",
          description:
            "Targeted prayers breaking limitations, activating spiritual gifts, and releasing supernatural breakthroughs for all attendees.",
          session: "Afternoon & Evening Climax (3:00 PM - 8:00 PM)",
        },
      ],
    },
  },
};

/**
 * Loads published site content for a section with graceful fallback.
 */
export async function getSiteContent(sectionKey: string) {
  try {
    const { data, error } = await supabaseServer
      .from("site_content")
      .select("title, subtitle, content, updated_at")
      .eq("section_key", sectionKey)
      .eq("status", "published")
      .maybeSingle();

    if (error || !data) {
      return FALLBACK_SITE_CONTENT[sectionKey] || null;
    }

    return {
      title: data.title,
      subtitle: data.subtitle,
      content: {
        ...(FALLBACK_SITE_CONTENT[sectionKey]?.content || {}),
        ...(typeof data.content === "object" ? data.content : {}),
      },
    };
  } catch {
    return FALLBACK_SITE_CONTENT[sectionKey] || null;
  }
}

/**
 * Loads published ministers from database with graceful fallback.
 */
export async function getPublishedMinisters() {
  try {
    const { data, error } = await supabaseServer
      .from("ministers")
      .select("id, slug, name, role_title, category, biography, photo_url, display_order")
      .eq("is_published", true)
      .order("display_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return FALLBACK_MINISTERS;
    }

    return data;
  } catch {
    return FALLBACK_MINISTERS;
  }
}

/**
 * Loads published FAQs from database with graceful fallback.
 */
export async function getPublishedFaqs() {
  try {
    const { data, error } = await supabaseServer
      .from("faqs")
      .select("id, slug, question, answer, category, display_order")
      .eq("is_published", true)
      .order("display_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return PLACEHOLDER_FAQS.map((f, i) => ({
        id: f.id,
        slug: f.id,
        question: f.question,
        answer: f.answer,
        category: f.category,
        display_order: i + 1,
      }));
    }

    return data;
  } catch {
    return PLACEHOLDER_FAQS.map((f, i) => ({
      id: f.id,
      slug: f.id,
      question: f.question,
      answer: f.answer,
      category: f.category,
      display_order: i + 1,
    }));
  }
}

/**
 * Loads active announcements from database with graceful fallback.
 */
export async function getActiveAnnouncements() {
  const now = new Date();
  try {
    const { data, error } = await supabaseServer
      .from("announcements")
      .select("id, slug, title, content, priority, start_date, end_date")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      // Strictly enforce scheduling and automatic expiration
      return data.filter((item) => {
        const start = item.start_date ? new Date(item.start_date) : null;
        const end = item.end_date ? new Date(item.end_date) : null;
        if (start && start > now) return false; // Scheduled for future
        if (end && end < now) return false;     // Expired
        return true;
      });
    }

    return [];
  } catch {
    return [];
  }
}

/**
 * Loads published testimonies from database with graceful fallback.
 */
export async function getPublishedTestimonies() {
  try {
    const { data, error } = await supabaseServer
      .from("testimonies")
      .select("id, slug, testifier_name, content, profile_image, created_at")
      .or("published.eq.true,status.eq.published")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return PLACEHOLDER_TESTIMONIES.map((t) => ({
        id: t.id,
        slug: t.slug,
        testifier_name: t.testifierName,
        content: t.fullTestimony || t.excerpt,
        profile_image: t.profilePhotoPath || null,
        created_at: t.createdAt,
      }));
    }

    return data;
  } catch {
    return PLACEHOLDER_TESTIMONIES.map((t) => ({
      id: t.id,
      slug: t.slug,
      testifier_name: t.testifierName,
      content: t.fullTestimony || t.excerpt,
      profile_image: t.profilePhotoPath || null,
      created_at: t.createdAt,
    }));
  }
}

/**
 * Loads public site settings with graceful fallback.
 */
export async function getPublicSiteSettings(): Promise<Record<string, any>> {
  const fallbackSettings: Record<string, any> = {
    event_name: EVENT_DETAILS.name,
    event_date: EVENT_DETAILS.dateFormatted,
    event_time: EVENT_DETAILS.timeFormatted,
    venue_name: EVENT_DETAILS.venue.name,
    venue_address: EVENT_DETAILS.venue.fullAddress,
    social_instagram: "@Rccg_kings_Pavilion_Ife",
    registration_open: true,
  };

  try {
    const { data, error } = await supabaseServer
      .from("site_settings")
      .select("key, value")
      .eq("is_public", true);

    if (error || !data || data.length === 0) {
      return fallbackSettings;
    }

    const settings = { ...fallbackSettings };
    for (const item of data) {
      settings[item.key] = item.value;
    }
    return settings;
  } catch {
    return fallbackSettings;
  }
}

