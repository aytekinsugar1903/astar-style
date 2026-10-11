export const OUTFIT_AUDIENCES = ["women", "men", "unisex"] as const;
export const OUTFIT_OCCASIONS = ["wedding", "interview", "dinner", "holiday", "everyday", "date", "party", "graduation"] as const;
export const OUTFIT_SEASONS = ["spring", "summer", "autumn", "winter"] as const;
export const OUTFIT_STYLES = ["minimal", "classic", "casual", "romantic", "street", "office", "bold", "timeless"] as const;
export const OUTFIT_TEMPLATE_COUNT = OUTFIT_AUDIENCES.length * OUTFIT_OCCASIONS.length * OUTFIT_SEASONS.length * OUTFIT_STYLES.length;

