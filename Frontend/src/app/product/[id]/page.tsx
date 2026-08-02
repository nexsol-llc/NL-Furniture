import { Metadata } from "next";
import ProductDetailClient from "./ProductDetailClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getProductData(id: string) {
  try {
    if (id.startsWith("manual-")) {
      const parts = id.split("-");
      const category = parts[1] || "furniture";
      const indexStr = parts[2] || "1";
      const idx = parseInt(indexStr, 10);

      let name = "Premium Produkt";
      let price = "199,00 €";
      let image: string | null = null;
      let brand = "NL FURNITURE";

      if (category === "bed") {
        const beds = [
          { name: "Kingsize-Polsterbett Royal", price: "499,00 €", image: null, brand: "NL FURNITURE" },
          { name: "Boxspringbett Modern Loft", price: "749,00 €", image: null, brand: "SchlafWelt" },
          { name: "Massivholzbett Comfort", price: "389,00 €", image: null, brand: "NatureLine" },
          { name: "Polsterbett Velvet Touch", price: "649,00 €", image: null, brand: "NordicDesign" },
        ];
        const item = beds[idx - 1] || beds[0];
        name = item.name; price = item.price; image = item.image; brand = item.brand;
      } else if (category === "chair") {
        const chairs = [
          { name: "Esszimmerstuhl Velvet Gold", price: "89,00 €", image: null, brand: "NL FURNITURE" },
          { name: "Loungesessel Retro Design", price: "189,00 €", image: null, brand: "SitWell" },
          { name: "Bürostuhl Ergonomic Pro", price: "149,00 €", image: null, brand: "WorkStyle" },
          { name: "Holzstuhl Classic Oak", price: "79,00 €", image: null, brand: "NatureLine" },
        ];
        const item = chairs[idx - 1] || chairs[0];
        name = item.name; price = item.price; image = item.image; brand = item.brand;
      } else if (category === "table") {
        const tables = [
          { name: "Couchtisch Set Rustikal", price: "129,00 €", image: null, brand: "NL FURNITURE" },
          { name: "Esstisch Eiche Massiv", price: "459,00 €", image: null, brand: "NatureLine" },
          { name: "Glastisch Modern Lounge", price: "199,00 €", image: null, brand: "LoftStyle" },
          { name: "Beistelltisch Minimalist", price: "69,00 €", image: null, brand: "NordicDesign" },
        ];
        const item = tables[idx - 1] || tables[0];
        name = item.name; price = item.price; image = item.image; brand = item.brand;
      } else {
        const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
        const general = [
          { name: `Premium ${categoryTitle} Loft`, price: "299,00 €", image: null, brand: "NL FURNITURE" },
          { name: `Designer ${categoryTitle} Classic`, price: "189,00 €", image: null, brand: "HomeLiving" },
          { name: `Cozy ${categoryTitle} Minimalist`, price: "149,00 €", image: null, brand: "NordicDesign" },
          { name: `Modern ${categoryTitle} Elegance`, price: "389,00 €", image: null, brand: "LoftStyle" },
        ];
        const item = general[idx - 1] || general[0];
        name = item.name; price = item.price; image = item.image; brand = item.brand;
      }

      return {
        _id: id,
        id: id,
        product_name: name,
        display_price: price,
        price: price.replace(/[^\d.,]/g, "").trim(),
        merchant_image_url: image,
        brand_name: brand,
        brand_logo: `https://logo.clearbit.com/nl-furniture.nl`,
        merchant_name: brand,
        description: `Erleben Sie exklusiven Wohnkomfort mit dem Produkt ${name} von ${brand}. Perfekt gestaltet, um Ihrem Zuhause einen Hauch von Eleganz und Modernität zu verleihen.`,
        delivery_cost: "0",
        aw_deep_link: "https://www.nl-furniture.nl",
      };
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/product/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("getProductData error:", error);
    return null;
  }
}

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductData(params.id);
  if (!product) {
    return {
      title: "Produkt nicht gefunden | NL FURNITURE",
      description: "Dieses Produkt ist auf nl-furniture.nl nicht verfügbar.",
    };
  }

  const title = `${product.product_name} kaufen | NL FURNITURE`;
  const description = product.description
    ? product.description.substring(0, 155) + "..."
    : `${product.product_name} von ${product.brand_name || "NL FURNITURE"}. Entdecken Sie exklusive Möbel und Angebote online.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [product.merchant_image_url || product.aw_image_url || ""],
    },
  };
}

export default async function Page({ params }: Props) {
  const product = await getProductData(params.id);
  if (!product) {
    notFound();
  }

  return <ProductDetailClient initialProduct={product} />;
}
