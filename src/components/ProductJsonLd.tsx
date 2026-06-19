import type { Product } from "../types";

interface Props {
  product: Product;
}

export default function ProductJsonLd({ product }: Props) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images[0],
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: "DiscretaStore",
    },
    offers: {
      "@type": "Offer",
      url: `${window.location.origin}/productos/${product.slug}`,
      priceCurrency: "CLP",
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    ...(product.rating > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        bestRating: 5,
        reviewCount: 1,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
