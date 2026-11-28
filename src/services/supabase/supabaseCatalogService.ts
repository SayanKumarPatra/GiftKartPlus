import type { ICatalogService } from '../interfaces';
import type { Category, Product, ProductFilterParams, Subcategory } from '../../types';
import {
  getSupabaseClient,
  isSupabaseSchemaMissingError,
  reportSchemaNotInitializedOnce,
} from '../../lib/supabase';
import { storeEvents } from '../../storage/storeEvents';
import { LocalCatalogService } from '../local/localCatalogService';
import {
  SCHEMA_MIGRATION_HINT,
  mapCategoryRow,
  mapProductRow,
} from './supabaseMappers';

const CATEGORY_COLS =
  'id,slug,name,description,image_url,sort_order,is_active,translations';
const SUBCATEGORY_COLS = 'id,category_id,slug,name,is_active,sort_order';
const PRODUCT_COLS =
  'id,slug,sku,name,short_description,description,price_inr,compare_at_price_inr,category_id,subcategory_id,occasion_tags,images,variants,availability,stock_count,is_best_seller,is_featured,is_active,is_archived,supports_personalization,supports_photo_upload,personalization_prompt,translations,created_at,updated_at';

export class SupabaseCatalogService implements ICatalogService {
  private readonly fallback = new LocalCatalogService();

  async getCategories(includeInactive = false): Promise<Category[]> {
    const client = getSupabaseClient();
    const [{ data: catRows, error: catErr }, { data: subRows, error: subErr }] =
      await Promise.all([
        client
          .from('categories')
          .select(CATEGORY_COLS)
          .order('sort_order', { ascending: true }),
        client
          .from('subcategories')
          .select(SUBCATEGORY_COLS)
          .order('sort_order', { ascending: true }),
      ]);

    if (catErr || subErr) {
      const err = catErr ?? subErr;
      if (isSupabaseSchemaMissingError(err)) {
        reportSchemaNotInitializedOnce('categories');
        return this.fallback.getCategories(includeInactive);
      }
      throw new Error(err?.message || 'Failed to load categories from Supabase.');
    }

    const subsByCategory = new Map<string, Record<string, unknown>[]>();
    for (const sub of (subRows ?? []) as Record<string, unknown>[]) {
      const catId = String(sub.category_id ?? '');
      const list = subsByCategory.get(catId) ?? [];
      list.push(sub);
      subsByCategory.set(catId, list);
    }

    const categories = ((catRows ?? []) as Record<string, unknown>[]).map((row) =>
      mapCategoryRow(row, subsByCategory.get(String(row.id ?? '')) ?? [])
    );

    if (includeInactive) {
      return categories;
    }

    return categories
      .filter((c) => c.isActive)
      .map((c) => ({
        ...c,
        subcategories: c.subcategories.filter((s) => s.isActive),
      }));
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const categories = await this.getCategories(false);
    return categories.find((c) => c.slug === slug) ?? null;
  }

  async saveCategory(category: Category): Promise<Category> {
    const client = getSupabaseClient();
    const { error: catErr } = await client.from('categories').upsert(
      {
        id: category.id,
        slug: category.slug.trim(),
        name: category.name.trim(),
        description: category.description ?? '',
        image_url: category.imageUrl ?? null,
        sort_order: Number(category.sortOrder) || 0,
        is_active: category.isActive !== false,
        translations: category.translations ?? {},
      },
      { onConflict: 'id' }
    );

    if (catErr) {
      if (isSupabaseSchemaMissingError(catErr)) {
        throw new Error(SCHEMA_MIGRATION_HINT);
      }
      throw new Error(catErr.message || 'Failed to save category.');
    }

    if (Array.isArray(category.subcategories)) {
      const incomingIds = category.subcategories.map((s) => s.id);
      if (category.subcategories.length > 0) {
        const subPayload = category.subcategories.map((sub, idx) => ({
          id: sub.id,
          category_id: category.id,
          slug: sub.slug.trim(),
          name: sub.name.trim(),
          is_active: sub.isActive !== false,
          sort_order: Number(sub.sortOrder) || idx + 1,
        }));
        const { error: subUpsertErr } = await client
          .from('subcategories')
          .upsert(subPayload, { onConflict: 'id' });
        if (subUpsertErr) {
          throw new Error(subUpsertErr.message || 'Failed to sync subcategories.');
        }
      }

      const { data: existingSubs } = await client
        .from('subcategories')
        .select('id')
        .eq('category_id', category.id);
      const staleIds = ((existingSubs ?? []) as { id: string }[])
        .map((r) => r.id)
        .filter((id) => !incomingIds.includes(id));
      if (staleIds.length > 0) {
        await client.from('subcategories').delete().in('id', staleIds);
      }
    }

    storeEvents.emit('catalog');
    return category;
  }

  async deleteCategory(categoryId: string, fallbackCategoryId?: string): Promise<void> {
    const client = getSupabaseClient();
    const categories = await this.getCategories(true);
    const remaining = categories.filter((c) => c.id !== categoryId);
    if (remaining.length === 0) {
      throw new Error('At least one category must remain in the catalog.');
    }

    const reassignTo =
      fallbackCategoryId && remaining.some((c) => c.id === fallbackCategoryId)
        ? fallbackCategoryId
        : remaining[0].id;

    const { error: reassignErr } = await client
      .from('products')
      .update({ category_id: reassignTo, subcategory_id: null })
      .eq('category_id', categoryId);

    if (reassignErr) {
      if (isSupabaseSchemaMissingError(reassignErr)) {
        throw new Error(SCHEMA_MIGRATION_HINT);
      }
      throw new Error(reassignErr.message || 'Failed to reassign category products.');
    }

    const { error: delErr } = await client.from('categories').delete().eq('id', categoryId);
    if (delErr) {
      throw new Error(delErr.message || 'Failed to delete category.');
    }

    storeEvents.emit('catalog');
  }

  async saveSubcategory(categoryId: string, subcategory: Subcategory): Promise<Category> {
    const client = getSupabaseClient();
    const { error } = await client.from('subcategories').upsert(
      {
        id: subcategory.id,
        category_id: categoryId,
        slug: subcategory.slug.trim(),
        name: subcategory.name.trim(),
        is_active: subcategory.isActive !== false,
        sort_order: Number(subcategory.sortOrder) || 0,
      },
      { onConflict: 'id' }
    );

    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        throw new Error(SCHEMA_MIGRATION_HINT);
      }
      throw new Error(error.message || 'Failed to save subcategory.');
    }

    storeEvents.emit('catalog');
    const all = await this.getCategories(true);
    const updated = all.find((c) => c.id === categoryId);
    if (!updated) {
      throw new Error('Category not found after saving subcategory.');
    }
    return updated;
  }

  async deleteSubcategory(categoryId: string, subcategoryId: string): Promise<Category> {
    const client = getSupabaseClient();
    await client
      .from('products')
      .update({ subcategory_id: null })
      .eq('subcategory_id', subcategoryId);

    const { error } = await client
      .from('subcategories')
      .delete()
      .eq('id', subcategoryId)
      .eq('category_id', categoryId);

    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        throw new Error(SCHEMA_MIGRATION_HINT);
      }
      throw new Error(error.message || 'Failed to delete subcategory.');
    }

    storeEvents.emit('catalog');
    const all = await this.getCategories(true);
    const updated = all.find((c) => c.id === categoryId);
    if (!updated) {
      throw new Error('Category not found after deleting subcategory.');
    }
    return updated;
  }

  async getProducts(filters?: ProductFilterParams): Promise<Product[]> {
    const client = getSupabaseClient();
    let query = client.from('products').select(PRODUCT_COLS);

    if (!filters?.includeInactive) {
      query = query.eq('is_active', true).eq('is_archived', false);
    }
    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters?.subcategoryId) {
      query = query.eq('subcategory_id', filters.subcategoryId);
    }
    if (filters?.bestSellersOnly) {
      query = query.eq('is_best_seller', true);
    }
    if (filters?.featuredOnly) {
      query = query.eq('is_featured', true);
    }
    if (filters?.customizableOnly) {
      query = query.eq('supports_personalization', true);
    }

    const { data, error } = await query;
    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        reportSchemaNotInitializedOnce('products');
        return this.fallback.getProducts(filters);
      }
      throw new Error(error.message || 'Failed to load products from Supabase.');
    }

    let list = ((data ?? []) as Record<string, unknown>[]).map(mapProductRow);

    if (filters?.occasion) {
      list = list.filter((p) => p.occasionTags.includes(filters.occasion!));
    }
    if (filters?.search?.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.occasionTags.some((t) => t.toLowerCase().includes(q))
      );
    }

    switch (filters?.sortBy) {
      case 'price-asc':
        list.sort((a, b) => a.priceInr - b.priceInr);
        break;
      case 'price-desc':
        list.sort((a, b) => b.priceInr - a.priceInr);
        break;
      case 'newest':
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
      case 'featured':
      default:
        list.sort((a, b) => {
          const scoreA = (a.isFeatured ? 2 : 0) + (a.isBestSeller ? 1 : 0);
          const scoreB = (b.isFeatured ? 2 : 0) + (b.isBestSeller ? 1 : 0);
          if (scoreB !== scoreA) return scoreB - scoreA;
          return b.updatedAt.localeCompare(a.updatedAt);
        });
        break;
    }

    return list;
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('products')
      .select(PRODUCT_COLS)
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        reportSchemaNotInitializedOnce('products');
        return this.fallback.getProductBySlug(slug);
      }
      throw new Error(error.message || 'Failed to load product.');
    }

    return data ? mapProductRow(data as Record<string, unknown>) : null;
  }

  async getProductById(id: string): Promise<Product | null> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('products')
      .select(PRODUCT_COLS)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        reportSchemaNotInitializedOnce('products');
        return this.fallback.getProductById(id);
      }
      throw new Error(error.message || 'Failed to load product.');
    }

    return data ? mapProductRow(data as Record<string, unknown>) : null;
  }

  async saveProduct(
    product: Omit<Product, 'createdAt' | 'updatedAt'> &
      Partial<Pick<Product, 'createdAt' | 'updatedAt'>>
  ): Promise<Product> {
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    const payload = {
      id: product.id,
      slug: product.slug.trim(),
      sku: product.sku.trim(),
      name: product.name.trim(),
      short_description: product.shortDescription ?? '',
      description: product.description ?? '',
      price_inr: Math.max(0, Number(product.priceInr) || 0),
      compare_at_price_inr:
        product.compareAtPriceInr !== undefined && product.compareAtPriceInr !== null
          ? Math.max(0, Number(product.compareAtPriceInr) || 0)
          : null,
      category_id: product.categoryId,
      subcategory_id: product.subcategoryId || null,
      occasion_tags: Array.isArray(product.occasionTags) ? product.occasionTags : [],
      images: Array.isArray(product.images) ? product.images : [],
      variants: Array.isArray(product.variants) ? product.variants : [],
      availability:
        product.availability ??
        (product.stockCount > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK'),
      stock_count: Math.max(0, Math.floor(Number(product.stockCount) || 0)),
      is_best_seller: Boolean(product.isBestSeller),
      is_featured: Boolean(product.isFeatured),
      is_active: product.isActive !== false,
      is_archived: Boolean(product.isArchived),
      supports_personalization: Boolean(product.supportsPersonalization),
      supports_photo_upload: Boolean(product.supportsPhotoUpload),
      personalization_prompt: product.personalizationPrompt ?? null,
      translations: product.translations ?? {},
      created_at: product.createdAt ?? now,
      updated_at: now,
    };

    const { data, error } = await client
      .from('products')
      .upsert(payload, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        throw new Error(SCHEMA_MIGRATION_HINT);
      }
      throw new Error(error.message || 'Failed to save product.');
    }

    storeEvents.emit('catalog');
    return mapProductRow(data as Record<string, unknown>);
  }

  async assignProductsToCategory(categoryId: string, productIds: string[]): Promise<void> {
    if (productIds.length === 0) return;
    const client = getSupabaseClient();
    const { error } = await client
      .from('products')
      .update({ category_id: categoryId, subcategory_id: null })
      .in('id', productIds);

    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        throw new Error(SCHEMA_MIGRATION_HINT);
      }
      throw new Error(error.message || 'Failed to assign products to category.');
    }
    storeEvents.emit('catalog');
  }

  async deleteProduct(productId: string): Promise<void> {
    const client = getSupabaseClient();
    const { error } = await client.from('products').delete().eq('id', productId);
    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        throw new Error(SCHEMA_MIGRATION_HINT);
      }
      throw new Error(error.message || 'Failed to delete product.');
    }
    storeEvents.emit('catalog');
  }
}
