const validUsers = [
  {
    username: 'hseaborn0',
    email: 'rmactrustie0@delicious.com',
    password: 'Password@123!',
  },
  {
    username: 'rwidmore1',
    email: 'bharman1@tinypic.com',
    password: 'L1mper@tr!ce',
  },
  {
    username: 'mbattye2',
    email: 'ptranfield2@cdc.gov',
    password: 'L1mper@tr!ce',
  },
  {
    username: 'gcumbes3',
    email: 'fdelhay3@desdev.cn',
    password: 'L3W!sofM4n',
  },
  {
    username: 'jsouthall4',
    email: 'falfonzo4@pinterest.com',
    password: 'M0rCh33b4!',
  },
  {
    username: 'chalsall5',
    email: 'bharmour5@flickr.com',
    password: 'L1mper@tr!ce',
  },
  {
    username: 'grobatham6',
    email: 'ebrisard6@t-online.de',
    password: 'R0os3V#lt',
  },
  {
    username: 'khazlegrove7',
    email: 'jquinby7@ft.com',
    password: 'L1mper@tr!ce',
  },
  {
    username: 'yleach8',
    email: 'amanchett8@harvard.edu',
    password: 'L1mper@tr!ce',
  },
  {
    username: 'banten9',
    email: 'ajedrzejewicz9@wikimedia.org',
    password: 'M0rCh33b4!',
  },
  {
    username: 'jdollina',
    email: 'wgutridgea@tripod.com',
    password: 'R0os3V#lt',
  },
  {
    username: 'nbleaseb',
    email: 'imccomiskeyb@privacy.gov.au',
    password: 'L3W!sofM4n',
  },
  {
    username: 'bkingabyc',
    email: 'kconnarc@twitter.com',
    password: 'L1mper@tr!ce',
  },
  {
    username: 'jalcornd',
    email: 'jcarlozzid@smugmug.com',
    password: 'L1mper@tr!ce',
  },
  {
    username: 'cdixceee',
    email: 'sshepharde@rakuten.co.jp',
    password: 'Password@123!',
  },
  {
    username: 'hcordeuxf',
    email: 'ntreadwellf@google.com.hk',
    password: 'D!r7yL00ps',
  },
  {
    username: 'tmarnesg',
    email: 'rleathesg@latimes.com',
    password: 'L3W!sofM4n',
  },
  {
    username: 'ggoldneyh',
    email: 'bguineryh@pinterest.com',
    password: 'Password@123!',
  },
  {
    username: 'Aawelli',
    email: 'mgarvaghi@live.com',
    password: 'L1mper@tr!ce',
  },
  {
    username: 'jsleightj',
    email: 'jstenningj@delicious.com',
    password: 'Password@123!',
  },
];

export const getValidUser = () => {
  const user = validUsers[Math.floor(Math.random() * 19)];
  return { ...user };
};

export const getAllValidUsers = () => validUsers;

function getCampsiteStartingDate() {
  const date = new Date();
  date.setDate(Math.random() * (100 - 50) + 50);
  return date.toISOString();
}

function getCampsiteEndingDate() {
  const date = new Date();
  date.setDate(Math.random() * (200 - 100) + 100);
  return date.toISOString();
}

const validCampsites = [
  {
    name: 'Berm Creek',
    startingDate: getCampsiteStartingDate(),
    endingDate: getCampsiteEndingDate(),
  },
  {
    name: 'Holmes Lake',
    startingDate: getCampsiteStartingDate(),
    endingDate: getCampsiteEndingDate(),
  },
  {
    name: 'Lake George',
    startingDate: getCampsiteStartingDate(),
    endingDate: getCampsiteEndingDate(),
  },
  {
    name: 'Utah Lake',
    startingDate: getCampsiteStartingDate(),
    endingDate: getCampsiteEndingDate(),
  },
];

export const getValidCampsite = () => {
  const campsite = validCampsites[Math.floor(Math.random() * 3)];
  return { ...campsite };
};

export const getAllValidCampsites = () => validCampsites;
