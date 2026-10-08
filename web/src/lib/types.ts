export type Category = "roti" | "kue_basah" | "risoles_lumpia";
export type Availability = "unconfirmed" | "ready" | "preorder" | "unavailable";

export type PublicProduct = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  description: string;
  priceRupiah: number | null;
  packageLabel: string | null;
  quantityUnit: string | null;
  availability: Availability;
  preorderLeadDays: number | null;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  imagePath: string | null;
  imageAlt: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  imagePositionX: number;
  imagePositionY: number;
  updatedAt: string | null;
};

export type ProductInput = {
  name: string;
  category: Category;
  description: string;
  priceRupiah: number;
  packageLabel: string | null;
  quantityUnit: string | null;
  availability: Availability;
  preorderLeadDays: number | null;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  imagePath: string | null;
  imageAlt: string | null;
  imagePositionX: number;
  imagePositionY: number;
};

export type AdminProduct = Omit<PublicProduct, "priceRupiah"> & { priceRupiah: number; createdAt: string };

export type SiteSettings = {
  whatsappNumber: string;
  instagramUrl: string;
  addressText: string;
  mapsUrl: string | null;
  openingTime: string;
  closingTime: string;
  timezone: "Asia/Jakarta";
  serviceDaysText: string | null;
  deliveryNote: string | null;
  pickupNote: string | null;
  gofoodUrl: string | null;
  shopeefoodUrl: string | null;
  snackMinBoxes: number | null;
  snackLeadDays: number | null;
  snackDescription: string | null;
  updatedAt: string;
};

export type PublicGalleryItem = {
  id: string;
  imagePath: string;
  imageAlt: string;
  caption: string | null;
  imageWidth: number;
  imageHeight: number;
  sortOrder: number;
  updatedAt: string;
};

export type AdminGalleryItem = PublicGalleryItem & { isActive: boolean; createdAt: string };
export type GalleryInput = Pick<AdminGalleryItem, "imagePath" | "imageAlt" | "caption" | "sortOrder" | "isActive">;
export type SettingsInput = Omit<SiteSettings, "timezone" | "updatedAt">;

export type CartItem = { productId: string; quantity: number };
export type StoredCart = { version: 1; items: CartItem[] };
export type CartRestoreResult = { cart: StoredCart; hadInvalidData: boolean };
export type CartReview = {
  lines: { product: PublicProduct; quantity: number; lineTotalRupiah: number }[];
  blockedItems: { productId: string; reason: "missing" | "unavailable" }[];
  subtotalRupiah: number;
  requiresPreorderDate: boolean;
  minimumRequestedDate: string | null;
};
export type Fulfillment = "delivery" | "pickup" | "undecided";
export type OrderPreferences = {
  fulfillment: Fulfillment;
  area?: string;
  requestedDate?: string;
  note?: string;
};
export type SnackInquiry = {
  eventType?: string;
  eventDate: string;
  boxes: number;
  contents?: string;
  budgetPerBox?: number;
  area?: string;
  note?: string;
};
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  description: string;
  price_rupiah: number;
  package_label: string | null;
  quantity_unit: string | null;
  availability: Availability;
  preorder_lead_days: number | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  image_path: string | null;
  image_alt: string | null;
  image_width: number | null;
  image_height: number | null;
  image_position_x: number;
  image_position_y: number;
  created_at: string;
  updated_at: string;
};

type GalleryItemRow = {
  id: string;
  image_path: string;
  image_alt: string;
  caption: string | null;
  image_width: number;
  image_height: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type SiteSettingsRow = {
  id: number;
  whatsapp_number: string;
  instagram_url: string;
  address_text: string;
  maps_url: string | null;
  opening_time: string;
  closing_time: string;
  timezone: "Asia/Jakarta";
  service_days_text: string | null;
  delivery_note: string | null;
  pickup_note: string | null;
  gofood_url: string | null;
  shopeefood_url: string | null;
  snack_min_boxes: number | null;
  snack_lead_days: number | null;
  snack_description: string | null;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      products: Table<ProductRow>;
      gallery_items: Table<GalleryItemRow>;
      site_settings: Table<SiteSettingsRow>;
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
