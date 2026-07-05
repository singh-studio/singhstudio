SINGH STUDIO — _incoming/

WHAT THIS FOLDER IS FOR

  Drop finished photo exports here — straight from Lightroom,
  Photos, or wherever you finish an edit. This folder is just a
  holding pen. Nothing on the live site ever reads from it directly.

THE DROP-AND-RUN FLOW

  1. Export your photo(s) here. Any of .jpg .jpeg .png .heic .tif
     .tiff works — the ingest script reads all of them.

  2. From the Website/ folder, run:

       bin/ingest-images.sh

     With no arguments, it processes every image sitting directly
     in this folder.

  3. The script resizes each one (1600px on the long edge by
     default, JPEG quality 80), writes it into assets/img/ under a
     cleaned-up version of its filename, and — if ffmpeg is
     installed — makes a matching .webp alongside it.

  4. Your original files in THIS folder are never touched or
     deleted. Once you're happy with what landed in assets/img/,
     clear this folder out yourself if you want the tidy-up; the
     script won't do it for you.

  5. Open the HTML page where the new image belongs and:
       - point the <img src="..."> (and any <source srcset="...">)
         at the new filename in assets/img/
       - update the width="" and height="" attributes to match the
         new file's real size — check it with:
             sips -g pixelWidth -g pixelHeight assets/img/your-file.jpg
       - write a real figcaption / alt text for the new photo.

  See IMAGE-MAP.md (in the Website/ root) for exactly which pages
  reference which images, and the two ready-made recipes at the
  bottom of it: "to add a new archive frame" and "to swap the hero".

GIVING A FILE A SPECIFIC NAME

  By default the script turns whatever your export is called into
  a clean, lowercase, hyphenated filename (e.g. "My Cool Photo
  (Final)_v2.jpg" becomes "my-cool-photo-final-v2.jpg"). If you'd
  rather control the name yourself — recommended, since the
  site's existing files follow simple naming patterns like
  "gal-*.jpg" for gallery shots and "ar-*.jpg" for archive-only
  frames — process one file at a time with --slug:

       bin/ingest-images.sh --slug gal-new-alley-shot _incoming/IMG_4821.jpg

A NEW HERO SHOT

       bin/ingest-images.sh --hero --slug hero-newshot _incoming/candidate.jpg

  --hero sizes to 2000px on the long edge instead of the usual
  1600px. See IMAGE-MAP.md's "to swap the hero" recipe for the
  full steps after this (the hero also needs a smaller -900
  companion export, which the script doesn't generate automatically).

FULL OPTIONS

       bin/ingest-images.sh --help

WHAT THIS FOLDER IS NOT

  - Not a backup. Keep your real originals (RAWs, PSDs, full-res
    masters) wherever you already keep them — this folder only
    ever holds the web-export copies you're about to run through
    the script.
  - Not served by the website. Nothing under _incoming/ is linked
    from any page, so half-finished drops here are safe and won't
    accidentally go live.
