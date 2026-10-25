-- ==============================================================================
-- MIGRATION 20261025000003: SEED STRUCTURAL DATA
-- ==============================================================================
-- STRICT SECURITY INVARIANT:
-- "Never seed production with demo users or a known admin password."
-- This migration seeds ONLY structural physical assets:
-- 1. Studio Location (Bangalore Sanctuary)
-- 2. Official Membership Plans (Stored in Integer Paise)
-- 3. 20 Architectural Workstations with coordinates and verified inclusions
-- Zero demo user records, zero plain-text or placeholder admin accounts.
-- ==============================================================================

-- 1. Bangalore Studio Location
INSERT INTO locations (id, slug, name, address_line1, address_line2, city, state, postal_code, country, timezone, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'bangalore-central',
  'Sanctuary — Central Studio & Library',
  'No. 42, Lavelle Road',
  'Opposite Forest Conservatory',
  'Bangalore',
  'Karnataka',
  '560001',
  'India',
  'Asia/Kolkata',
  true
)
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  address_line1 = EXCLUDED.address_line1,
  city = EXCLUDED.city,
  timezone = EXCLUDED.timezone;

-- 2. Official Membership Plans (Money in Integer Paise: 1 INR = 100 Paise)
INSERT INTO membership_plans (id, slug, name, tagline, duration_type, duration_days, base_price_paise, currency, terms_markdown, inclusions, is_active)
VALUES
  (
    'b0000000-0000-0000-0000-000000000001'::uuid,
    'day-sanctuary',
    'Day Sanctuary',
    'Single day silent retreat access for singular deadlines.',
    'day',
    1,
    450000, -- ₹4,500 = 450,000 paise
    'INR',
    'Single session pass valid from 07:30 to 22:00 IST. Silent etiquette strictly observed.',
    ARRAY['Assigned solid oak workstation', 'Continuous pour-over bar', '1 Gbps unshared fiber drop', 'Acoustic rating < 36 dBA'],
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000002'::uuid,
    'weekly-sprint',
    'Weekly Sprint',
    'Seven consecutive calendar days of undisturbed deep focus.',
    'week',
    7,
    1900000, -- ₹19,000 = 1,900,000 paise
    'INR',
    'Seven consecutive days of sanctuary access with dedicated workstation preservation.',
    ARRAY['Reserved workstation for 7 days', 'Overnight material preservation', '24/7 keycard access', 'Quiet room reservation credits (4 hrs)'],
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000003'::uuid,
    'monthly-atelier',
    'Monthly Atelier',
    'Our core residential tier for serious authors, architects, and founders.',
    'month',
    30,
    3800000, -- ₹38,000 = 3,800,000 paise
    'INR',
    'Full calendar month residency. Accounts for calendar month-end clipping and leap years.',
    ARRAY['Dedicated permanent workstation', 'Personal cedar locker assignment', 'Concierge mail intake', '8 guest day passes per term'],
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000004'::uuid,
    'quarterly-fellow',
    'Quarterly Fellow',
    'Three consecutive calendar months with estate residency privileges.',
    'quarter',
    90,
    9500000, -- ₹95,000 = 9,500,000 paise
    'INR',
    'Three full calendar months. Guaranteed station retention and curatorial committee fellowship.',
    ARRAY['Estate archive key privileges', 'Curatorial salon invitations', 'Complimentary storage vaults', 'Priority renewal lock-in'],
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000005'::uuid,
    'annual-residency',
    'Annual Residency',
    'One full calendar year of uninterrupted creative stewardship.',
    'year',
    365,
    34000000, -- ₹340,000 = 34,000,000 paise
    'INR',
    'Twelve calendar months with leap-year awareness and permanent workstation dedication.',
    ARRAY['Named brass station plaque', 'Permanent cedar wardrobe locker', 'Unlimited private seminar access', 'Global sister studio reciprocal access'],
    true
  )
ON CONFLICT (slug) DO UPDATE
SET
  base_price_paise = EXCLUDED.base_price_paise,
  terms_markdown = EXCLUDED.terms_markdown,
  inclusions = EXCLUDED.inclusions;

-- 3. 20 Architectural Workstations
INSERT INTO seats (id, location_id, seat_number, name, zone, view_description, verified_features, map_x, map_y, map_width, map_height, is_active)
VALUES
  -- Zone A: North Skylight Gallery (6 seats)
  ('c0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'N-01', 'North Skylight Pier 01', 'North Skylight Gallery', 'Direct diffused overhead skylight with morning light', ARRAY['Natural 2700K circadian morning light', 'Solid white oak 160x80cm workstation', 'Redundant 1 Gbps wired RJ45 drop'], 40, 65, 45, 45, true),
  ('c0000000-0000-0000-0000-000000000002'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'N-02', 'North Skylight Pier 02', 'North Skylight Gallery', 'Northern skylight with timber roof truss reveal', ARRAY['FSC-certified Appalachian oak joinery', 'Herman Miller Cosm high-back chair', 'Acoustics certified < 36 dBA', 'Heavy linen blotter with brass pen rest'], 95, 65, 45, 45, true),
  ('c0000000-0000-0000-0000-000000000003'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'N-03', 'North Skylight Pier 03', 'North Skylight Gallery', 'Central gallery orientation with symmetric timber sightlines', ARRAY['Independent dimmer control on brass lamp', 'Shielded cellular dead-zone for distraction zero', 'Dedicated fiber drop'], 150, 65, 45, 45, true),
  ('c0000000-0000-0000-0000-000000000004'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'N-04', 'North Skylight Pier 04', 'North Skylight Gallery', 'Corner alcove with limestone wall reveal', ARRAY['Deep reveal 40cm limestone acoustic buffer', 'Solid white oak workstation', 'Certified quietude < 34 dBA'], 40, 130, 45, 45, true),
  ('c0000000-0000-0000-0000-000000000005'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'N-05', 'North Skylight Pier 05', 'North Skylight Gallery', 'Truss framing view with acoustic cedar backdrop', ARRAY['Rear acoustic cedar baffles', 'Dual surge-protected Schuko outlets', 'Balanced task light angle'], 95, 130, 45, 45, true),
  ('c0000000-0000-0000-0000-000000000006'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'N-06', 'North Skylight Pier 06', 'North Skylight Gallery', 'Quiet perimeter anchor facing the library loggia', ARRAY['Perimeter low-traffic sanctuary', 'Natural matte oiled oak surface', 'Ergonomic lumbar bolster'], 150, 130, 45, 45, true),

  -- Zone B: Reference Stacks (4 seats)
  ('c0000000-0000-0000-0000-000000000007'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'A-01', 'Stacks Focus Alcove 01', 'Reference Stacks', 'Flanked by 19th-century botanical folios', ARRAY['Complete acoustic dampening stack baffles', 'Built-in adjustable book cradle', 'Warm incandescent 2400K task lamp'], 330, 65, 42, 45, true),
  ('c0000000-0000-0000-0000-000000000008'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'A-02', 'Stacks Focus Alcove 02', 'Reference Stacks', 'Private alcove adjacent to typography & design archive', ARRAY['Archival paper storage drawers', 'Direct access to rare periodicals vault', 'Tactile toggle power bank'], 380, 65, 42, 45, true),
  ('c0000000-0000-0000-0000-000000000009'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'A-03', 'Stacks Focus Alcove 03', 'Reference Stacks', 'High-density bookshelf acoustic shelter', ARRAY['Ultra-low reverberation coefficient (< 0.2s)', 'Full leather task chair', 'Under-desk foot hammock'], 330, 125, 42, 45, true),
  ('c0000000-0000-0000-0000-000000000010'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'A-04', 'Stacks Focus Alcove 04', 'Reference Stacks', 'Deep study alcove with dimmable shelf valance light', ARRAY['Dedicated reading rail', 'Warm walnut drafting desk', 'Surge-isolated medical grade power'], 380, 125, 42, 45, true),

  -- Zone C: Courtyard Loggia (4 seats)
  ('c0000000-0000-0000-0000-000000000011'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'C-01', 'Courtyard Desk 01', 'Courtyard Loggia', 'Glass façade overlooking internal Japanese moss garden', ARRAY['Triple-glazed acoustic glass wall', 'Calming natural greenery sightlines', 'Linen window shading screen'], 40, 245, 48, 48, true),
  ('c0000000-0000-0000-0000-000000000012'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'C-02', 'Courtyard Desk 02', 'Courtyard Loggia', 'Central reflection station facing limestone fountain', ARRAY['Subtle natural water white noise (< 38 dBA)', 'Air-purifying live fiddle-leaf fig canopy', 'Hand-stitched leather mat'], 100, 245, 48, 48, true),
  ('c0000000-0000-0000-0000-000000000013'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'C-03', 'Courtyard Desk 03', 'Courtyard Loggia', 'Southern loggia with afternoon indirect courtyard wash', ARRAY['Filtered natural light orientation', 'Solid white oak frame with chamfered edge', 'Integrated wireless power surface'], 40, 310, 48, 48, true),
  ('c0000000-0000-0000-0000-000000000014'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'C-04', 'Courtyard Desk 04', 'Courtyard Loggia', 'Quiet garden corner shielded by bamboo acoustic screen', ARRAY['Natural bamboo screen acoustic baffle', 'Individual thermal radiator control', 'Quiet footfall cork flooring'], 100, 310, 48, 48, true),

  -- Zone D: Timber Mezzanine (6 seats)
  ('c0000000-0000-0000-0000-000000000015'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'M-01', 'Mezzanine Vista 01', 'Timber Mezzanine', 'Elevated view across main sanctuary hall and ceiling trusses', ARRAY['Solid teak mezzanine balustrade', 'Panoramic room perspective', 'High-loft ceiling air volume'], 300, 245, 42, 45, true),
  ('c0000000-0000-0000-0000-000000000016'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'M-02', 'Mezzanine Vista 02', 'Timber Mezzanine', 'Second-level perch above courtyard loggia roofline', ARRAY['Overhead pendant lamp with brass dome', 'Extra wide 180cm writing station', 'Low-vibration timber joinery'], 350, 245, 42, 45, true),
  ('c0000000-0000-0000-0000-000000000017'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'M-03', 'Mezzanine Vista 03', 'Timber Mezzanine', 'Mezzanine east bay with gentle morning horizon glow', ARRAY['Early bird sunrise orientation', 'Dedicated flat-file blueprint drawer', 'Ergonomic footstool'], 400, 245, 42, 45, true),
  ('c0000000-0000-0000-0000-000000000018'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'M-04', 'Mezzanine Vista 04', 'Timber Mezzanine', 'Secluded mezzanine rear bay facing quiet library rafters', ARRAY['Deep isolation zone', 'Zero line-of-sight distractions', 'Heavyweight oak desktop'], 300, 310, 42, 45, true),
  ('c0000000-0000-0000-0000-000000000019'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'M-05', 'Mezzanine Vista 05', 'Timber Mezzanine', 'Center rear mezzanine nook under cedar acoustic ceiling', ARRAY['Acoustic cedar tongue-and-groove ceiling', 'Individual airflow louvre', 'Twin shielded USB-C power'], 350, 310, 42, 45, true),
  ('c0000000-0000-0000-0000-000000000020'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'M-06', 'Mezzanine Vista 06', 'Timber Mezzanine', 'Corner aerie overlooking complete studio floorplan', ARRAY['Most secluded seat in entire building', '360-degree acoustic wrapping', 'Personal bronze desk bell for concierge'], 400, 310, 42, 45, true)
ON CONFLICT (location_id, seat_number) DO UPDATE
SET
  name = EXCLUDED.name,
  zone = EXCLUDED.zone,
  view_description = EXCLUDED.view_description,
  verified_features = EXCLUDED.verified_features,
  map_x = EXCLUDED.map_x,
  map_y = EXCLUDED.map_y,
  map_width = EXCLUDED.map_width,
  map_height = EXCLUDED.map_height;
