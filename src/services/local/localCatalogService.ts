import type { ICatalogService } from '../interfaces';
import type { Category, Product, ProductFilterParams, Subcategory } from '../../types';
import {
  ensureServerHydrated,
  getLiveStore,
  saveAdminCollection,
} from '../../storage/serverSync';
import { ALL_GIFTS_CATEGORY_ID } from '../../config/seedData';
import { filterStorefrontProducts, getProductAvailability } from '../../utils/productCatalog';

export class LocalCatalogService implements ICatalogService {
  private async readCategories(): Promise<Category[]> {
    await ensureServerHydrated();
    return getLiveStore().categories;
  }

  private async readProducts(): Promise<Product[]> {
    await ensureServerHydrated();
    return getLiveStore().products;
  }

  async getCategories(includeInactive = false): Promise<Category[]> {
    const all = await this.readCategories();
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
    const all = await this.readCategories();
    const normalizedSlug = category.slug.trim().toLowerCase();
    const normalizedName = category.name.trim().toLowerCase();
    const conflict = all.find(
      (c) =>
        c.id !== category.id &&
        (c.slug.trim().toLowerCase() === normalizedSlug ||
          c.name.trim().toLowerCase() === normalizedName)
    );
    if (conflict) {
      throw new Error(`A category named "${conflict.name}" already exists.`);
    }

    const index = all.findIndex((c) => c.id === category.id);
    const next = [...all];
    if (index >= 0) {
      next[index] = {
        ...category,
        id: all[index].id,
      };
    } else {
      next.push(category);
    }
    await saveAdminCollection('categories', next, 'catalog');
    return index >= 0 ? next[index] : category;
  }

  async deleteCategory(categoryId: string, fallbackCategoryId?: string): Promise<void> {
    if (categoryId === ALL_GIFTS_CATEGORY_ID) {
      return;
    }
    const allCategories = await this.readCategories();
    const remainingCategories = allCategories.filter((c) => c.id !== categoryId);
    const allProducts = await this.readProducts();
    const linkedProducts = allProducts.filter((p) => p.categoryId === categoryId);

    if (linkedProducts.length > 0) {
      const targetFallback =
        (fallbackCategoryId &&
          remainingCategories.find((c) => c.id === fallbackCategoryId)?.id) ||
        remainingCategories.find((c) => c.id !== ALL_GIFTS_CATEGORY_ID && c.isActive)?.id ||
        remainingCategories.find((c) => c.id !== ALL_GIFTS_CATEGORY_ID)?.id ||
        ALL_GIFTS_CATEGORY_ID;

      const now = new Date().toISOString();
      const updatedProducts = allProducts.map((product) =>
        product.categoryId === categoryId
          ? {
              ...product,
              categoryId: targetFallback,
              subcategoryId: undefined,
              updatedAt: now,
            }
          : product
      );
      await saveAdminCollection('products', updatedProducts, 'catalog');
    }

    await saveAdminCollection('categories', remainingCategories, 'catalog');
  }

  async saveSubcategory(categoryId: string, subcategory: Subcategory): Promise<Category> {
    const all = await this.readCategories();
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
    await saveAdminCollection('categories', nextAll, 'catalog');
    return updated;
  }

  async deleteSubcategory(categoryId: string, subcategoryId: string): Promise<Category> {
    const all = await this.readCategories();
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
    await saveAdminCollection('categories', nextAll, 'catalog');
    return updated;
  }

  async getProducts(filters?: ProductFilterParams): Promise<Product[]> {
    let items = await this.readProducts();

    if (!filters?.includeInactive) {
      const categories = await this.readCategories();
      items = filterStorefrontProducts(items, categories);
    }
    if (filters?.categoryId && filters.categoryId !== ALL_GIFTS_CATEGORY_ID) {
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
    const items = await this.readProducts();
    return items.find((p) => p.slug === slug) ?? null;
  }

  async getProductById(id: string): Promise<Product | null> {
    const items = await this.readProducts();
    return items.find((p) => p.id === id) ?? null;
  }

  async saveProduct(
    product: Omit<Product, 'createdAt' | 'updatedAt'> &
      Partial<Pick<Product, 'createdAt' | 'updatedAt'>>
  ): Promise<Product> {
    const all = await this.readProducts();
    const now = new Date().toISOString();
    const index = all.findIndex((p) => p.id === product.id);
    const saved: Product = {
      ...product,
      availability: product.availability ?? getProductAvailability(product as Product),
      createdAt: index >= 0 ? all[index].createdAt : product.createdAt ?? now,
      updatedAt: now,
    };
    const next = [...all];
    if (index >= 0) {
      next[index] = saved;
    } else {
      next.unshift(saved);
    }
    await saveAdminCollection('products', next, 'catalog');
    return saved;
  }

  async assignProductsToCategory(categoryId: string, productIds: string[]): Promise<void> {
    if (categoryId === ALL_GIFTS_CATEGORY_ID) {
      return;
    }
    const idSet = new Set(productIds);
    const all = await this.readProducts();
    const now = new Date().toISOString();
    let changed = false;
    const next = all.map((p) => {
      if (idSet.has(p.id) && p.categoryId !== categoryId) {
        changed = true;
        return {
          ...p,
          categoryId,
          subcategoryId: undefined,
          updatedAt: now,
        };
      }
      return p;
    });
    if (changed) {
      await saveAdminCollection('products', next, 'catalog');
    }
  }

  async deleteProduct(productId: string): Promise<void> {
    const all = await this.readProducts();
    const next = all.filter((p) => p.id !== productId);
    await saveAdminCollection('products', next, 'catalog');
  }
}
