// Data-driven House registry for UBLverse.
// Adding a new House is adding an entry here — the World, House and CameraRig
// components read this list and generalize automatically (position, theme,
// door orientation and camera path are all derived from `position`).
//
// `detail: 'full'` marks the fully-authored prototype House (Brewery).
// Other Houses reuse the exact same 3D House + camera/door engine with a
// lighter content payload — ready to be filled in as UBLverse expands.

export const HOUSES = [
  {
    id: 'brewery',
    name: 'Brewery House',
    tagline: 'Where brewing excellence begins.',
    theme: '#a8632c',
    accent: '#e8b978',
    position: [-11, 0, -21],
    detail: 'full',
    content: {
      heading: 'Brewery House',
      kicker: 'Heritage & Craft',
      body: [
        'Nearly a century of brewing heritage runs through every batch — from grain to glass, UBL brings together time-honoured craft and modern precision.',
        'Inside the Brewery House, explore how our master brewers balance tradition with innovation to consistently deliver the taste people trust.',
      ],
      stats: [
        { value: '75+', label: 'Years of brewing heritage' },
        { value: '20+', label: 'Breweries nationwide' },
        { value: '60+', label: 'Brands crafted' },
      ],
    },
  },
  {
    id: 'brands',
    name: 'Brands House',
    tagline: 'The stories behind every glass.',
    theme: '#b23a5c',
    accent: '#f0a7bd',
    position: [-9, 0, -8],
    detail: 'placeholder',
    content: {
      heading: 'Brands House',
      kicker: 'Portfolio & Identity',
      body: [
        'From iconic favourites to bold new arrivals, UBL brands are woven into moments of togetherness across the country.',
        'This House is being built out — full brand stories are coming soon.',
      ],
      stats: [],
    },
  },
  {
    id: 'people',
    name: 'People House',
    tagline: 'Culture, craft and community.',
    theme: '#3a8f7a',
    accent: '#8fd9c4',
    position: [9, 0, -8],
    detail: 'placeholder',
    content: {
      heading: 'People House',
      kicker: 'Culture & Community',
      body: [
        'Our people are the heart of UBL — a community bound by craft, care and a shared pursuit of excellence.',
        'This House is being built out — culture stories are coming soon.',
      ],
      stats: [],
    },
  },
  {
    id: 'innovation',
    name: 'Innovation House',
    tagline: 'Brewing what comes next.',
    theme: '#2f7dbf',
    accent: '#9cc9ef',
    position: [11, 0, -21],
    detail: 'placeholder',
    content: {
      heading: 'Innovation House',
      kicker: 'Future & Technology',
      body: [
        'From smart breweries to new-format beverages, UBL keeps pushing the category forward.',
        'This House is being built out — innovation stories are coming soon.',
      ],
      stats: [],
    },
  },
  {
    id: 'sustainability',
    name: 'Sustainability House',
    tagline: 'Brewing responsibly, for the long run.',
    theme: '#4c8c3f',
    accent: '#a9d998',
    position: [0, 0, -32],
    detail: 'placeholder',
    content: {
      heading: 'Sustainability House',
      kicker: 'Water, Energy & Community',
      body: [
        'Responsible brewing means protecting the water, energy and communities that make it possible.',
        'This House is being built out — sustainability stories are coming soon.',
      ],
      stats: [],
    },
  },
  {
    id: 'distribution',
    name: 'Distribution House',
    tagline: 'From brewery to every corner.',
    theme: '#cba660',
    accent: '#f2dcae',
    position: [10, 0, 11],
    detail: 'placeholder',
    content: {
      heading: 'Distribution House',
      kicker: 'Reach & Network',
      body: [
        'A vast distribution network keeps UBL brands close at hand, everywhere in the country.',
        'This House is being built out — network stories are coming soon.',
      ],
      stats: [],
    },
  },
];

export const getHouseById = (id) => HOUSES.find((h) => h.id === id) || null;
