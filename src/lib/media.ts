// Nagrania BeHopeful nie leza w tym repo (publiczne, po kilka MB na odcinek), tylko na
// serwerze polskiej aplikacji: https://jestnadzieja.adwent.pl/audio/en/edu/NNN.mp3
// (wysyla je tam deploy-ftp.sh z ../Apka_Marka/public/audio/en/). Tak samo w dev.
export const MAIN_SITE = 'https://jestnadzieja.adwent.pl/'

export function mediaUrl(src: string): string {
  return MAIN_SITE + src
}
