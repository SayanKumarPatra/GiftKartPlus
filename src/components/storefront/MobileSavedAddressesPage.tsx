import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Check,
  ChevronDown,
  Grip,
  Home,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Save,
  SquarePen,
  Tag,
  Trash2,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSavedAddresses, useStoreSettings } from '../../hooks/useStoreData';
import { services } from '../../services/registry';
import type { SavedAddress } from '../../types';
import {
  validateEmail,
  validateIndianPhone,
  validateIndianPincode,
  validateRequired,
} from '../../utils/validation';

type AddressTypeOption = 'Home' | 'Work' | 'Other';

interface PinLookupResult {
  state: string;
  city?: string;
  area?: string;
}

const EXACT_PIN_DIRECTORY: Record<string, PinLookupResult> = {
  '721155': { state: 'West Bengal', city: 'Paschim Medinipur', area: 'Jalchak' },
  '721101': { state: 'West Bengal', city: 'Paschim Medinipur', area: 'Medinipur' },
  '721102': { state: 'West Bengal', city: 'Paschim Medinipur', area: 'Medinipur' },
  '721301': { state: 'West Bengal', city: 'Paschim Medinipur', area: 'Kharagpur' },
  '721302': { state: 'West Bengal', city: 'Paschim Medinipur', area: 'IIT Kharagpur' },
  '721131': { state: 'West Bengal', city: 'Paschim Medinipur', area: 'Pingla' },
  '721140': { state: 'West Bengal', city: 'Paschim Medinipur', area: 'Sabang' },
  '721126': { state: 'West Bengal', city: 'Paschim Medinipur', area: 'Debra' },
  '721146': { state: 'West Bengal', city: 'Paschim Medinipur', area: 'Ghatal' },
  '721602': { state: 'West Bengal', city: 'Purba Medinipur', area: 'Haldia' },
  '721636': { state: 'West Bengal', city: 'Purba Medinipur', area: 'Tamluk' },
  '700156': { state: 'West Bengal', city: 'Kolkata', area: 'New Town' },
  '700091': { state: 'West Bengal', city: 'Kolkata', area: 'Salt Lake' },
  '700001': { state: 'West Bengal', city: 'Kolkata', area: 'BBD Bagh' },
  '711101': { state: 'West Bengal', city: 'Howrah', area: 'Howrah Maidan' },
  '713216': { state: 'West Bengal', city: 'Paschim Bardhaman', area: 'Durgapur' },
};

const STATE_BY_PIN_PREFIX: Array<{ prefixes: string[]; state: string }> = [
  { prefixes: ['11'], state: 'Delhi' },
  { prefixes: ['12', '13'], state: 'Haryana' },
  { prefixes: ['14', '15', '16'], state: 'Punjab' },
  { prefixes: ['17'], state: 'Himachal Pradesh' },
  { prefixes: ['18', '19'], state: 'Jammu & Kashmir' },
  { prefixes: ['20', '21', '22', '23', '24', '25', '26', '27', '28'], state: 'Uttar Pradesh' },
  { prefixes: ['30', '31', '32', '33', '34'], state: 'Rajasthan' },
  { prefixes: ['36', '37', '38', '39'], state: 'Gujarat' },
  { prefixes: ['40', '41', '42', '43', '44'], state: 'Maharashtra' },
  { prefixes: ['45', '46', '47', '48'], state: 'Madhya Pradesh' },
  { prefixes: ['49'], state: 'Chhattisgarh' },
  { prefixes: ['50'], state: 'Telangana' },
  { prefixes: ['51', '52', '53'], state: 'Andhra Pradesh' },
  { prefixes: ['56', '57', '58', '59'], state: 'Karnataka' },
  { prefixes: ['60', '61', '62', '63', '64'], state: 'Tamil Nadu' },
  { prefixes: ['67', '68', '69'], state: 'Kerala' },
  { prefixes: ['70', '71', '72', '73', '74'], state: 'West Bengal' },
  { prefixes: ['75', '76', '77'], state: 'Odisha' },
  { prefixes: ['78'], state: 'Assam' },
  { prefixes: ['79'], state: 'North East India' },
  { prefixes: ['80', '81', '82', '83', '84', '85'], state: 'Bihar' },
];

const INDIAN_STATES = [
  'West Bengal',
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'Uttarakhand',
];

function lookupIndianPin(pin: string): PinLookupResult | null {
  if (!/^\d{6}$/.test(pin)) return null;
  if (EXACT_PIN_DIRECTORY[pin]) {
    return EXACT_PIN_DIRECTORY[pin];
  }
  const prefix2 = pin.slice(0, 2);
  const found = STATE_BY_PIN_PREFIX.find((entry) => entry.prefixes.includes(prefix2));
  if (found) {
    return { state: found.state };
  }
  return null;
}

function normalizeAddressType(label?: string): AddressTypeOption {
  const lower = (label ?? '').trim().toLowerCase();
  if (lower === 'work' || lower === 'office') return 'Work';
  if (lower === 'home') return 'Home';
  if (!lower) return 'Home';
  return 'Other';
}

export function MobileSavedAddressesPage() {
  const { data: addresses, isLoading } = useSavedAddresses();
  const { data: settings } = useStoreSettings();
  const { customerAccount } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeZones = useMemo(
    () => (settings?.deliveryZones ?? []).filter((z) => z.isActive),
    [settings]
  );

  const requestedAddMode = searchParams.get('mode') === 'add';
  const [viewMode, setViewMode] = useState<'list' | 'form'>(() =>
    requestedAddMode ? 'form' : 'list'
  );
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);

  // Form fields (9 required/optional inputs + Address Type + 2 checkboxes)
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [stateName, setStateName] = useState('West Bengal');
  const [city, setCity] = useState('Paschim Medinipur');
  const [area, setArea] = useState('Jalchak');
  const [addressType, setAddressType] = useState<AddressTypeOption>('Home');
  const [isDefault, setIsDefault] = useState(true);
  const [saveForFuture, setSaveForFuture] = useState(true);

  const [invalidFields, setInvalidFields] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Auto-open Add New Address when query asks for it or when user has 0 saved addresses
  useEffect(() => {
    if (requestedAddMode) {
      openAddForm();
      return;
    }
    if (!isLoading && addresses.length === 0 && viewMode === 'list') {
      openAddForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, addresses.length, requestedAddMode]);

  // Auto-fill Email from Login Account whenever opening a fresh form
  useEffect(() => {
    if (viewMode === 'form' && !editingAddress && customerAccount?.email && !email) {
      setEmail(customerAccount.email);
    }
  }, [viewMode, editingAddress, customerAccount?.email, email]);

  function openAddForm() {
    setEditingAddress(null);
    setFullName(customerAccount?.fullName ?? '');
    const cleanPhone = (customerAccount?.phone ?? '').replace(/\D/g, '').slice(-10);
    setPhone(cleanPhone);
    setEmail(customerAccount?.email ?? '');
    setAddressLine1('');
    setLandmark('');
    setPincode('');
    setStateName('West Bengal');
    setCity('Paschim Medinipur');
    setArea('Jalchak');
    setAddressType('Home');
    setIsDefault(true);
    setSaveForFuture(true);
    setInvalidFields({});
    setErrorMessage('');
    setViewMode('form');
  }

  function openEditForm(addr: SavedAddress) {
    setEditingAddress(addr);
    setFullName(addr.fullName);
    setPhone(addr.phone.replace(/\D/g, '').slice(-10));
    setEmail(addr.email || customerAccount?.email || '');
    setAddressLine1(addr.addressLine1);
    setLandmark(addr.landmark ?? '');
    setPincode(addr.pincode);
    setStateName(addr.state || 'West Bengal');
    setCity(addr.city || 'Paschim Medinipur');
    setArea(addr.area || 'Jalchak');
    setAddressType(normalizeAddressType(addr.label));
    setIsDefault(addr.isDefault);
    setSaveForFuture(true);
    setInvalidFields({});
    setErrorMessage('');
    setViewMode('form');
  }

  function closeForm() {
    if (searchParams.get('mode') === 'add') {
      const next = new URLSearchParams(searchParams);
      next.delete('mode');
      setSearchParams(next, { replace: true });
    }
    if (addresses.length === 0) {
      navigate(-1);
      return;
    }
    setEditingAddress(null);
    setViewMode('list');
  }

  function clearFieldError(field: string) {
    if (invalidFields[field]) {
      setInvalidFields((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (errorMessage) setErrorMessage('');
  }

  function handlePinChange(rawValue: string) {
    const digits = rawValue.replace(/\D/g, '').slice(0, 6);
    setPincode(digits);
    clearFieldError('pincode');

    if (digits.length === 6) {
      const lookup = lookupIndianPin(digits);
      if (lookup) {
        setStateName(lookup.state);
        clearFieldError('state');
        if (lookup.city) {
          setCity(lookup.city);
          clearFieldError('city');
        }
        if (lookup.area) {
          setArea(lookup.area);
          clearFieldError('area');
        }
      }
    }
  }

  async function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    const nextInvalid: Record<string, boolean> = {};
    let firstError = '';

    const nameRes = validateRequired(fullName, 'Full Name');
    if (!nameRes.valid) {
      nextInvalid.fullName = true;
      if (!firstError) firstError = nameRes.error!;
    }

    const phoneRes = validateIndianPhone(phone);
    if (!phoneRes.valid) {
      nextInvalid.phone = true;
      if (!firstError) firstError = phoneRes.error!;
    }

    if (email.trim()) {
      const emailRes = validateEmail(email);
      if (!emailRes.valid) {
        nextInvalid.email = true;
        if (!firstError) firstError = emailRes.error!;
      }
    }

    const streetRes = validateRequired(addressLine1, 'House / Flat / Street');
    if (!streetRes.valid) {
      nextInvalid.addressLine1 = true;
      if (!firstError) firstError = streetRes.error!;
    }

    const pinRes = validateIndianPincode(pincode);
    if (!pinRes.valid) {
      nextInvalid.pincode = true;
      if (!firstError) firstError = pinRes.error!;
    }

    const stateRes = validateRequired(stateName, 'State');
    if (!stateRes.valid) {
      nextInvalid.state = true;
      if (!firstError) firstError = stateRes.error!;
    }

    const cityRes = validateRequired(city, 'City / District');
    if (!cityRes.valid) {
      nextInvalid.city = true;
      if (!firstError) firstError = cityRes.error!;
    }

    const areaRes = validateRequired(area, 'Area / Locality');
    if (!areaRes.valid) {
      nextInvalid.area = true;
      if (!firstError) firstError = areaRes.error!;
    }

    if (Object.keys(nextInvalid).length > 0) {
      setInvalidFields(nextInvalid);
      setErrorMessage(firstError);
      return;
    }

    setSaving(true);
    try {
      const matchedZone =
        activeZones.find(
          (z) =>
            z.name.toLowerCase() === area.trim().toLowerCase() ||
            z.name.toLowerCase() === city.trim().toLowerCase()
        ) ?? activeZones[0];

      const payload: SavedAddress = {
        id: editingAddress?.id ?? `addr-${Date.now()}`,
        label: addressType,
        fullName: fullName.trim(),
        phone: phone.replace(/\D/g, '').slice(-10),
        email: email.trim() || customerAccount?.email || '',
        addressLine1: addressLine1.trim(),
        landmark: landmark.trim() || undefined,
        area: area.trim(),
        deliveryZoneId: matchedZone?.id ?? 'zone-jalchak',
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
        isDefault,
        createdAt: editingAddress?.createdAt ?? new Date().toISOString(),
      };

      await services.community.saveAddress(payload);

      pushToast({
        title: editingAddress
          ? 'Address updated successfully.'
          : saveForFuture
            ? 'Address saved successfully.'
            : 'Address saved for this order.',
        variant: 'success',
        compact: true,
      });

      if (searchParams.get('mode') === 'add') {
        const next = new URLSearchParams(searchParams);
        next.delete('mode');
        setSearchParams(next, { replace: true });
      }
      setEditingAddress(null);
      setViewMode('list');
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectDefault(addressId: string) {
    await services.community.setDefaultAddress(addressId);
  }

  async function handleDeleteAddress(addressId: string) {
    await services.community.deleteAddress(addressId);
  }

  function formatFullAddress(addr: SavedAddress): string {
    const parts = [
      addr.addressLine1,
      addr.landmark,
      addr.area,
      addr.city,
      addr.state,
    ]
      .map((p) => (p ?? '').trim())
      .filter(Boolean);

    // Deduplicate adjacent identical segments (e.g., Jalchak, Jalchak)
    const uniqueParts = parts.filter(
      (part, index) =>
        index === 0 || part.toLowerCase() !== parts[index - 1].toLowerCase()
    );

    const joined = uniqueParts.join(', ');
    return addr.pincode ? `${joined} - ${addr.pincode}` : joined;
  }

  /* ==========================================================================
   * COMPACT ONE-SCREEN ADD / EDIT NEW ADDRESS VIEW (NO VERTICAL SCROLL)
   * Fits cleanly on 360px–430px mobile viewports right below the 56px header.
   * Allows smooth temporary scroll only if mobile virtual keyboard opens.
   * ======================================================================== */
  if (viewMode === 'form') {
    const inputBase =
      'mt-0.5 h-[31px] w-full rounded-[9px] border bg-white px-2.5 text-[12.5px] font-medium text-[#1E0A3C] placeholder:text-[#9686AC] focus:border-[#6A11CB] focus:outline-none focus:ring-2 focus:ring-[#6A11CB]/12';

    return (
      <div className="fixed inset-x-0 top-[56px] bottom-0 z-[45] flex flex-col overflow-y-auto bg-[#FAF7FF] px-3 pt-1.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] lg:hidden">
        {/* Compact Back Header */}
        <div className="mb-1.5 flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={closeForm}
            aria-label="Back to saved addresses"
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#3B0764] transition-colors active:bg-[#EBD8FF]/70"
          >
            <ArrowLeft className="h-[18px] w-[18px] stroke-[2.3]" />
          </button>
          <h1 className="text-[16px] font-extrabold leading-tight tracking-[-0.01em] text-[#1E0A3C]">
            {editingAddress ? 'Edit Address' : 'Add New Address'}
          </h1>
        </div>

        {/* One-Screen Compact Form */}
        <form
          onSubmit={(e) => void handleSaveAddress(e)}
          noValidate
          className="flex flex-1 flex-col justify-between gap-1.5"
        >
          <div className="space-y-1.5">
            {/* Primary Address Input Card */}
            <div className="rounded-[16px] border border-[#EBD8FF] bg-white px-2.5 py-2 shadow-[0_2px_10px_-6px_rgba(106,17,203,0.12)]">
              <div className="space-y-1.5">
                {/* 1. Full Name * */}
                <div className="flex items-center gap-2">
                  <User
                    aria-hidden="true"
                    className="mt-3.5 h-[16px] w-[16px] shrink-0 text-[#6A11CB] stroke-[2]"
                  />
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor="gk-addr-name"
                      className="block text-[11px] font-bold leading-tight text-[#1E0A3C]"
                    >
                      Full Name <span className="text-[#FF4D8D]">*</span>
                    </label>
                    <input
                      id="gk-addr-name"
                      type="text"
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        clearFieldError('fullName');
                      }}
                      placeholder="Enter full name"
                      className={`${inputBase} ${
                        invalidFields.fullName
                          ? 'border-rose-500 bg-rose-50/40'
                          : 'border-[#DDD0F2]'
                      }`}
                    />
                  </div>
                </div>

                {/* 2. Mobile Number * */}
                <div className="flex items-center gap-2">
                  <Phone
                    aria-hidden="true"
                    className="mt-3.5 h-[16px] w-[16px] shrink-0 text-[#6A11CB] stroke-[2]"
                  />
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor="gk-addr-phone"
                      className="block text-[11px] font-bold leading-tight text-[#1E0A3C]"
                    >
                      Mobile Number <span className="text-[#FF4D8D]">*</span>
                    </label>
                    <div
                      className={`mt-0.5 flex h-[31px] w-full items-center rounded-[9px] border bg-white px-2.5 focus-within:border-[#6A11CB] focus-within:ring-2 focus-within:ring-[#6A11CB]/12 ${
                        invalidFields.phone
                          ? 'border-rose-500 bg-rose-50/40'
                          : 'border-[#DDD0F2]'
                      }`}
                    >
                      <span className="mr-1.5 shrink-0 text-[12px] font-bold text-[#2B0B4E]">
                        +91
                      </span>
                      <input
                        id="gk-addr-phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                          clearFieldError('phone');
                        }}
                        placeholder="Enter mobile number"
                        className="h-full min-w-0 flex-1 bg-transparent text-[12.5px] font-medium text-[#1E0A3C] placeholder:text-[#9686AC] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Email Address */}
                <div className="flex items-center gap-2">
                  <Mail
                    aria-hidden="true"
                    className="mt-3.5 h-[16px] w-[16px] shrink-0 text-[#6A11CB] stroke-[2]"
                  />
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor="gk-addr-email"
                      className="block text-[11px] font-bold leading-tight text-[#1E0A3C]"
                    >
                      Email Address
                    </label>
                    <input
                      id="gk-addr-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearFieldError('email');
                      }}
                      placeholder="Enter email address"
                      className={`${inputBase} ${
                        invalidFields.email
                          ? 'border-rose-500 bg-rose-50/40'
                          : 'border-[#DDD0F2]'
                      }`}
                    />
                  </div>
                </div>

                {/* 4. House / Flat / Building / Street * */}
                <div className="flex items-center gap-2">
                  <Home
                    aria-hidden="true"
                    className="mt-3.5 h-[16px] w-[16px] shrink-0 text-[#6A11CB] stroke-[2]"
                  />
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor="gk-addr-street"
                      className="block text-[11px] font-bold leading-tight text-[#1E0A3C]"
                    >
                      House / Flat / Building / Street{' '}
                      <span className="text-[#FF4D8D]">*</span>
                    </label>
                    <input
                      id="gk-addr-street"
                      type="text"
                      autoComplete="street-address"
                      value={addressLine1}
                      onChange={(e) => {
                        setAddressLine1(e.target.value);
                        clearFieldError('addressLine1');
                      }}
                      placeholder="e.g. Mukharjee Road, House No. 12"
                      className={`${inputBase} ${
                        invalidFields.addressLine1
                          ? 'border-rose-500 bg-rose-50/40'
                          : 'border-[#DDD0F2]'
                      }`}
                    />
                  </div>
                </div>

                {/* 5. Landmark (Optional) */}
                <div className="flex items-center gap-2">
                  <MapPin
                    aria-hidden="true"
                    className="mt-3.5 h-[16px] w-[16px] shrink-0 text-[#6A11CB] stroke-[2]"
                  />
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor="gk-addr-landmark"
                      className="block text-[11px] font-bold leading-tight text-[#1E0A3C]"
                    >
                      Landmark{' '}
                      <span className="font-medium text-[#7D6A96]">(Optional)</span>
                    </label>
                    <input
                      id="gk-addr-landmark"
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Near Jalchak School"
                      className={`${inputBase} border-[#DDD0F2]`}
                    />
                  </div>
                </div>

                {/* 6. PIN Code * & 7. State * (Side-by-Side) */}
                <div className="flex items-center gap-2">
                  <Grip
                    aria-hidden="true"
                    className="mt-3.5 h-[16px] w-[16px] shrink-0 text-[#6A11CB] stroke-[2]"
                  />
                  <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
                    <div className="min-w-0">
                      <label
                        htmlFor="gk-addr-pin"
                        className="block text-[11px] font-bold leading-tight text-[#1E0A3C]"
                      >
                        PIN Code <span className="text-[#FF4D8D]">*</span>
                      </label>
                      <input
                        id="gk-addr-pin"
                        type="text"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => handlePinChange(e.target.value)}
                        placeholder="e.g. 721155"
                        className={`${inputBase} font-mono tabular-nums ${
                          invalidFields.pincode
                            ? 'border-rose-500 bg-rose-50/40'
                            : 'border-[#DDD0F2]'
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <label
                        htmlFor="gk-addr-state"
                        className="block text-[11px] font-bold leading-tight text-[#1E0A3C]"
                      >
                        State <span className="text-[#FF4D8D]">*</span>
                      </label>
                      <div className="relative mt-0.5">
                        <input
                          id="gk-addr-state"
                          type="text"
                          list="gk-indian-states"
                          value={stateName}
                          onChange={(e) => {
                            setStateName(e.target.value);
                            clearFieldError('state');
                          }}
                          placeholder="State"
                          className={`h-[31px] w-full rounded-[9px] border bg-white pl-2.5 pr-6 text-[12.5px] font-medium text-[#1E0A3C] placeholder:text-[#9686AC] focus:border-[#6A11CB] focus:outline-none focus:ring-2 focus:ring-[#6A11CB]/12 ${
                            invalidFields.state
                              ? 'border-rose-500 bg-rose-50/40'
                              : 'border-[#DDD0F2]'
                          }`}
                        />
                        <ChevronDown
                          aria-hidden="true"
                          className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6A11CB]/70"
                        />
                        <datalist id="gk-indian-states">
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 8. City / District * & 9. Area / Locality * (Side-by-Side) */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="min-w-0">
                    <label
                      htmlFor="gk-addr-city"
                      className="block text-[11px] font-bold leading-tight text-[#1E0A3C]"
                    >
                      City / District <span className="text-[#FF4D8D]">*</span>
                    </label>
                    <input
                      id="gk-addr-city"
                      type="text"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        clearFieldError('city');
                      }}
                      placeholder="City / District"
                      className={`${inputBase} ${
                        invalidFields.city
                          ? 'border-rose-500 bg-rose-50/40'
                          : 'border-[#DDD0F2]'
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <label
                      htmlFor="gk-addr-area"
                      className="block text-[11px] font-bold leading-tight text-[#1E0A3C]"
                    >
                      Area / Locality <span className="text-[#FF4D8D]">*</span>
                    </label>
                    <input
                      id="gk-addr-area"
                      type="text"
                      value={area}
                      onChange={(e) => {
                        setArea(e.target.value);
                        clearFieldError('area');
                      }}
                      placeholder="Area / Locality"
                      className={`${inputBase} ${
                        invalidFields.area
                          ? 'border-rose-500 bg-rose-50/40'
                          : 'border-[#DDD0F2]'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Address Type Card */}
            <div className="rounded-[14px] border border-[#EBD8FF] bg-white px-2.5 py-2 shadow-[0_2px_8px_-6px_rgba(106,17,203,0.1)]">
              <div className="flex items-center gap-1.5">
                <Tag
                  aria-hidden="true"
                  className="h-3.5 w-3.5 text-[#6A11CB] stroke-[2.1]"
                />
                <span className="text-[12px] font-extrabold text-[#1E0A3C]">
                  Address Type <span className="text-[#FF4D8D]">*</span>
                </span>
              </div>

              <div
                role="radiogroup"
                aria-label="Address Type"
                className="mt-1.5 grid grid-cols-3 gap-2"
              >
                {(
                  [
                    { key: 'Home', Icon: Home },
                    { key: 'Work', Icon: Briefcase },
                    { key: 'Other', Icon: MoreHorizontal },
                  ] as const
                ).map(({ key, Icon }) => {
                  const selected = addressType === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setAddressType(key)}
                      className={`flex h-[32px] items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] px-2 text-[12px] font-bold transition-all active:scale-[0.97] ${
                        selected
                          ? 'bg-gradient-to-r from-[#6A11CB] to-[#9B35E8] text-white shadow-[0_4px_10px_-3px_rgba(106,17,203,0.45)]'
                          : 'border border-[#EBD8FF] bg-white text-[#2B0B4E]'
                      }`}
                    >
                      <Icon
                        aria-hidden="true"
                        className={`h-3.5 w-3.5 shrink-0 ${
                          selected ? 'text-white' : 'text-[#6A11CB]'
                        }`}
                      />
                      <span>{key}</span>
                      {selected && (
                        <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-white text-[#6A11CB]">
                          <Check className="h-2.5 w-2.5 stroke-[3.2]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Additional Options (2 Compact Checkboxes) */}
            <div className="px-1">
              <label className="flex cursor-pointer items-center gap-2.5 py-1">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="h-[16px] w-[16px] shrink-0 rounded accent-[#6A11CB]"
                />
                <span className="text-[12.5px] font-semibold leading-tight text-[#1E0A3C]">
                  Set as Default Address
                </span>
              </label>

              <div className="h-px w-full bg-[#EFE3FF]" />

              <label className="flex cursor-pointer items-center gap-2.5 py-1">
                <input
                  type="checkbox"
                  checked={saveForFuture}
                  onChange={(e) => setSaveForFuture(e.target.checked)}
                  className="h-[16px] w-[16px] shrink-0 rounded accent-[#6A11CB]"
                />
                <span className="text-[12.5px] font-semibold leading-tight text-[#1E0A3C]">
                  Save this address for future orders
                </span>
              </label>
            </div>

            {errorMessage && (
              <p
                role="alert"
                className="truncate rounded-lg bg-rose-50 px-2.5 py-1 text-[11.5px] font-semibold text-rose-700"
              >
                {errorMessage}
              </p>
            )}
          </div>

          {/* Bottom Full-Width Gradient Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="flex h-[42px] w-full shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6A11CB] via-[#A11FC1] to-[#FF4D8D] text-[14.5px] font-extrabold text-white shadow-[0_6px_18px_rgba(106,17,203,0.3)] transition-transform active:scale-[0.985] disabled:opacity-60"
          >
            <Save aria-hidden="true" className="h-4 w-4 stroke-[2.2]" />
            <span>{saving ? 'Saving...' : 'Save Address'}</span>
          </button>
        </form>
      </div>
    );
  }

  /* ==========================================================================
   * SAVED ADDRESSES LIST VIEW (Reference Design Left Screen)
   * ======================================================================== */
  return (
    <div className="min-h-[calc(100dvh-124px)] bg-[#FAF7FF] px-3.5 pt-2.5 pb-6">
      {/* Compact Top Bar */}
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#3B0764] transition-colors active:bg-[#EBD8FF]/70"
        >
          <ArrowLeft className="h-[19px] w-[19px] stroke-[2.3]" />
        </button>
        <h1 className="text-[17px] font-extrabold tracking-[-0.01em] text-[#1E0A3C]">
          Saved Addresses
        </h1>
      </div>

      {/* Saved Address Cards */}
      <div className="space-y-3">
        {addresses.map((addr) => {
          const isSelected = addr.isDefault;
          return (
            <div
              key={addr.id}
              onClick={() => void handleSelectDefault(addr.id)}
              className={`cursor-pointer rounded-[18px] border transition-colors ${
                isSelected
                  ? 'border-[#8A2BE2] bg-gradient-to-br from-[#FBF7FF] to-[#F6ECFF] shadow-[0_4px_16px_-8px_rgba(106,17,203,0.22)]'
                  : 'border-[#EBD8FF] bg-white shadow-[0_2px_10px_-6px_rgba(43,11,78,0.08)]'
              }`}
            >
              <div className="p-3.5 pb-3">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <MapPin
                      aria-hidden="true"
                      className="mt-0.5 h-[20px] w-[20px] shrink-0 text-[#6A11CB] stroke-[2]"
                    />
                    <div className="min-w-0">
                      {isSelected && (
                        <span className="mb-1 inline-flex rounded-full bg-[#6A11CB] px-2.5 py-0.5 text-[10px] font-bold leading-tight text-white">
                          Default
                        </span>
                      )}
                      <p className="truncate text-[14.5px] font-extrabold leading-snug text-[#1E0A3C]">
                        {addr.fullName}{' '}
                        {!isSelected && addr.label && (
                          <span className="font-semibold text-[#5E497A]">
                            ({addr.label})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Radio Indicator */}
                  <span
                    aria-label={isSelected ? 'Default address' : 'Set as default'}
                    className={`mt-0.5 flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border-2 ${
                      isSelected
                        ? 'border-[#6A11CB] bg-white'
                        : 'border-[#B8A5D1] bg-white'
                    }`}
                  >
                    {isSelected && (
                      <span className="h-[10px] w-[10px] rounded-full bg-[#6A11CB]" />
                    )}
                  </span>
                </div>

                {/* Address Contact & Full Street Lines */}
                <div className="mt-2 space-y-1 pl-0.5 text-[12.5px] text-[#352052]">
                  <div className="flex items-center gap-2">
                    <Phone
                      aria-hidden="true"
                      className="h-3.5 w-3.5 shrink-0 text-[#6A11CB]"
                    />
                    <span className="font-medium tabular-nums">{addr.phone}</span>
                  </div>

                  {addr.email && (
                    <div className="flex items-center gap-2">
                      <Mail
                        aria-hidden="true"
                        className="h-3.5 w-3.5 shrink-0 text-[#6A11CB]"
                      />
                      <span className="truncate font-medium">{addr.email}</span>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <Home
                      aria-hidden="true"
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6A11CB]"
                    />
                    <p className="leading-snug text-[#352052]">
                      {formatFullAddress(addr)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Edit & Remove Divider Row */}
              <div className="grid grid-cols-2 border-t border-[#EBD8FF]/80">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditForm(addr);
                  }}
                  className="flex h-[38px] items-center justify-center gap-1.5 border-r border-[#EBD8FF]/80 text-[12.5px] font-bold text-[#4B148C] transition-colors active:bg-[#F3E7FF]"
                >
                  <SquarePen aria-hidden="true" className="h-3.5 w-3.5 text-[#6A11CB]" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDeleteAddress(addr.id);
                  }}
                  className="flex h-[38px] items-center justify-center gap-1.5 text-[12.5px] font-bold text-[#4B148C] transition-colors active:bg-rose-50 active:text-rose-600"
                >
                  <Trash2 aria-hidden="true" className="h-3.5 w-3.5 text-[#6A11CB]" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Add New Address Trigger Button */}
      <button
        type="button"
        onClick={openAddForm}
        className="mt-4 flex h-[48px] w-full items-center justify-center gap-2.5 rounded-[16px] border-[1.5px] border-[#8A2BE2] bg-white text-[14.5px] font-extrabold text-[#4B148C] shadow-[0_4px_14px_-6px_rgba(106,17,203,0.18)] transition-transform active:scale-[0.985]"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6A11CB] text-white">
          <Plus aria-hidden="true" className="h-4 w-4 stroke-[2.6]" />
        </span>
        <span>Add New Address</span>
      </button>
    </div>
  );
}
