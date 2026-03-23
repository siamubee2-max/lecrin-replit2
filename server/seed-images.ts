/**
 * Migrate all demo images from CDN to Supabase Storage.
 * Downloads each image and re-uploads to the "images" bucket.
 *
 * Usage: Called via tRPC admin.seedImages endpoint.
 */

import { ensureBucket, migrateImageToSupabase, uploadToSupabase } from "./supabase-storage";
import { generateImage } from "./_core/imageGeneration";

// ─── Old CDN URLs mapped to new Supabase Storage paths ───────────────────────

const MANUSCDN = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663144691943";
const CLOUDFRONT = "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK";

interface MigrationEntry {
  source: string;
  target: string;
}

const MIGRATIONS: MigrationEntry[] = [
  // ── Jewelry (manuscdn) ────────────────────────────────────────────────────
  ...[
    "AdlrDYXkOyPhDCRC.jpg", "pmqnnFKjXVuQOvRn.jpg", "stRulhTckXsGxDQi.jpg",
    "aNpFyVQfcOhjIwdS.jpg", "cyJJDUWYzkgzSTbF.jpg",
    "foIbwvIEZnQRCkLk.jpeg", "haAwgRGsClqKFANk.jpeg", "xObLlbhKgtqgQKtR.jpeg",
    "jxfiqAoWKZPAIFjU.jpeg", "CAEjpatzbSHKxJTS.jpeg", "HZMcGGjuhtIOsCCh.jpeg",
    "DTttUkeYfSQGDWYX.jpeg", "udutSvgNwUOYCjca.jpeg", "SSbYeXEaRLVOrBMD.jpeg",
    "rjfmUlamBZcBgUfF.jpeg", "enfnjOfHaPReDorw.jpeg", "PmXGVTpIdVrAoJbK.jpeg",
    "jGuXuEkhGyksTrjf.png",
    // Jewelry try-on items
    "mUaeVRKTyNsSwydj.png", "DbsZECnmnScwGXrK.png", "MHrMUbGtWuDsPAWp.png",
    "QXWjEMeEMxnUaJWM.png", "cWuBMzcdacdWSBif.png", "vDUNWJgUqNeqgxuD.png",
    "BQcYjBycBufjuRzd.png", "lNdRViMTySQvUjlT.png", "KguAeTqThjCsvecs.png",
    "gvMlujGZrGdQxNrU.png", "YIEQPKPDArbEBfgo.png", "mEFFJpvLNjtkSKFp.png",
    "ksjchgAauBTgoIRP.png", "NHrMayoaxkGwRAzw.png", "iXSRVmYBQKSVkIgb.png",
    "mKMdkYLxQkBcagIz.png", "CSMPqWqsSMHWRAJD.png", "ywEJZiJNFCWSyekZ.png",
    "vqeMhpwfZUJaaVDJ.png", "StedFUyGMBUqcAEe.png",
    "pIwhbFaxajqlBLDM.jpg",
    "UpdTPopWOOkisAfZ.jpg", "LRXLSFlVyKYRjWpN.jpg", "cShFnzrgsYCAyoJP.jpg",
    "YtSJSMdauwcduZlE.png", "QFSIpqZaBEqDrjMr.png",
    "bpNfAkbDYoWBSChW.jpg",
    "QGrKcPORwuBopwXN.jpg", "JCdnbNtrgayfIQha.jpg",
    "QruapqyLkIGpMclo.jpg", "hjdHxGFegLggYIVj.png",
  ].map((f) => ({ source: `${MANUSCDN}/${f}`, target: `jewelry/${f}` })),

  // ── Mannequins (manuscdn) ─────────────────────────────────────────────────
  ...[
    "btMXmGHNLbTjRmEE.jpg", "jyiRZUGrdRTgSIXJ.jpg", "FpgJONMhzLalyhTi.jpg",
    "xXJqyGvkbrFwBBHV.jpg", "MNVdSmIpPxYSClIs.jpg",
    "OdSiQtPIdenBVntk.jpg",
    "abbVLmuyWSwhhikh.jpg", "OxGFokpAzdVyeaCp.jpg", "JrHRSXiGdwkxFloI.jpg",
    "WJYefCuswobmjOFn.jpg", "NiGpqbuSbzvVeGpE.jpg",
    "FAAIQjDUYqvqrnSP.jpg", "iEKDtQHwyiIzFBLs.jpg", "uEwQwHLXMbeskowf.jpg",
  ].map((f) => ({ source: `${MANUSCDN}/${f}`, target: `mannequins/${f}` })),

  // ── Clothing mannequins (cloudfront) ──────────────────────────────────────
  ...([
    ["mannequin_clothing_1-NMjfajcjDr3xKvyP6m8ScU.png", "mannequin_clothing_1.png"],
    ["mannequin_clothing_2-ifFLrH5RK6PFETN24qS4uU.png", "mannequin_clothing_2.png"],
    ["mannequin_clothing_3-eksVcWTy4WsdKFxTB58UqB.png", "mannequin_clothing_3.png"],
    ["mannequin_clothing_4-jHS97Wxe3UQjYC29y7TTqj.png", "mannequin_clothing_4.png"],
    ["mannequin_clothing_5-42iLYadbUPkEQthn5qZ2KU.png", "mannequin_clothing_5.png"],
    ["mannequin_male_1-YauFjdb5sCH9zPtipQYXKv.png", "mannequin_male_1.png"],
    ["mannequin_male_2-Kmqm7sUucV8UiiCFwcBtFC.png", "mannequin_male_2.png"],
    ["mannequin_male_3-MJNcZ2y3hq7GHYo6V4YcE7.png", "mannequin_male_3.png"],
    ["mannequin_neutral_1-PedjpBcTeBVGVwLQsDrrd9.png", "mannequin_neutral_1.png"],
    ["mannequin_neutral_2-8s94exuUCHa2ANdrbNRmMx.png", "mannequin_neutral_2.png"],
    ["mannequin_neutral_3-nyGQKCBEPHFfvXxc4WAQwY.png", "mannequin_neutral_3.png"],
  ] as [string, string][]).map(([src, dest]) => ({
    source: `${CLOUDFRONT}/${src}`,
    target: `mannequins/${dest}`,
  })),

  // ── Shoes (cloudfront) ────────────────────────────────────────────────────
  ...([
    ["shoes_heels_gold-5ktPRGoZ7VXeYgEdLP5D3k.png", "shoes_heels_gold.png"],
    ["shoes_sneakers_white-TcUCe77Tti8vbH2Tg2aasU.png", "shoes_sneakers_white.png"],
    ["shoes_boots_black-h7zsKaSzi9qv5jNSQAHbHy.png", "shoes_boots_black.png"],
    ["shoes_sandals_nude-A8rHiR6HNekahFBBff3Anu.png", "shoes_sandals_nude.png"],
  ] as [string, string][]).map(([src, dest]) => ({
    source: `${CLOUDFRONT}/${src}`,
    target: `shoes/${dest}`,
  })),

  // ── Clothing (cloudfront) ─────────────────────────────────────────────────
  ...([
    ["clothing_dress_black-C4XiYtX54R2EZijznwBAsb.png", "clothing_dress_black.png"],
    ["clothing_blazer_camel-auFvdrjD8tJ3RwphvuczjX.png", "clothing_blazer_camel.png"],
    ["clothing_blouse_ivory-FqFvVqikVUAH8cJaGp8y2Q.png", "clothing_blouse_ivory.png"],
    ["clothing_pants_navy-mtvRm4h698yNo9YWgMgVkq.png", "clothing_pants_navy.png"],
  ] as [string, string][]).map(([src, dest]) => ({
    source: `${CLOUDFRONT}/${src}`,
    target: `clothing/${dest}`,
  })),

  // ── Accessories (cloudfront) ──────────────────────────────────────────────
  ...([
    ["accessory_bag_black-gMLsmwChKXggLLiGyaLkMb.png", "accessory_bag_black.png"],
    ["accessory_belt_gold-Dk95mij6htDppq7nu96YMr.png", "accessory_belt_gold.png"],
    ["accessory_sunglasses_black-GND6LDni5Tdui7goSAgoGZ.png", "accessory_sunglasses_black.png"],
    ["accessory_scarf_beige-ntRsXz97J7pnhvggCL3sN7.png", "accessory_scarf_beige.png"],
  ] as [string, string][]).map(([src, dest]) => ({
    source: `${CLOUDFRONT}/${src}`,
    target: `accessories/${dest}`,
  })),

  // ── Hats (cloudfront) ─────────────────────────────────────────────────────
  ...([
    ["hat_bob_beige-HhGboqTxDiL54ad8MnDCD7.webp", "hat_bob_beige.webp"],
    ["hat_cap_black-eoUQeGAR5BDm5SGqfmFg9L.webp", "hat_cap_black.webp"],
    ["hat_straw_summer-bQwBFDXdKH6t8VdBv33RsZ.webp", "hat_straw_summer.webp"],
  ] as [string, string][]).map(([src, dest]) => ({
    source: `${CLOUDFRONT}/${src}`,
    target: `hats/${dest}`,
  })),

  // ── Watches (cloudfront) ──────────────────────────────────────────────────
  ...([
    ["watch_classic_gold-hCfAhBvMghWX3VNW8SLVcz.webp", "watch_classic_gold.webp"],
    ["watch_sport_black-SexGEybF3TtRBCe7XBSQbM.webp", "watch_sport_black.webp"],
    ["watch_luxury_silver-9mRSmbzaU66Q4hPwbfEnP9.webp", "watch_luxury_silver.webp"],
  ] as [string, string][]).map(([src, dest]) => ({
    source: `${CLOUDFRONT}/${src}`,
    target: `watches/${dest}`,
  })),

  // ── Ecrin category examples (cloudfront) ──────────────────────────────────
  ...([
    ["necklace_example_ddb00585.png", "necklace_example.png"],
    ["earrings_example_bcf0dd76.png", "earrings_example.png"],
    ["ring_example_7651ac1d.png", "ring_example.png"],
    ["bracelet_0cceb60d.png", "bracelet_example.png"],
    ["anklet_25156a89.png", "anklet_example.png"],
  ] as [string, string][]).map(([src, dest]) => ({
    source: `${CLOUDFRONT}/${src}`,
    target: `ecrin/${dest}`,
  })),
];

export interface SeedResult {
  total: number;
  migrated: number;
  failed: number;
  generated: number;
  errors: string[];
}

/**
 * Migrate all demo images from CDN to Supabase Storage.
 */
export async function seedImages(options?: { generateNew?: boolean }): Promise<SeedResult> {
  const result: SeedResult = { total: MIGRATIONS.length, migrated: 0, failed: 0, generated: 0, errors: [] };

  // Ensure bucket exists
  await ensureBucket();

  // Migrate existing images (5 concurrent)
  const batchSize = 5;
  for (let i = 0; i < MIGRATIONS.length; i += batchSize) {
    const batch = MIGRATIONS.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((entry) => migrateImageToSupabase(entry.source, entry.target)),
    );
    for (const r of results) {
      if (r.status === "fulfilled") {
        result.migrated++;
      } else {
        result.failed++;
        result.errors.push(r.reason?.message ?? "Unknown error");
      }
    }
  }

  // Optionally generate new example images via AI
  if (options?.generateNew) {
    const newImages = [
      { prompt: "Elegant gold pendant necklace with a small diamond, on a white background, product photography, high resolution", target: "jewelry/generated_necklace_gold.png" },
      { prompt: "Stylish silver hoop earrings with small crystals, on a white background, product photography, high resolution", target: "jewelry/generated_earrings_silver.png" },
      { prompt: "Classic leather black stiletto heels, side view, on a white background, product photography, high resolution", target: "shoes/generated_heels_black.png" },
      { prompt: "Elegant red cocktail dress on a mannequin, on a white background, product photography, high resolution", target: "clothing/generated_dress_red.png" },
      { prompt: "Luxury brown leather crossbody bag, on a white background, product photography, high resolution", target: "accessories/generated_bag_brown.png" },
    ];

    for (const item of newImages) {
      try {
        const genResult = await generateImage({ prompt: item.prompt });
        if (genResult.url) {
          // Download generated image and upload to Supabase
          const response = await fetch(genResult.url);
          const buffer = Buffer.from(await response.arrayBuffer());
          await uploadToSupabase(item.target, buffer, "image/png");
          result.generated++;
        }
      } catch (err) {
        result.errors.push(`Generate ${item.target}: ${err instanceof Error ? err.message : "unknown"}`);
      }
    }
  }

  return result;
}
