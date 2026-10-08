/**
 * Starter launch area: every residential Philadelphia ZIP plus nearby suburbs in
 * Montgomery, Delaware, Bucks and Chester counties. This only seeds the database;
 * admins turn ZIP codes on and off in the admin site.
 */
export interface LaunchZip {
  zip: string;
  area: string;
}

const PHILADELPHIA = [
  '19102', '19103', '19104', '19106', '19107', '19111', '19114', '19115', '19116',
  '19118', '19119', '19120', '19121', '19122', '19123', '19124', '19125', '19126',
  '19127', '19128', '19129', '19130', '19131', '19132', '19133', '19134', '19135',
  '19136', '19137', '19138', '19139', '19140', '19141', '19142', '19143', '19144',
  '19145', '19146', '19147', '19148', '19149', '19150', '19151', '19152', '19153',
  '19154',
].map((zip) => ({ zip, area: 'Philadelphia' }));

const SUBURBS: LaunchZip[] = [
  { zip: '19002', area: 'Ambler' },
  { zip: '19003', area: 'Ardmore' },
  { zip: '19004', area: 'Bala Cynwyd' },
  { zip: '19006', area: 'Huntingdon Valley' },
  { zip: '19008', area: 'Broomall' },
  { zip: '19010', area: 'Bryn Mawr' },
  { zip: '19012', area: 'Cheltenham' },
  { zip: '19020', area: 'Bensalem' },
  { zip: '19026', area: 'Drexel Hill' },
  { zip: '19027', area: 'Elkins Park' },
  { zip: '19034', area: 'Fort Washington' },
  { zip: '19038', area: 'Glenside' },
  { zip: '19041', area: 'Haverford' },
  { zip: '19044', area: 'Horsham' },
  { zip: '19046', area: 'Jenkintown' },
  { zip: '19047', area: 'Langhorne' },
  { zip: '19050', area: 'Lansdowne' },
  { zip: '19063', area: 'Media' },
  { zip: '19064', area: 'Springfield' },
  { zip: '19066', area: 'Merion Station' },
  { zip: '19067', area: 'Yardley' },
  { zip: '19072', area: 'Narberth' },
  { zip: '19073', area: 'Newtown Square' },
  { zip: '19081', area: 'Swarthmore' },
  { zip: '19082', area: 'Upper Darby' },
  { zip: '19083', area: 'Havertown' },
  { zip: '19087', area: 'Wayne' },
  { zip: '19090', area: 'Willow Grove' },
  { zip: '19095', area: 'Wyncote' },
  { zip: '19096', area: 'Wynnewood' },
  { zip: '19312', area: 'Berwyn' },
  { zip: '19333', area: 'Devon' },
  { zip: '19355', area: 'Malvern' },
  { zip: '19380', area: 'West Chester' },
  { zip: '19382', area: 'West Chester' },
  { zip: '19401', area: 'Norristown' },
  { zip: '19406', area: 'King of Prussia' },
  { zip: '19422', area: 'Blue Bell' },
  { zip: '19428', area: 'Conshohocken' },
  { zip: '19444', area: 'Lafayette Hill' },
  { zip: '19462', area: 'Plymouth Meeting' },
  { zip: '18901', area: 'Doylestown' },
  { zip: '18940', area: 'Newtown' },
];

export const LAUNCH_ZIPS: LaunchZip[] = [...PHILADELPHIA, ...SUBURBS];

export function normalizeZip(input: string): string | null {
  const match = input.trim().match(/^(\d{5})(?:-\d{4})?$/);
  return match ? match[1] : null;
}
