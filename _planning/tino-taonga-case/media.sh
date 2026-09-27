#!/usr/bin/env bash
# Builds the web media for case-nextgen.html from the takes and stills.
#   bash media.sh <site-repo>
# Loops: H.264, silent, faststart, the last 0.6-0.8 s crossfaded into the
# first frames so the loop point never jumps. Desktop 1920 wide, phones 960.
# Posters and stills: progressive JPEG (magick, q82) + WebP sibling (cwebp, q80).
set -euo pipefail
SITE="$1"; ONLY="${2:-}"
HERE="$(cd "$(dirname "$0")" && pwd)"
VID="$SITE/assets/video"; IMG="$SITE/assets/img"
GUIDE_SHOTS="/Users/krissingh/Desktop/Singh Studio/01 Client Projects/Tino Taonga/Website guide/source/shots"
GUIDE_PDF="/Users/krissingh/Desktop/Singh Studio/01 Client Projects/Tino Taonga/Website guide/Tino Taonga website guide.pdf"
TMP="$HERE/enc"; mkdir -p "$TMP" "$VID" "$IMG"

dur() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }

# loop <take> <fade> <width> <crf> <out>
loop() {
  local src="$HERE/takes/$1/raw.mp4" F="$2" W="$3" CRF="$4" out="$5"
  local D; D=$(dur "$src")
  local OFF; OFF=$(python3 -c "print(round($D - 2*$F, 3))")
  ffmpeg -y -loglevel error -i "$src" -filter_complex \
    "[0:v]split=2[a][b];[a]trim=start=$F,setpts=PTS-STARTPTS,fps=30,settb=AVTB[m];[b]trim=end=$F,setpts=PTS-STARTPTS,fps=30,settb=AVTB[h];[m][h]xfade=transition=fade:duration=$F:offset=$OFF,scale=$W:-2:flags=lanczos,format=yuv420p[o]" \
    -map "[o]" -c:v libx264 -preset slow -crf "$CRF" -profile:v high -g 60 -movflags +faststart -an "$out"
  printf '%-22s %5.2f MB  %ss\n' "$(basename "$out")" "$(echo "$(stat -f%z "$out") / 1048576" | bc -l)" "$(dur "$out" | cut -c1-5)"
}

# img <source-png-or-jpg> <name> <width> [crop WxH+X+Y]
img() {
  local src="$1" name="$2" W="$3" crop="${4:-}"
  local tmp="$TMP/$name.png"
  if [ -n "$crop" ]; then magick "$src" -crop "$crop" +repage -resize "${W}x" "$tmp"; else magick "$src" -resize "${W}x" "$tmp"; fi
  magick "$tmp" -strip -interlace Plane -sampling-factor 4:2:0 -quality 82 "$IMG/$name.jpg"
  cwebp -quiet -q 80 -m 6 "$tmp" -o "$IMG/$name.webp"
  printf '%-22s %sx%s  jpg %4d KB  webp %4d KB\n' "$name" $(magick identify -format '%w %h' "$IMG/$name.jpg") $(( $(stat -f%z "$IMG/$name.jpg") / 1024 )) $(( $(stat -f%z "$IMG/$name.webp") / 1024 ))
}

# imgx <source> <name> <width> <crop> <extent>: crop, then pad to a ratio on the site's cream
imgx() {
  local src="$1" name="$2" W="$3" crop="$4" ext="$5"
  magick "$src" -crop "$crop" +repage -background 'rgb(245,237,227)' -gravity center -extent "$ext" "$TMP/$name-x.png"
  img "$TMP/$name-x.png" "$name" "$W"
}

# frame <take> <time> <out.png>
frame() { ffmpeg -y -loglevel error -ss "$2" -i "$HERE/takes/$1/raw.mp4" -frames:v 1 "$3"; }


# bash media.sh <site> hub   -> rebuild just the Hub loop + poster
if [ "$ONLY" = hub ]; then
  loop hub 0.5 1920 28 "$VID/tt-hub.mp4"; loop hub 0.5 960 29 "$VID/tt-hub-960.mp4"
  frame hub 6.3 "$TMP/p-hub.png"; img "$TMP/p-hub.png" tt-hub 1600
  exit 0
fi

echo "== loops"
loop home  0.7 1920 28 "$VID/tt-home.mp4";   loop home  0.7 960 29 "$VID/tt-home-960.mp4"
loop hub   0.5 1920 28 "$VID/tt-hub.mp4";    loop hub   0.5 960 29 "$VID/tt-hub-960.mp4"
loop team  0.8 1920 28 "$VID/tt-team.mp4";   loop team  0.8 960 29 "$VID/tt-team-960.mp4"
loop menu  0.6 1920 28 "$VID/tt-menu.mp4";   loop menu  0.6 960 29 "$VID/tt-menu-960.mp4"
loop phone 0.6 720  28 "$VID/tt-phone.mp4"

echo "== posters (the picture under each loop)"
frame home  9.0  "$TMP/p-home.png";  img "$TMP/p-home.png"  tt-home  1600
frame hub   6.3  "$TMP/p-hub.png";   img "$TMP/p-hub.png"   tt-hub   1600
frame team  13.4 "$TMP/p-team.png";  img "$TMP/p-team.png"  tt-team  1600
frame menu  4.9  "$TMP/p-menu.png";  img "$TMP/p-menu.png"  tt-menu  1600
frame phone 0.4  "$TMP/p-phone.png"; img "$TMP/p-phone.png" tt-phone 720

echo "== stills"
img "$GUIDE_SHOTS/e04-kidscamp-post.jpg" tt-editor 760 "754x993+429+15"
img "$HERE/stills/kidscamp.png"   tt-kidscamp 1600
img "$HERE/stills/post.png"       tt-post     1400 "1832x1145+524+120"
imgx "$HERE/stills/person.png"    tt-person-help 1400 "2480x1370+200+1985" 2480x1550
frame find 10.8 "$TMP/p-find.png"; img "$TMP/p-find.png" tt-find 1600
frame team 9.2 "$TMP/p-hover.png"; img "$TMP/p-hover.png" tt-hover 1400 "1728x1080+890+405"
img "$HERE/stills/phonehub.png"   tt-phone-filters 600

echo "== guide pages"
for n in 1 3 12; do
  gs -q -dNOPAUSE -dBATCH -sDEVICE=png16m -r150 -dFirstPage=$n -dLastPage=$n -sOutputFile="$TMP/guide-$n.png" "$GUIDE_PDF"
done
img "$TMP/guide-1.png"  tt-guide-cover 900
img "$TMP/guide-3.png"  tt-guide-fit   900
img "$TMP/guide-12.png" tt-guide-post  900

echo "== work card + og (homepage, film held at 10.5 s)"
img "$HERE/stills/home-10.5.png" work-nextgen 1600
img "$HERE/stills/home-10.5.png" work-nextgen-800 800
