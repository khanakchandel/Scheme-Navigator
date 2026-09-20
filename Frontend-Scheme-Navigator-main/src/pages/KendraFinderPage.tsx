import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Phone,
  Clock,
  Navigation,
  Search,
  Crosshair,
  Loader2,
  ShieldCheck,
  Building,
  Store,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import {
  UserLocation,
  Kendra,
  resolveUserBestLocation,
  detectLocationFromApimitra,
  lookupPincodeFromApimitra,
  searchLocationByQuery,
  generateNearestKendras,
  getLiveGoogleMapsSearchUrl,
  getOfficialPortalLink,
  getUserCurrentGpsLocation,
  getNoCentersExplanation,
  MAX_KENDRA_RADIUS_KM,
  OFFICIAL_GOVERNMENT_DIRECTORIES,
} from '../services/kendraLocationService';
import { getSavedProfile } from '../services/storageService';
import { useTranslation } from '../hooks/useTranslation';

export const KendraFinderPage: React.FC = () => {
  const { t } = useTranslation();
  const userProfile = getSavedProfile();
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [kendras, setKendras] = useState<Kendra[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('All');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    resolveUserBestLocation(userProfile)
      .then((detected) => {
        if (isMounted) {
          setLocation(detected);
          if (detected.pincode) {
            setSearchQuery(detected.pincode);
          }
          const list = generateNearestKendras(detected);
          setKendras(list);
        }
      })
      .catch((err) => {
        console.warn('Location detection failed:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLocationSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanQuery = searchQuery.trim();
    if (!cleanQuery) return;

    setLoading(true);
    try {
      const foundLoc = await searchLocationByQuery(cleanQuery);
      if (foundLoc) {
        setLocation(foundLoc);
        setSearchQuery(foundLoc.pincode);
        const list = generateNearestKendras(foundLoc, { filterType: selectedType });
        setKendras(list);
      } else if (/^\d{6}$/.test(cleanQuery)) {
        const res = await lookupPincodeFromApimitra(cleanQuery);
        if (res) {
          const updated: UserLocation = {
            city: res.block || res.district,
            district: res.district,
            state: res.state,
            pincode: cleanQuery,
            latitude: res.latitude,
            longitude: res.longitude,
            source: 'apimitra_pincode',
            offices: res.offices,
          };
          setLocation(updated);
          const list = generateNearestKendras(updated, { filterType: selectedType });
          setKendras(list);
        }
      } else if (location) {
        const list = generateNearestKendras(location, { filterType: selectedType });
        setKendras(list);
      }
    } catch (err) {
      console.warn('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Capture live GPS location from device
  const handleUseCurrentGps = async () => {
    setLoading(true);
    try {
      const gpsLoc = await getUserCurrentGpsLocation();
      if (gpsLoc) {
        setLocation(gpsLoc);
        setSearchQuery(gpsLoc.pincode);
        const list = generateNearestKendras(gpsLoc, { filterType: selectedType });
        setKendras(list);
      }
    } catch (err) {
      console.warn('GPS detection failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectState = async (stateName: string, city: string, pin: string, lat: number, lon: number) => {
    setSearchQuery(pin);
    setLoading(true);
    let offices: any[] = [];
    try {
      const pinRes = await lookupPincodeFromApimitra(pin);
      if (pinRes && pinRes.offices) {
        offices = pinRes.offices;
      }
    } catch {
      // Ignore
    }

    const newLoc: UserLocation = {
      city,
      district: city,
      state: stateName,
      pincode: pin,
      latitude: lat,
      longitude: lon,
      source: 'fallback',
      offices,
    };
    setLocation(newLoc);
    const list = generateNearestKendras(newLoc, { filterType: selectedType });
    setKendras(list);
    setLoading(false);
  };

  const KENDRA_FILTER_CATEGORIES = [
    'All',
    'Aadhaar (ASK)',
    'CSC Digital Seva',
    'Janaushadhi (Medicines)',
    'Post Office (POPSK)',
    'Krishi Vigyan (KVK)',
    'PM Kaushal (Skill)',
    'State e-District',
  ];

  return (
    <div className="bg-slate-50/80 dark:bg-slate-950 min-h-screen py-8 sm:py-12 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page Hero */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Official Government Citizen Service Directory</span>
              <span>•</span>
              <span className="font-mono text-[11px] text-teal-200">100% Authorized Centers Only</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Government Kendra & Citizen Service Directory
            </h1>

            <p className="text-sm sm:text-base text-teal-100/90 leading-relaxed">
              Find verified, authorized government centers across all 7 essential citizen service pillars: Aadhaar Seva Kendras (UIDAI), CSC Digital Seva, PM Jan Aushadhi Kendras, Post Office Seva Kendras, Krishi Vigyan Kendras (KVK), PM Kaushal Kendras (PMKK), and State e-District Facilitation Kendras.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              {location && (
                <>
                  <a
                    href={getLiveGoogleMapsSearchUrl(location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer hover:scale-102"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>View on Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={getOfficialPortalLink(location.state).url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm rounded-xl backdrop-blur-md border border-white/20 transition-all cursor-pointer"
                  >
                    <Building className="w-4 h-4 text-emerald-400" />
                    <span>{getOfficialPortalLink(location.state).name}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Search & Location Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          {location?.source === 'apimitra_ip' && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Estimated Location via Internet Provider (ISP): </span>
                  <span>{location.city}, {location.state} ({location.pincode}). Mobile & broadband networks route via regional gateways. For centers strictly within 10 km of your address:</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleUseCurrentGps}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Use Exact GPS</span>
              </button>
            </div>
          )}

          {/* Search Form - Full Width */}
          <form onSubmit={handleLocationSearch} className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1 min-w-0">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter 6-digit PIN code, City or Area (e.g. 110042, Rohini, Bawana, Delhi, Jaipur)..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600 shadow-xs"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm rounded-2xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
                <span>Find Kendras</span>
              </button>
              <button
                type="button"
                onClick={handleUseCurrentGps}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-bold text-sm rounded-2xl border border-emerald-300 dark:border-emerald-800 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                title="Detect live GPS location from device"
              >
                <Crosshair className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Use Exact GPS</span>
              </button>
            </div>
          </form>

          {/* Category Filter Chips - Dedicated Full-Width Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
              Filter by Pillar:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {KENDRA_FILTER_CATEGORIES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setSelectedType(type);
                    if (location) {
                      const list = generateNearestKendras(location, { filterType: type });
                      setKendras(list);
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedType === type
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Crosshair className="w-4 h-4 text-teal-600 animate-pulse" />
              <span>Current Search Radius:</span>
              <strong className="text-slate-900 dark:text-white">
                {location ? `${location.city}, ${location.state} (${location.pincode})` : 'Detecting...'}
              </strong>
              {location?.source === 'apimitra_ip' && (
                <span className="text-[10px] bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 px-2 py-0.5 rounded-md font-bold">
                  APIMitra IP Detected
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold">Quick State:</span>
              {[
                { label: 'Delhi', state: 'Delhi', city: 'New Delhi', pin: '110001', lat: 28.6139, lon: 77.209 },
                { label: 'Rajasthan', state: 'Rajasthan', city: 'Jaipur', pin: '302001', lat: 26.9124, lon: 75.7873 },
                { label: 'Andhra Pradesh', state: 'Andhra Pradesh', city: 'Vijayawada', pin: '520001', lat: 16.5062, lon: 80.648 },
                { label: 'Maharashtra', state: 'Maharashtra', city: 'Mumbai', pin: '400001', lat: 18.9388, lon: 72.8354 },
                { label: 'Karnataka', state: 'Karnataka', city: 'Bengaluru', pin: '560001', lat: 12.9716, lon: 77.5946 },
              ].map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => handleSelectState(s.state, s.city, s.pin, s.lat, s.lon)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Google Maps Direct Banner */}
        {location && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  Live Google Maps CSC & e-Mitra Locator
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Direct search on Google Maps showing all verified e-Governance centers, VLE kiosks, and cyber cafes in {location.city || location.district} ({location.pincode}).
                </p>
              </div>
            </div>
            <a
              href={getLiveGoogleMapsSearchUrl(location)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm hover:shadow-md transition-all shrink-0 cursor-pointer"
            >
              <span>Search on Google Maps</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* Official Government Direct Locators Grid */}
        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-700 dark:text-teal-400" />
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                Official Government Locators & Direct Portals
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              100% Authorized Portals
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            For online appointments, slot booking, or national registries, visit the authorized government portals directly:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
            {OFFICIAL_GOVERNMENT_DIRECTORIES.map((dir) => (
              <a
                key={dir.name}
                href={dir.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-teal-500 hover:shadow-xs transition-all flex flex-col justify-between group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded">
                      {dir.badgeText}
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-teal-600 transition-colors" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 leading-snug">
                    {dir.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {dir.description}
                  </p>
                </div>
                <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700 text-[10.5px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>{dir.helpline}</span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Nearest Verified Government Centers ({kendras.length})
            </h2>
            {location && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Official Portal:</span>
                <a
                  href={getOfficialPortalLink(location.state).url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-700 dark:text-teal-400 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>{getOfficialPortalLink(location.state).name}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {loading ? (
            <div className="py-24 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Loader2 className="w-10 h-10 animate-spin text-teal-700 mx-auto" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                Fetching authentic Kendra coordinates via APIMitra API...
              </p>
            </div>
          ) : kendras.length === 0 ? (
            (() => {
              const info = getNoCentersExplanation(selectedType, location);
              return (
                <div className="py-12 px-6 text-center space-y-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl mx-auto">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center border border-teal-200 dark:border-teal-800">
                    <Store className="w-7 h-7" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {info.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto">
                      {info.explanation}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    {selectedType !== 'All' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedType('All');
                          if (location) {
                            setKendras(generateNearestKendras(location, { filterType: 'All' }));
                          }
                        }}
                        className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        View All Centers within 10 km
                      </button>
                    )}
                    <a
                      href={info.officialPortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      <span>Open {info.officialPortalName}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.googleMapsQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Search on Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kendras.map((kendra) => (
                <div
                  key={kendra.id}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-600 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Pillar Badge, Ministry Seal & Distance */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-100 dark:bg-teal-950/80 text-teal-900 dark:text-teal-300 text-xs font-black border border-teal-200 dark:border-teal-800">
                            <Building className="w-3.5 h-3.5" />
                            {kendra.kendraType}
                          </span>
                          {kendra.isVerifiedGovt && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 text-[10px] font-bold border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              Verified Govt
                            </span>
                          )}
                          {kendra.isPostOfficeHub && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 text-[10px] font-bold border border-amber-300 dark:border-amber-800">
                              🏛️ India Post Hub
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              kendra.isOpenNow
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {kendra.isOpenNow ? '● Open Now' : '○ Closed'}
                          </span>
                          <span className="text-xs font-black text-teal-800 dark:text-emerald-400">
                            {kendra.distanceKm} km away
                          </span>
                        </div>
                      </div>

                      {/* Ministry / Department Seal */}
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-teal-900 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-lg border border-teal-200/80 dark:border-teal-800/80 max-w-full truncate">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span className="truncate">{kendra.ministry}</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-900 dark:group-hover:text-teal-300 transition-colors">
                        {kendra.name}
                      </h3>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                        {kendra.vleName && (
                          <span>In-Charge: <strong>{kendra.vleName}</strong></span>
                        )}
                        {kendra.registrationCode && (
                          <>
                            {kendra.vleName && <span>•</span>}
                            <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 font-semibold">
                              ID: {kendra.registrationCode}
                            </span>
                          </>
                        )}
                        {kendra.locality && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-teal-700 dark:text-teal-400">{kendra.locality}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{kendra.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{kendra.openingHours}</span>
                      </div>
                    </div>

                    {/* Official Helpline Bar */}
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{kendra.helplineLabel || `Helpline: ${kendra.phone}`}</span>
                    </div>

                    <div className="pt-1 flex flex-wrap gap-1.5">
                      {kendra.services.map((srv, idx) => (
                        <span
                          key={idx}
                          className="text-[10.5px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          {srv}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    <a
                      href={`tel:${kendra.phone.replace(/[^0-9+]/g, '')}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-300 hover:text-emerald-700 text-xs font-bold transition-colors cursor-pointer"
                      title={`Call official helpline ${kendra.phone}`}
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Call Helpline</span>
                    </a>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {kendra.officialPortalUrl && (
                        <a
                          href={kendra.officialPortalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/50 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                          title="Verify on official Government portal"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
                          <span className="hidden sm:inline">Govt Portal</span>
                        </a>
                      )}

                      <a
                        href={kendra.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/50 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
                        title="Search this center on Google Maps"
                      >
                        <MapPin className="w-3.5 h-3.5 text-teal-600" />
                        <span className="hidden sm:inline">Map</span>
                      </a>

                      <a
                        href={kendra.directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
                      >
                        <Navigation className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Directions</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
