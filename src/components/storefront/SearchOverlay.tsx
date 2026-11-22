import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, X } from 'lucide-react';
import { services } from '../../services/registry';
import type { Product } from '../../types';
import { formatInr } from '../../utils/format';
import { ProductImage } from '../ui/ProductImage';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    let active = true;
    setIsSearching(true);
    void services.catalog
      .getProducts({ search: query })
      .then((items) => {
        if (active) {
          setResults(items.slice(0, 6));
        }
      })
      .finally(() => {
        if (active) {
          setIsSearching(false);
        }
      });
    return () => {
      active = false;
    };
  }, [open, query]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#2A0E4D]/35 px-4 pt-16 backdrop-blur-xs sm:pt-24"
      role="dialog"
      aria-modal="true"
      aria-label="Search GiftKart catalog"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl border border-[#EBD8FF] bg-white p-5 shadow-2xl shadow-[#6A11CB]/15"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 rounded-2xl border border-[#EBD8FF] bg-[#FAF6FF] px-4 py-2.5 focus-within:border-[#6A11CB]">
          <Search className="h-5 w-5 shrink-0 text-[#6A11CB]" />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search magic mugs, T-shirt prints, LED photo frames, SKU..."
            className="w-full bg-transparent text-sm text-[#2A0E4D] placeholder:text-[#7B6496] focus:outline-none sm:text-base"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[#5F4B78] hover:bg-[#EBD8FF]/70 hover:text-[#6A11CB]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          {isSearching ? (
            <p className="py-8 text-center text-sm text-[#5F4B78]">Searching GiftKart catalog...</p>
          ) : results.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#5F4B78]">
              No matching gifts found for &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <ul className="divide-y divide-[#F0E4FF]">
              {results.map((product) => (
                <li key={product.id}>
                  <Link
                    to={`/product/${product.slug}`}
                    onClick={onClose}
                    className="flex items-center justify-between gap-4 rounded-2xl px-2.5 py-3 transition-colors hover:bg-[#FAF6FF]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#EBD8FF] bg-[#FAF6FF]">
                        <ProductImage
                          src={product.images[0]}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#2A0E4D]">
                          {product.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-[#5F4B78]">
                          <span className="font-mono">{product.sku}</span> · {product.shortDescription}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-mono text-sm font-bold tabular-nums text-[#6A11CB]">
                        {formatInr(product.priceInr)}
                      </span>
                      <ArrowRight className="h-4 w-4 text-[#FF4D8D]" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#EBD8FF]/80 pt-3 text-xs text-[#5F4B78]">
          <span>Serving Jalchak · All prices in INR (₹)</span>
          <Link
            to={query.trim() ? `/search?search=${encodeURIComponent(query.trim())}` : '/search'}
            onClick={onClose}
            className="inline-flex items-center gap-1 font-semibold text-[#6A11CB] hover:text-[#FF4D8D]"
          >
            <span>View all results</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
