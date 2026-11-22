import type { ICatalogService } from '../interfaces';
import type { Category, Product, ProductFilterParams, Subcategory } from '../../types';
import { STORAGE_KEYS, readStorage, writeStorage } from '../../storage/localStorageEngine';
import { SEED_CATEGORIES, SEED_PRODUCTS, ensureDemoSeedHydrated } from '../../data/seedData';

export class LocalCatalogService implements ICatalogService {
  private readCategories(): Category[] {
    ensureDemoSeedHydrated();
    return readStorage<Category[]>(STORAGE_KEYS.CATEGORIES, SEED_CATEGORIES);
  }

  private readProducts(): Product[] {
    ensureDemoSeedHydrated();
    return readStorage<Product[]>(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS);
  }

  async getCategories(includeInactive = false): Promise<Category[]> {
    const all = this.readCategories();
    const sorted = [...all].sort((a, b) => a.sortOrder - b.sortOrder);
    if (includeInactive) {
      return sorted;
    }
    return sorted
      .filter((c) => c.isActive)
      .map((c) => ({
        ...c,
        subcategories: [...c.subcategories]
          .filter((s) => s.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }));
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const categories = await this.getCategories(true);
    return categories.find((c) => c.slug === slug) ?? null;
  }

  async saveCategory(category: Category): Promise<Category> {
    const all = this.readCategories();
    const index = all.findIndex((c) => c.id === category.id);
    const next = [...all];
    if (index >= 0) {
      next[index] = category;
    } else {
      next.push(category);
    }
    writeStorage(STORAGE_KEYS.CATEGORIES, next, 'catalog');
    return category;
  }

  async saveSubcategory(categoryId: string, subcategory: Subcategory): Promise<Category> {
    const all = this.readCategories();
    const index = all.findIndex((c) => c.id === categoryId);
    if (index < 0) {
      throw new Error(`Category not found: ${categoryId}`);
    }
    const target = all[index];
    const subIdx = target.subcategories.findIndex((s) => s.id === subcategory.id);
    const nextSubs = [...target.subcategories];
    if (subIdx >= 0) {
      nextSubs[subIdx] = subcategory;
    } else {
      nextSubs.push(subcategory);
    }
    const updated: Category = { ...target, subcategories: nextSubs };
    const nextAll = [...all];
    nextAll[index] = updated;
    writeStorage(STORAGE_KEYS.CATEGORIES, nextAll, 'catalog');
    return updated;
  }

  async deleteSubcategory(categoryId: string, subcategoryId: string): Promise<Category> {
    const all = this.readCategories();
    const index = all.findIndex((c) => c.id === categoryId);
    if (index < 0) {
      throw new Error(`Category not found: ${categoryId}`);
    }
    const target = all[index];
    const updated: Category = {
      ...target,
      subcategories: target.subcategories.filter((s) => s.id !== subcategoryId),
    };
    const nextAll = [...all];
    nextAll[index] = updated;
    writeStorage(STORAGE_KEYS.CATEGORIES, nextAll, 'catalog');
    return updated;
  }

  async getProducts(filters?: ProductFilterParams): Promise<Product[]> {
    let items = this.readProducts();

    if (!filters?.includeInactive) {
      items = items.filter((p) => p.isActive);
    }
    if (filters?.categoryId) {
      items = items.filter((p) => p.categoryId === filters.categoryId);
    }
    if (filters?.subcategoryId) {
      items = items.filter((p) => p.subcategoryId === filters.subcategoryId);
    }
    if (filters?.occasion) {
      const occ = filters.occasion;
      items = items.filter((p) => p.occasionTags.includes(occ));
    }
    if (filters?.bestSellersOnly) {
      items = items.filter((p) => p.isBestSeller);
    }
    if (filters?.featuredOnly) {
      items = items.filter((p) => p.isFeatured);
    }
    if (filters?.customizableOnly) {
      items = items.filter((p) => p.supportsPersonalization);
    }
    if (filters?.search && filters.search.trim().length > 0) {
      const q = filters.search.trim().toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.occasionTags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    const sorted = [...items];
    switch (filters?.sortBy) {
      case 'price-asc':
        sorted.sort((a, b) => a.priceInr - b.priceInr);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.priceInr - a.priceInr);
        break;
      case 'newest':
        sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
      default:
        sorted.sort((a, b) => Number(b.isBestSeller) - Number(a.isBestSeller));
        break;
    }

    return sorted;
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const items = this.readProducts();
    return items.find((p) => p.slug === slug) ?? null;
  }

  async getProductById(id: string): Promise<Product | null> {
    const items = this.readProducts();
    return items.find((p) => p.id === id) ?? null;
  }

  async saveProduct(
    product: Omit<Product, 'createdAt' | 'updatedAt'> &
      Partial<Pick<Product, 'createdAt' | 'updatedAt'>>
  ): Promise<Product> {
    const all = this.readProducts();
    const now = new Date().toISOString();
    const index = all.findIndex((p) => p.id === product.id);
    const saved: Product = {
      ...product,
      createdAt: index >= 0 ? all[index].createdAt : product.createdAt ?? now,
      updatedAt: now,
    };
    const next = [...all];
    if (index >= 0) {
      next[index] = saved;
    } else {
      next.unshift(saved);
    }
    writeStorage(STORAGE_KEYS.PRODUCTS, next, 'catalog');
    return saved;
  }

  async deleteProduct(productId: string): Promise<void> {
    const all = this.readProducts();
    const next = all.filter((p) => p.id !== productId);
    writeStorage(STORAGE_KEYS.PRODUCTS, next, 'catalog');
  }
}
