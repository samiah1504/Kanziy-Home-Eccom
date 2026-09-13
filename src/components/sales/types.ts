// The single view-model every sales-page template renders. Templates differ
// only in design/layout — content and functionality are identical, so a page
// can switch templates without touching product data or its URL.

export type Testimonial = {
  name: string;
  location?: string;
  text: string;
  rating?: number;
};

export type Faq = { q: string; a: string };
export type Spec = { label: string; value: string };
export type MediaVideo = { url: string; poster?: string };
export type ColorVariant = { name: string; image?: string };

export type SalesPageView = {
  page: {
    id: string;
    slug: string;
    template: string;
    headline: string;
    subheadline?: string;
    ctaText: string;
  };
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    shortPitch?: string;
    description?: string;
    features: string[];
    specifications: Spec[];
    dimensions?: string;
    materials?: string;
    colors: string[];
    colorVariants: ColorVariant[];
    deliveryInfo?: string;
    installationInfo?: string;
    images: string[];
    videos: MediaVideo[];
  };
  sellingPoints: string[];
  testimonials: Testimonial[];
  deliveryPhotos: string[];
  deliveryVideos: MediaVideo[];
  faqs: Faq[];
  contact: { phone: string; whatsapp: string };
};
