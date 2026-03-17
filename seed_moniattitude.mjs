import { createConnection } from 'mysql2/promise';

// Utiliser la DATABASE_URL depuis les variables d'environnement système
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL non trouvée dans process.env');

// Produits MONI'ATTITUDE scrapés depuis moniattitude.com
const products = [
  { name: "Boucles d'oreilles fleur dorée", price: 16, url: "https://moniattitude.com/boucles-doreilles-fleur-en-argile1", image: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2F223655cb-e35b-42b9-9762-6496fba3ad45.jpeg" },
  { name: "Boucles d'oreilles fleur vertes", price: 16, url: "https://moniattitude.com/boucles-doreilles-fleur-vertes", image: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2F8429df8d-f6fb-49a7-83e1-a4f04182d234.jpeg" },
  { name: "Boucles d'oreilles fleur duo", price: 16, url: "https://moniattitude.com/boucles-doreilles-fleur", image: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2Fe2ce5eac-b2fe-4b93-a177-b74c2c3d272a.jpeg" },
  { name: "Boucles d'oreilles en argile polymère", price: 25, url: "https://moniattitude.com/boucles-doreilles-en-argile-097a", image: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2Fa8a7729d-580e-42e9-897b-263560a2b04e.jpeg" },
  { name: "Boucles d'oreilles artisanales", price: 26, url: "https://moniattitude.com/boucles-doreilles-artisanales-3a80", image: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2F5c3ce63a-9a59-492b-adb5-f2f38d001877.jpeg" },
  { name: "Boucles d'oreilles cœur tendre", price: 15, url: "https://moniattitude.com/boucles-doreilles-coeur", image: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2F3d65f8f0-2811-4400-9346-2285d731ae43.jpeg" },
  { name: "Boucles d'oreilles texturées et Acier inoxydable.", price: 26, url: "https://moniattitude.com/boucles-doreilles-texturees", image: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2F2f0c9074-1d10-48f5-8d38-38ed4cfe24ba.jpeg" },
  { name: "Boucles d'oreilles cœur blanches", price: 14, url: "https://moniattitude.com/boucles-doreilles-coeur-blanches", image: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2F7b8576c1-d840-43b7-aef6-f0061b441019.jpeg" },
  { name: "Boucles d'oreilles fleur blanches et paillettes", price: 16, url: "https://moniattitude.com/boucles-doreilles-fleur-blanches", image: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2F8fc3d27d-c42d-443a-9be9-fe2234f932af.jpeg" },
  { name: "Boucles d'oreilles vertes artisanales", price: 25, url: "https://moniattitude.com/boucles-doreilles-vertes-artisanales", image: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2F9f950437-65bf-417e-aba0-868b3161ae5a.jpeg" },
  { name: "Boucles d'oreilles géométriques blanches pailletée argent", price: 20, url: "https://moniattitude.com/boucles-doreilles-geometriques-blanches", image: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2F01604c9d-7c5a-40ee-b909-1a4723b35f51.jpeg" },
  { name: "Boucles d'oreilles camouflage vert et noir", price: 20, url: "https://moniattitude.com/boucles-doreilles-camouflage-vert", image: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2Fe8e92430-3df4-42fa-b27f-114bccebc4cb.jpeg" },
  { name: "Boucles d'oreilles militaires chic", price: 20, url: "https://moniattitude.com/boucles-doreilles-artistiques-f551", image: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2F57bce9a9-29c2-4d6d-aeb8-4e4a3cb8607d.jpeg" },
  { name: "Boucles d'oreilles feuille métalisée", price: 18, url: "https://moniattitude.com/boucles-doreilles-feuille-9c28", image: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2F1278bc3a-40dc-4bc2-9ae1-4b3090f43f42.jpeg" },
  { name: "Boucles d'oreilles blanches pailletées", price: 20, url: "https://moniattitude.com/boucles-doreilles-blanches-pailletees", image: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2F68400d57-908c-422c-a969-b8365fc9d207.jpeg" },
  { name: "Boucles d'oreilles feuilles sculptées", price: 18, url: "https://moniattitude.com/boucles-doreilles-feuilles-sculptees", image: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2Fdbd8d4c7-b6d5-451d-9e7a-4eed325d8f44.jpeg" },
  { name: "Boucles d'oreilles en forme de feuille", price: 18, url: "https://moniattitude.com/boucles-doreilles-en-forme-de-feuille", image: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2Fd69d6012-d55e-434c-96ef-1cd3fb18d025.jpeg" },
  { name: "Boucles d'oreilles sapin", price: 10, url: "https://moniattitude.com/boucles-doreilles-sapin", image: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2F65543404-c25b-41ff-8397-c836a74f0d92.jpeg" },
  { name: "Boucles d'oreilles cœur effet cuir", price: 15, url: "https://moniattitude.com/boucles-doreilles-coeur-argentees", image: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2F9a98880d-dd80-4668-83b5-f0f2deefb68a.jpeg" },
];

async function seed() {
  const conn = await createConnection(DATABASE_URL);
  
  try {
    // 1. Insérer la marque MONI'ATTITUDE
    console.log("Insertion de la marque MONI'ATTITUDE...");
    
    // Vérifier si la marque existe déjà
    const [existing] = await conn.execute("SELECT id FROM `partnerBrands` WHERE slug = 'moniattitude' LIMIT 1");
    
    let brandId;
    if (existing.length > 0) {
      brandId = existing[0].id;
      console.log(`Marque existante, ID: ${brandId}`);
    } else {
      const [result] = await conn.execute(
        `INSERT INTO \`partnerBrands\` (name, slug, description, websiteUrl, isPremium, isFeatured, specialty, country) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "MONI'ATTITUDE",
          "moniattitude",
          "Bijoux artisanaux uniques et significatifs. Créations faites main en argile polymère, résine UV et pierres semi-précieuses. Soignez votre bien-être avec des bijoux qui vous ressemblent.",
          "https://moniattitude.com",
          true,
          true,
          "Bijoux artisanaux, argile polymère, résine UV",
          "BE"
        ]
      );
      brandId = result.insertId;
      console.log(`Marque insérée, ID: ${brandId}`);
    }
    
    // 2. Insérer les bijoux
    console.log(`\nInsertion de ${products.length} bijoux...`);
    
    // Vider les bijoux existants de cette marque
    await conn.execute("DELETE FROM `partnerJewelry` WHERE brandId = ?", [brandId]);
    
    let inserted = 0;
    for (const p of products) {
      const priceInCents = Math.round(p.price * 100);
      
      await conn.execute(
        `INSERT INTO \`partnerJewelry\` 
         (brandId, name, type, description, priceInCents, currency, imageUrl, productUrl, metalType, gemType, collection, tags, isAvailable, isTryOnEnabled, tryOnImageUrl)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          brandId,
          p.name,
          'earrings', // Tous sont des boucles d'oreilles
          `${p.name} - Bijou artisanal fait main par MONI'ATTITUDE. Création unique en argile polymère ou résine UV.`,
          priceInCents,
          'EUR',
          p.image,
          p.url,
          'polymer', // argile polymère principalement
          'none',
          'Collection Artisanale',
          JSON.stringify(['fait main', 'artisanal', 'boucles oreilles', 'argile polymère', 'résine UV']),
          true,
          true,
          p.image // Utiliser la même image pour l'essayage
        ]
      );
      inserted++;
      console.log(`  ✓ ${p.name} (€${p.price})`);
    }
    
    // 3. Vérification
    const [count] = await conn.execute("SELECT COUNT(*) as c FROM `partnerJewelry` WHERE brandId = ?", [brandId]);
    console.log(`\n✅ ${count[0].c} bijoux insérés en base pour MONI'ATTITUDE`);
    
    const [brands] = await conn.execute("SELECT COUNT(*) as c FROM `partnerBrands`");
    console.log(`✅ ${brands[0].c} marque(s) partenaire(s) en base`);
    
  } finally {
    await conn.end();
  }
}

seed().catch(err => {
  console.error('Erreur:', err.message);
  process.exit(1);
});
