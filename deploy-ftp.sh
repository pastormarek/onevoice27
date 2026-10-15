#!/usr/bin/env bash
# Buduje angielska aplikacje i wysyla dist/ na https://onevoice27.adventist.pl/ (FTPS, hosting go3.pl).
#   bash deploy-ftp.sh              # build + wyslanie tylko zmienionych plikow
#   bash deploy-ftp.sh --all        # build + wyslanie wszystkiego (pierwszy raz)
#   bash deploy-ftp.sh --no-build   # wyslanie istniejacego dist/ bez przebudowy
# Dane siedza POZA repozytorium (jest publiczne) w ~/.onevoice27-ftp:
#   FTP_HOST=s1.go3.pl
#   FTP_USER=ftp@onevoice27.adventist.pl
#   FTP_PASS=...
#   FTP_DIR=public_html
# GitHub Pages (kopia zapasowa) publikuje sie sam z kazdego pushu na main (VITE_BASE=/onevoice27/).
# Tutaj domena serwuje z korzenia, wiec build leci bez VITE_BASE (base = '/').
set -euo pipefail

CRED="$HOME/.onevoice27-ftp"
STATE="$HOME/.onevoice27-ftp-state"   # manifest ostatniej wysylki (md5 + sciezka), poza repo
BUILD=1
ALL=0

for a in "$@"; do
  case "$a" in
    --all) ALL=1 ;;
    --no-build) BUILD=0 ;;
    *) echo "nieznany argument: $a" >&2; exit 2 ;;
  esac
done

[ -f "$CRED" ] || { echo "brak $CRED - zaloz plik z danymi FTP (opis w naglowku skryptu)" >&2; exit 1; }
. "$CRED"
: "${FTP_HOST:?}" "${FTP_USER:?}" "${FTP_PASS:?}" "${FTP_DIR:?}"

if [ "$BUILD" = 1 ]; then
  echo ">> build (base = / , bez VITE_BASE)"
  unset VITE_BASE || true
  npm run build
fi

[ -d dist ] || { echo "brak dist/ - uruchom bez --no-build" >&2; exit 1; }
[ -f dist/.htaccess ] || { echo "UWAGA: brak dist/.htaccess - sprawdz public/.htaccess" >&2; exit 1; }
if grep -q '="/[a-z0-9]*/assets/' dist/index.html; then
  echo "dist/ jest zbudowany z podkatalogiem w bazie - to nie jest build korzenia. Uruchom bez --no-build." >&2
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

( cd dist && find . -type f -printf '%P\n' | sort ) > "$TMP/files.txt"
( cd dist && while IFS= read -r f; do printf '%s  %s\n' "$(md5sum "$f" | cut -d' ' -f1)" "$f"; done < "$TMP/files.txt" ) > "$TMP/manifest.txt"

if [ "$ALL" = 1 ] || [ ! -f "$STATE" ]; then
  cut -d' ' -f3- "$TMP/manifest.txt" > "$TMP/todo.txt"
  echo ">> wysylka pelna ($(wc -l < "$TMP/todo.txt") plikow)"
else
  comm -13 <(sort "$STATE") <(sort "$TMP/manifest.txt") | cut -d' ' -f3- | sort -u > "$TMP/todo.txt"
  echo ">> wysylka roznicowa ($(wc -l < "$TMP/todo.txt") z $(wc -l < "$TMP/files.txt") plikow)"
fi

if [ ! -s "$TMP/todo.txt" ]; then
  echo ">> nic sie nie zmienilo, koniec"
  exit 0
fi

# haslo idzie do curla przez plik konfiguracyjny, nie przez linie polecen (nie widac go w ps)
printf 'user = "%s:%s"\n' "$FTP_USER" "$FTP_PASS" > "$TMP/curl.cfg"

# index.html, sw.js i manifest na koniec: przegladarka nie dostanie nowej wersji, zanim
# na serwerze nie beda wszystkie pliki, do ktorych sie odwoluje
grep -Ev '^(index\.html|sw\.js|registerSW\.js|manifest\.json)$' "$TMP/todo.txt" > "$TMP/order.txt" || true
grep -E '^(index\.html|sw\.js|registerSW\.js|manifest\.json)$' "$TMP/todo.txt" >> "$TMP/order.txt" || true

TOTAL=$(wc -l < "$TMP/order.txt")
BATCH=200
n=0
split -l "$BATCH" "$TMP/order.txt" "$TMP/part_"
for part in "$TMP"/part_*; do
  args=()
  while IFS= read -r f; do
    args+=(-T "dist/$f" "ftp://$FTP_HOST/$FTP_DIR/$f")
  done < "$part"
  curl -sS --ssl-reqd --ftp-create-dirs --retry 3 -K "$TMP/curl.cfg" "${args[@]}"
  n=$((n + $(wc -l < "$part")))
  echo "   wyslano $n / $TOTAL"
done

cp "$TMP/manifest.txt" "$STATE"
echo ">> gotowe -> https://onevoice27.adventist.pl/"
