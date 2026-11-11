-- ============================================================================
-- KING'S PAVILION CMS EXPANSION — PHASE 1 SEED DATA MIGRATION
-- Migration: 20261110211000_cms_seed_data.sql
-- ============================================================================

BEGIN;

-- 1. SEED SITE CONTENT (DRAFT STATUS)
INSERT INTO public.site_content (section_key, title, subtitle, content, status, version)
VALUES
  (
    'hero',
    'Intimacy',
    '12 Hours Prayer Bootcamp',
    '{
      "tagline": "A 12-Hour Consecrated Atmosphere of Intercession, Divine Encounter & Spiritual Alignment",
      "dateFormatted": "Saturday, 5 December 2026",
      "timeFormatted": "8:00 AM WAT",
      "duration": "12 Hours (8:00 AM - 8:00 PM)",
      "venue": "IPMAN Event Hall, beside Harvard Hotel, opposite NASFAT, Ibadan Road, Ile Ife, Osun State",
      "admissionBadge": "Free Admission • Registration Required"
    }'::jsonb,
    'draft',
    1
  ),
  (
    'about',
    'About The Gathering',
    'A Sacred Altar of Fervent Prayer and Deep Spiritual Alignment',
    '{
      "description": "Intimacy is a dedicated 12-hour prayer bootcamp convened by King''s Pavilion. Designed for believers seeking deep communion with God, spiritual revival, corporate intercession, and personal transformation through fervent, sustained prayer and Word-centered worship.",
      "coreFocus": [
        "12 Continuous Hours of Consecrated Prayer",
        "Apostolic & Prophetic Exhortation",
        "Deep Worship & Altar Ministry",
        "Corporate Intercession for the Land"
      ]
    }'::jsonb,
    'draft',
    1
  ),
  (
    'event_info',
    'Event Schedule & Venue',
    'Essential Details for Arriving Attendees',
    '{
      "date": "Saturday, 5 December 2026",
      "time": "8:00 AM - 8:00 PM WAT",
      "venueName": "IPMAN Event Hall",
      "landmark": "Beside Harvard Hotel, Opposite NASFAT",
      "address": "Ibadan Road, Ile Ife, Osun State, Nigeria",
      "admissionNote": "Admission is completely free; individual registration is requested to assist event administration."
    }'::jsonb,
    'draft',
    1
  ),
  (
    'volunteer_callout',
    'Serve in the Courts of the Lord',
    'Consecrated Volunteer Opportunities',
    '{
      "headline": "Serve in One of 8 Consecrated Departments",
      "description": "Applicants select exactly one consecrated service department: Prayer, Media, Ushering, Protocol, Sanitation, Care, Logistics, or Security for the 12 Hours Prayer Bootcamp.",
      "note": "Volunteer registration is evaluated independently of attendee registration."
    }'::jsonb,
    'draft',
    1
  ),
  (
    'closing_cta',
    'Secure Your Seat at the Altar',
    'Join Believers in 12 Hours of Continuous Prayer',
    '{
      "headline": "Experience 12 Hours in God''s Presence",
      "primaryCta": "Register for Free",
      "secondaryCta": "Apply as Volunteer"
    }'::jsonb,
    'draft',
    1
  )
ON CONFLICT (section_key) DO NOTHING;

-- 2. SEED MINISTERS (UNPUBLISHED, VERIFIED IMAGE PATHS)
INSERT INTO public.ministers (slug, name, role_title, category, biography, photo_url, display_order, is_published)
VALUES
  ('david-olayiwola', 'Pastor David Olayiwola', NULL, 'Minister', NULL, '/assets/ministers/portraits/david-olayiwola.jpg', 1, false),
  ('amas-amajo', 'Pastor Amas Amajo', NULL, 'Guest Minister', 'Pastor Amas Amajo holds a Bachelor’s degree in History and International Relations and a Postgraduate Diploma in Theology. He is an international evangelist and teacher of God’s Word. His ministry has reached campuses and churches through conferences, crusades, and the Amas Amajo Radio broadcast and other media platforms. As a pastor in RCCG, he serves as Pastor in Charge of Youth Province 23, Ile-Ife.', '/assets/ministers/portraits/amas-amajo.jpg', 2, false),
  ('isaiah-adesupo', 'Pastor Isaiah Adebambowale Adesupo', NULL, 'Guest Minister', 'Pastor Engr. Isaiah Adebambowale Adesupo is the Pastor in Charge of UMCA Redemption Chapel, Ilesa, Osun State, and Founder/MD/CEO of Adebambowale Engineering Limited. A minister with a dual mandate in the marketplace and in ministry, he holds an M.Div from UMCATS, Ilorin.', '/assets/ministers/portraits/isaiah-adesupo.jpg', 3, false),
  ('victor-olamide', 'Pastor Victor Olamide', NULL, 'Guest Minister', 'Pastor Victor Olamide is a man set apart by God for the work of the ministry, called to raise men, build lives, and advance the purposes of God. He serves as the set man of Adullam Ministries.', '/assets/ministers/portraits/victor-olamide.jpg', 4, false),
  ('fikayo-afolabi', 'Pastor Fikayo Afolabi', NULL, 'Guest Minister', 'Fikayo Afolabi is a passionate minister of God, teacher, mentor, and visionary leader with a deep burden for teenagers and young people. He is the President of Christ Alignment Mission and convener of Pneuma Summit.', '/assets/ministers/portraits/fikayo-afolabi.jpg', 5, false),
  ('uche-peter', 'Uche Peter', NULL, 'Minister', 'Uchechukwu Peter Isioma, popularly known as Uche Peter, serves as Head of the Burden Bearers Prayer Network, a community committed to intercession and spiritual growth.', '/assets/ministers/portraits/uche-peter.jpg', 6, false),
  ('bethel-emmanuel', 'Bethel Emmanuel', NULL, 'Minstrel', NULL, '/assets/ministers/portraits/bethel-emmanuel.jpg', 7, false)
ON CONFLICT (slug) DO NOTHING;

-- 3. SEED FAQS (UNPUBLISHED)
INSERT INTO public.faqs (slug, question, answer, category, display_order, is_published)
VALUES
  ('faq-free-admission', 'Is there any registration fee or ticket cost to attend Intimacy?', 'No. Attendance is 100% free of charge. Individual registration is requested to assist event administration and receive official updates.', 'general', 1, false),
  ('faq-ipman-location', 'Where is IPMAN Event Hall located in Ile Ife?', 'IPMAN Event Hall is situated along Ibadan Road in Ile Ife, Osun State. Key landmarks: it is directly beside Harvard Hotel and opposite NASFAT.', 'venue', 2, false),
  ('faq-duration-bootcamp', 'What is the duration of the prayer bootcamp?', 'The event is a continuous 12-hour prayer bootcamp running from 8:00 AM WAT to 8:00 PM WAT on Saturday, 5 December 2026. Attendees are encouraged to arrive early for smooth check-in.', 'general', 3, false),
  ('faq-volunteer-dual-reg', 'Can I register as an attendee and also apply to volunteer?', 'Yes! Applying to serve in one of our eight volunteer departments does not prevent you from registering as an attendee, and vice versa. Each workflow is evaluated independently.', 'volunteering', 4, false),
  ('faq-post-registration', 'What happens after I complete my registration?', 'Successful registration generates a unique registration reference and personal QR code for check-in at the venue entrance, with a confirmation delivered to your email.', 'registration', 5, false),
  ('faq-transport-parking', 'Are public transport and parking available at the venue?', 'IPMAN Event Hall is situated along Ibadan Road in Ile Ife. Specific parking arrangements and logistics guidelines are pending operational confirmation by event leadership and will be communicated prior to the event.', 'venue', 6, false)
ON CONFLICT (slug) DO NOTHING;

-- 4. SEED INITIAL ANNOUNCEMENT (INACTIVE)
INSERT INTO public.announcements (slug, title, content, priority, is_active, start_date, end_date)
VALUES
  ('announcement-reg-open', 'Official Registration Now Open', 'Online registration for Intimacy: 12 Hours Prayer Bootcamp is officially open. Reserve your seat and receive your digital check-in credential.', 'high', false, now(), '2026-12-05 20:00:00+01')
ON CONFLICT (slug) DO NOTHING;

-- 5. SEED SITE SETTINGS (UNCONFIRMED ITEMS NULL)
INSERT INTO public.site_settings (key, value, is_public, description)
VALUES
  ('site_title', '"King''s Pavilion — Intimacy 2026"'::jsonb, true, 'Official website window title'),
  ('event_name', '"Intimacy"'::jsonb, true, 'Official gathering name'),
  ('event_date', '"Saturday, 5 December 2026"'::jsonb, true, 'Official event date string'),
  ('event_time', '"8:00 AM WAT"'::jsonb, true, 'Official event start time'),
  ('venue_name', '"IPMAN Event Hall"'::jsonb, true, 'Official venue name'),
  ('venue_landmark', '"Beside Harvard Hotel, Opposite NASFAT"'::jsonb, true, 'Official venue landmarks'),
  ('venue_city', '"Ile Ife, Osun State"'::jsonb, true, 'Venue city and state'),
  ('registration_open', 'true'::jsonb, true, 'Controls public registration availability'),
  ('contact_inquiry_phone', 'null'::jsonb, false, 'Official inquiry phone (pending leadership confirmation)'),
  ('contact_inquiry_email', 'null'::jsonb, false, 'Official inquiry email (pending leadership confirmation)'),
  ('social_links', 'null'::jsonb, false, 'Official social channels (pending leadership confirmation)'),
  ('max_registration_capacity', 'null'::jsonb, false, 'Venue seating capacity limit (pending leadership confirmation)')
ON CONFLICT (key) DO NOTHING;

COMMIT;

