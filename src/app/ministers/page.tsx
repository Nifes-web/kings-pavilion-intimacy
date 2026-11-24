import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ArrowLeft } from "lucide-react";
import { getPublishedMinisters } from "@/lib/contentService";
import { getGlobalBranding } from "@/lib/brandingService";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

// Minister data – photos are stored in public/assets/ministers
const ministers = [
  {
    name: "Pastor David Olayiwola",
    category: "Minister",
    img: "/assets/ministers/portraits/david-olayiwola.jpg",
    biography: "",
  },
  {
    name: "Pastor Amas Amajo",
    category: "Guest Minister",
    img: "/assets/ministers/portraits/amas-amajo.jpg",
    biography: `Pastor Amas Amajo holds a Bachelor’s degree in History and International Relations and a Postgraduate Diploma in Theology. He is an international evangelist and teacher of God’s Word. His ministry has reached campuses and churches through conferences, crusades, and the Amas Amajo Radio broadcast and other media platforms.

In April 2021, he began hosting regular outreaches and crusades in various cities, villages, and campuses in and outside Nigeria. These outreaches, now called ARISE & SUPERNATURAL ENCOUNTER, have recorded many souls saved to the glory of God.

As a pastor in The Redeemed Christian Church of God, he has served in various capacities and played key roles in pioneering and planting churches. He served as Regional Pastor covering Regions 61, 54, 7 and 48 in South East Nigeria, and as Assistant Pastor in Charge of Province (APICP ADMIN), Youth Province 12, Osun State. He currently serves as Pastor in Charge of Youth Province 23, headquartered in Ile-Ife, Osun State.

He is happily married to Pastor Amarachi Amajo, and their marriage is blessed with wonderful children.`,
  },
  {
    name: "Pastor Isaiah Adebambowale Adesupo",
    category: "Guest Minister",
    img: "/assets/ministers/portraits/isaiah-adebambowale-adesupo.jpg",
    biography: `Pastor Engr. Isaiah Adebambowale Adesupo is the Pastor in Charge of UMCA Redemption Chapel, Ilesa, Osun State, and the Founder/MD/CEO of Adebambowale Engineering Limited.

A minister with a dual mandate in the marketplace and in ministry, he is a trained Civil Engineer with an OND from Federal Polytechnic, Offa; a B.Tech from LAUTECH, Ogbomoso; an M.Tech in view from LAUTECH; and a Master of Divinity from UMCATS, Ilorin.

He is a passionate builder — building lives and building structures for God’s glory. God has used him to raise godly families, train young ministers, and execute durable engineering projects across Oyo, Osun, and other states.

He is happily married to his beloved wife and partner in ministry, Pastor (Mrs.) Esther Odunayo Adesupo, and they are blessed with a daughter.`,
  },
  {
    name: "Pastor Victor Olamide",
    category: "Guest Minister",
    img: "/assets/ministers/portraits/victor-olamide.jpg",
    biography: `Pastor Victor Olamide is a man set apart by God for the work of the ministry, called to raise men, build lives, and advance the purposes of God in his generation.

He is a minister of God resident in Ede and a builder of men who has laboured several years in the Land with an Apostolic Mandate.

With years of pastoral ministry, he now serves as the set man of Adullam Ministries, where he has been instrumental in raising men of multifaceted skills in their various spheres of influence with strength and capacity, while imprinting upon them the mark of Christ.

He is a teacher of God’s Word whose utterance carries apostolic weight, bringing conviction, awakening purpose, and calling men out of spiritual obscurity into the reality of their prophetic identity and destiny.

His ministry is a call to depth, discipline, consecration, and kingdom impact — raising men who do not merely profess Christ, but are formed by Christ and sent for His purpose.`,
  },
  {
    name: "Pastor Fikayo Afolabi",
    category: "Guest Minister",
    img: "/assets/ministers/portraits/fikayo-afolabi.jpg",
    biography: `Fikayo Afolabi is a passionate minister of God, teacher, mentor, and visionary leader with a deep burden for teenagers and young people. His ministry is driven by a desire to see a generation of young people who know Christ, understand their identity and purpose, and are equipped to make meaningful impact in their generation.

He holds a Bachelor’s degree in Physics from the University of Ilorin and a Master’s degree in Physics from Osun State University. He is a graduate of the Mountain Top Youth Academy, a leadership development programme committed to equipping young people with the knowledge, character, and leadership capacity to influence their generation and the world.

A gifted orator and ardent teacher of God’s Word, Fikayo has impacted numerous teenagers and young people through his ministry, teaching, and mentorship. He is the President of Christ Alignment Mission, a non‑denominational Christian community raising believers fully aligned with Christ and His purposes, and the convener of Pneuma Summit, an annual gathering for spiritual awakening, sound biblical teaching, and equipping young people for Kingdom influence.`,
  },
  {
    name: "Uche Peter",
    category: "Minister",
    img: "/assets/ministers/portraits/uche-peter.jpg",
    biography: `Uchechukwu Peter Isioma, popularly known as Uche Peter, is a passionate believer, minister, creative director, entrepreneur, and visionary leader committed to raising people, building purpose‑driven communities, and advancing positive change.

Beyond his professional pursuits, Uche Peter has a deep passion for the things of God and for seeing lives transformed through prayer, discipleship, and the teaching of God’s Word.

He currently serves as the Head of the Burden Bearers Prayer Network, a community of believers committed to intercession and spiritual growth. He is also actively involved in Christian leadership and ministry, with a burden to see young people discover their identity, walk in purpose, and become effective instruments in God’s hands.

He is a lover of God, a burden bearer, and a man committed to seeing God’s will established in the lives of people and in the nations.`,
  },
  {
    name: "Bethel Emmanuel",
    category: "Minstrel",
    img: "/assets/ministers/portraits/bethel-emmanuel.jpg",
    biography: "",
  },
];

export default async function MinistersPage() {
  const [dbMinisters, branding] = await Promise.all([
    getPublishedMinisters(),
    getGlobalBranding(),
  ]);
  const displayMinisters = dbMinisters && dbMinisters.length > 0 ? dbMinisters : ministers;

  return (
    <div className="min-h-screen bg-[#09080E] text-white flex flex-col selection:bg-brand-flameOrange selection:text-white">
      <Navbar logoUrl={branding.logoUrl} logoAlt={branding.logoAlt} />

      <main id="main-content" className="flex-grow pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-brand-goldYellow transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>

          <SectionHeader
            badge="Ministers & Facilitators"
            title="Ministerial"
            highlightWord="Directory"
            description="Apostolic leadership, keynote ministers, and psalmists facilitating the 12‑hour sacred prayer assembly."
          />

          {/* Ministers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
            {displayMinisters.map((minister: any, idx: number) => {
              const photo = minister.photo_url || minister.img || "/assets/ministers/portraits/david-olayiwola.jpg";
              return (
                <div
                  key={idx}
                  className="rounded-3xl bg-gradient-to-b from-[#181320] to-[#0E0C14] border border-white/10 p-6 flex flex-col space-y-4 group shadow-xl"
                >
                  <div className="flex items-center gap-4">
                    <Image
                      src={photo}
                      alt={minister.name}
                      width={120}
                      height={120}
                      className="rounded-2xl object-cover w-28 h-28"
                    />
                    <div className="flex flex-col">
                      <h2 className="text-lg font-bold text-white group-hover:text-brand-goldYellow transition-colors">
                        {minister.name}
                      </h2>
                      <p className="text-sm text-gray-300">{minister.role_title || minister.category || "Minister"}</p>
                    </div>
                  </div>
                  {minister.biography && (
                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                      {minister.biography}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer logoUrl={branding.logoUrl} logoAlt={branding.logoAlt} />
    </div>
  );
}
