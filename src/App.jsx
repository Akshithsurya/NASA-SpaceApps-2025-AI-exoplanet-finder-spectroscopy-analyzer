import React, { useState, useEffect, useMemo } from 'react';
import { ExoplanetClassifier } from './ai-services/ExoplanetClassifier';
import { PredictiveAnalytics } from './ai-services/PredictiveAnalytics';
import { Search, Star, Globe, Zap, Filter, Info, BarChart3, Telescope, Satellite, Brain, Eye, Radio, Cpu, TrendingUp, Menu, X, Settings, Database, Activity, AlertTriangle, CheckCircle, Clock, Target, Layers, Map, Gauge, Wifi, WifiOff, Sparkles, Atom, Microscope, Camera, Signal } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as RechartsRadar, BarChart, Bar } from 'recharts';

const ExoplanetFinder = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('discovery_year');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTelescope, setSelectedTelescope] = useState('hubble');
  const [activeTab, setActiveTab] = useState('catalog');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [realTimeData, setRealTimeData] = useState([]);
  const [networkStatus, setNetworkStatus] = useState('online');
  const [aiProcessing, setAiProcessing] = useState(false);
  const itemsPerPage = 15;

  // AI service states (added)
  const [aiClassifier, setAiClassifier] = useState(null);
  const [predictiveAnalytics] = useState(new PredictiveAnalytics());
  const [aiPredictions, setAiPredictions] = useState({});
  const [spectralAnalysis, setSpectralAnalysis] = useState({});

  // Spectroscopy pie data fetched from NASA Exoplanet Archive Firefly (stable data)
  const [spectroscopyPieData, setSpectroscopyPieData] = useState(null);
  const [spectroscopyLoading, setSpectroscopyLoading] = useState(false);
  const [spectroscopyError, setSpectroscopyError] = useState(null);

  // Space Telescopes and Observatories Database
  const telescopes = {
    hubble: {
      name: 'Hubble Space Telescope',
      type: 'Optical/UV',
      launched: 1990,
      status: 'Active',
      altitude: '547 km',
      resolution: '0.1 arcseconds',
      discoveries: 4200,
      specialty: 'High-resolution imaging, atmospheric analysis',
      wavelengths: '115-2500 nm',
      efficiency: 94.2,
      lastMaintenance: '2024-08-15'
    },
    kepler: {
      name: 'Kepler Space Telescope',
      type: 'Photometric',
      launched: 2009,
      status: 'Retired (2018)',
      altitude: 'Heliocentric orbit',
      resolution: '3.98 arcseconds',
      discoveries: 2662,
      specialty: 'Transit photometry, exoplanet detection',
      wavelengths: '420-900 nm',
      efficiency: 0,
      lastMaintenance: '2018-10-30'
    },
    jwst: {
      name: 'James Webb Space Telescope',
      type: 'Infrared',
      launched: 2021,
      status: 'Active',
      altitude: 'L2 Lagrange Point',
      resolution: '0.1 arcseconds',
      discoveries: 847,
      specialty: 'Atmospheric composition, early universe',
      wavelengths: '600 nm - 28.3 μm',
      efficiency: 98.7,
      lastMaintenance: '2024-12-01'
    },
    tess: {
      name: 'TESS (Transiting Exoplanet Survey Satellite)',
      type: 'Photometric Survey',
      launched: 2018,
      status: 'Active',
      altitude: 'Highly elliptical orbit',
      resolution: '21 arcseconds',
      discoveries: 3200,
      specialty: 'All-sky exoplanet survey',
      wavelengths: '600-1000 nm',
      efficiency: 91.8,
      lastMaintenance: '2024-09-22'
    },
    spitzer: {
      name: 'Spitzer Space Telescope',
      type: 'Infrared',
      launched: 2003,
      status: 'Retired (2020)',
      altitude: 'Heliocentric orbit',
      resolution: '1.5 arcseconds',
      discoveries: 1200,
      specialty: 'Thermal emission, dust analysis',
      wavelengths: '3.6-160 μm',
      efficiency: 0,
      lastMaintenance: '2020-01-30'
    },
    chandra: {
      name: 'Chandra X-ray Observatory',
      type: 'X-ray',
      launched: 1999,
      status: 'Active',
      altitude: 'Highly elliptical orbit',
      resolution: '0.5 arcseconds',
      discoveries: 300,
      specialty: 'High-energy phenomena, stellar activity',
      wavelengths: '0.1-10 keV',
      efficiency: 89.3,
      lastMaintenance: '2024-07-10'
    }
  };

  // Ground-based observatories
  const observatories = [
    { name: 'Keck Observatory', location: 'Hawaii', type: 'Optical/IR', discoveries: 450, status: 'Active', efficiency: 92.1 },
    { name: 'VLT (Very Large Telescope)', location: 'Chile', type: 'Optical/IR', discoveries: 380, status: 'Active', efficiency: 88.9 },
    { name: 'ALMA', location: 'Chile', type: 'Radio', discoveries: 125, status: 'Active', efficiency: 95.3 },
    { name: 'Palomar Observatory', location: 'California', type: 'Optical', discoveries: 290, status: 'Active', efficiency: 84.2 },
    { name: 'Subaru Telescope', location: 'Hawaii', type: 'Optical/IR', discoveries: 210, status: 'Active', efficiency: 90.7 },
    { name: 'Gemini Observatory', location: 'Hawaii/Chile', type: 'Optical/IR', discoveries: 340, status: 'Active', efficiency: 93.4 }
  ];

  // Seeded random for stability (used heavily in data generation)
  const seededRandom = (seed) => {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  };

  // Small seeded-from-string PRNG for deterministic UI fallbacks (stable per planet)
  const seededRandomFromString = (str) => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    }
    let seed = h >>> 0;
    return () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return (seed & 0xfffffff) / 0xfffffff;
    };
  };

  // Enhanced exoplanet data
  const exoplanetData = useMemo(() => {
    const planets = [];
    const random = seededRandom(42); // Fixed seed for stability
    const realExoplanetNames = [
      'Kepler-442b', 'HD 40307g', 'Gliese 667Cc', 'Kepler-438b', 'Kepler-296e', 'Wolf 1061c', 'Kepler-62f', 'Kepler-283c', 'Kepler-296f', 'Kepler-440b', 
      'TRAPPIST-1e', 'TRAPPIST-1f', 'TRAPPIST-1g', 'Proxima Centauri b', 'LHS 1140b', 'TOI-715b', 'K2-18b', 'WASP-121b', 'HD 209458b', 'CoRoT-1b',
      'HD 85512b', 'Gliese 163c', 'Tau Ceti e', 'Tau Ceti f', 'Kepler-186f', 'Kepler-452b', 'TRAPPIST-1d', 'TOI-849b', 'WASP-96b', 'HAT-P-11b',
      'Kepler-22b', 'Kepler-69c', 'Kepler-1649c', 'TOI-2109b', 'WASP-189b', 'KELT-9b', 'HD 189733b', 'WASP-43b', 'GJ 1214b', 'Kepler-16b',
      'PSR B1257+12 b', 'PSR B1257+12 c', '51 Eridani b', 'HR 8799e', 'Beta Pictoris b', 'Fomalhaut b', '2M1207b', 'GQ Lupi b', 'AB Pictoris b', 'HD 106906b',
      'WASP-17b', 'WASP-12b', 'TrES-4b', 'WASP-79b', 'HAT-P-32b', 'Kepler-7b', 'CoRoT-3b', 'XO-3b', 'WASP-18b', 'HAT-P-2b'
    ];
    
    const methods = ['Transit Photometry', 'Radial Velocity', 'Direct Imaging', 'Gravitational Microlensing', 'Astrometry', 'Transit Timing Variations', 'Pulsar Timing'];
    const types = ['Super Earth', 'Mini-Neptune', 'Gas Giant', 'Terrestrial', 'Hot Jupiter', 'Ice Giant', 'Sub-Earth', 'Puffy Planet', 'Ocean World', 'Desert World'];
    const stellarTypes = ['M-dwarf', 'K-dwarf', 'G-dwarf', 'F-dwarf', 'A-type', 'Binary System', 'Red Giant', 'White Dwarf'];
    const atmosphericComposition = ['H2/He', 'H2O-rich', 'CO2-dominated', 'CH4-rich', 'N2/O2', 'SO2-rich', 'NH3-rich', 'Noble gases', 'Silicate clouds', 'Unknown'];
    const climateZones = ['Hot', 'Temperate', 'Cold', 'Tidally Locked Hot', 'Tidally Locked Cold', 'Variable', 'Extreme Greenhouse', 'Snowball'];
    
    const telescopeKeys = Object.keys(telescopes);
    
    // Generate more diverse and realistic exoplanet data
    for (let i = 0; i < 12000; i++) {
      const planetName = i < realExoplanetNames.length 
        ? realExoplanetNames[i] 
        : `${realExoplanetNames[i % realExoplanetNames.length]} ${Math.floor(i / realExoplanetNames.length) + 1}`;
      
      const discoveryTelescope = telescopeKeys[Math.floor(random() * telescopeKeys.length)];
      const stellarType = stellarTypes[Math.floor(random() * stellarTypes.length)];
      const planetType = types[Math.floor(random() * types.length)];
      const discoveryMethod = methods[Math.floor(random() * methods.length)];
      
      // More realistic parameter distributions based on actual exoplanet statistics
      let mass, radius, temperature, orbitalPeriod, distance, habitabilityScore;
      
      // Mass distribution (Earth masses) - log-normal distribution
      const massBase = random();
      if (massBase < 0.3) mass = (random() * 2 + 0.1).toFixed(3); // Sub-Earth to Super-Earth
      else if (massBase < 0.6) mass = (random() * 15 + 2).toFixed(2); // Mini-Neptune range
      else mass = (random() * 300 + 15).toFixed(1); // Gas giant range
      
      // Radius distribution (Earth radii)
      if (parseFloat(mass) < 2) radius = (random() * 1.5 + 0.3).toFixed(3);
      else if (parseFloat(mass) < 17) radius = (random() * 3 + 1.5).toFixed(3);
      else radius = (random() * 12 + 3).toFixed(2);
      
      // Orbital period (days) - heavily skewed toward shorter periods due to detection bias
      const periodRand = random();
      if (periodRand < 0.4) orbitalPeriod = (random() * 10 + 0.5).toFixed(3); // Hot planets
      else if (periodRand < 0.7) orbitalPeriod = (random() * 365 + 10).toFixed(2); // Habitable zone
      else orbitalPeriod = (random() * 4000 + 365).toFixed(1); // Long period
      
      // Distance distribution (light years) - weighted toward nearby systems
      const distanceRand = random();
      if (distanceRand < 0.2) distance = (random() * 25 + 4).toFixed(1); // Very nearby
      else if (distanceRand < 0.5) distance = (random() * 100 + 25).toFixed(1); // Nearby
      else if (distanceRand < 0.8) distance = (random() * 500 + 100).toFixed(0); // Intermediate
      else distance = (random() * 3000 + 500).toFixed(0); // Distant
      
      // Temperature calculation based on orbital period and stellar type
      let stellarTemp = stellarType === 'M-dwarf' ? 3500 : stellarType === 'K-dwarf' ? 4500 : stellarType === 'G-dwarf' ? 5500 : 6500;
      temperature = Math.floor(stellarTemp * Math.pow(parseFloat(orbitalPeriod) / 365, -0.5) * (random() * 0.4 + 0.8));
      
      // Habitability score based on multiple factors
      let tempScore = temperature > 273 && temperature < 373 ? 1.0 : Math.exp(-Math.abs(temperature - 310) / 100);
      let massScore = parseFloat(mass) > 0.5 && parseFloat(mass) < 5 ? 1.0 : Math.exp(-Math.abs(parseFloat(mass) - 1) / 2);
      let distanceScore = Math.exp(-parseFloat(distance) / 200);
      habitabilityScore = (tempScore * massScore * distanceScore * (random() * 0.4 + 0.8)).toFixed(3);
      
      // More sophisticated atmosphere assignment
      let atmosphere;
      if (temperature > 1500) atmosphere = random() > 0.5 ? 'Silicate clouds' : 'H2/He';
      else if (temperature > 800) atmosphere = ['H2/He', 'SO2-rich', 'Noble gases'][Math.floor(random() * 3)];
      else if (temperature > 400) atmosphere = ['CO2-dominated', 'H2O-rich', 'CH4-rich'][Math.floor(random() * 3)];
      else if (temperature > 200) atmosphere = ['N2/O2', 'CO2-dominated', 'CH4-rich', 'NH3-rich'][Math.floor(random() * 4)];
      else atmosphere = random() > 0.3 ? 'Unknown' : ['CH4-rich', 'NH3-rich'][Math.floor(random() * 2)];
      
      const climateZone = climateZones[Math.floor(random() * climateZones.length)];
      
      // Generate atmosphere composition percentages
      let atmosphereComposition = {};
      if (atmosphere !== 'Unknown') {
        const components = atmosphere.split('/').map(c => c.trim());
        const numComps = components.length;
        const percentages = [];
        let remaining = 100;
        for (let j = 0; j < numComps - 1; j++) {
          const pct = Math.floor(random() * (remaining - (20 * (numComps - j - 1))) + 20);
          percentages.push(pct);
          remaining -= pct;
        }
        percentages.push(remaining);
        components.forEach((comp, idx) => {
          atmosphereComposition[comp] = percentages[idx];
        });
      }

      planets.push({
        id: i + 1,
        name: planetName,
        host_star: planetName.split('-')[0] || planetName.split(' ')[0],
        stellar_type: stellarType,
        discovery_year: 1995 + Math.floor(random() * 29),
        discovery_method: discoveryMethod,
        planet_type: planetType,
        mass: mass,
        radius: radius,
        orbital_period: orbitalPeriod,
        distance: distance,
        temperature: temperature,
        climate_zone: climateZone,
        habitability_score: habitabilityScore,
        atmosphere: atmosphere,
        atmosphereComposition: atmosphereComposition,
        atmospheric_pressure: atmosphere !== 'Unknown' ? (random() * 100 + 0.1).toFixed(2) + ' bar' : 'Unknown',
        magnetic_field: random() > 0.6 ? (random() * 10).toFixed(2) + ' G' : 'Not detected',
        discovery_telescope: discoveryTelescope,
        ai_confidence: (random() * 0.3 + 0.7).toFixed(3),
        follow_up_observations: Math.floor(random() * 25) + 1,
        transit_depth: discoveryMethod === 'Transit Photometry' ? (random() * 0.05).toFixed(5) : 'N/A',
        stellar_magnitude: (random() * 12 + 6).toFixed(2),
        priority_score: parseFloat(habitabilityScore) * parseFloat((random() * 0.3 + 0.7).toFixed(2)),
        orbital_eccentricity: random().toFixed(3),
        equilibrium_temperature: temperature,
        insolation: (random() * 5 + 0.1).toFixed(2) + ' S⊕',
        tidal_locking: parseFloat(orbitalPeriod) < 50 ? random() > 0.3 : random() > 0.8,
        water_presence: parseFloat(habitabilityScore) > 0.5 && atmosphere.includes('H2O') ? 'Likely' : 'Unknown',
        biosignature_potential: parseFloat(habitabilityScore) > 0.7 && atmosphere === 'N2/O2' ? 'High' : parseFloat(habitabilityScore) > 0.5 ? 'Medium' : 'Low',
        last_observation: new Date(Date.now() - random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        confirmed_status: random() > 0.15 ? 'Confirmed' : 'Candidate',
        research_priority: parseFloat(habitabilityScore) > 0.8 ? 'Critical' : parseFloat(habitabilityScore) > 0.6 ? 'High' : parseFloat(habitabilityScore) > 0.4 ? 'Medium' : 'Low'
      });
    }
    return planets;
  }, []);

  // Real-time data simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const newDataPoint = {
        time: new Date().toLocaleTimeString(),
        observations: Math.floor(Math.random() * 100) + 50,
        discoveries: Math.floor(Math.random() * 5),
        telescope: Object.keys(telescopes)[Math.floor(Math.random() * Object.keys(telescopes).length)],
        efficiency: Math.random() * 10 + 85,
        dataVolume: Math.floor(Math.random() * 1000) + 500
      };
      setRealTimeData(prev => [...prev.slice(-19), newDataPoint]);
    }, 3000);

    // Simulate network status changes
    const networkInterval = setInterval(() => {
      const statuses = ['online', 'maintenance', 'partial'];
      setNetworkStatus(statuses[Math.floor(Math.random() * statuses.length)]);
    }, 30000);

    // Simulate AI processing
    const aiInterval = setInterval(() => {
      setAiProcessing(Math.random() > 0.7);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(networkInterval);
      clearInterval(aiInterval);
    };
  }, []);

  // Initialize AI services
  useEffect(() => {
    const initAI = async () => {
      setAiProcessing(true);
      try {
        const classifier = new ExoplanetClassifier();
        const success = await classifier.loadModel();
        if (success) {
          setAiClassifier(classifier);
        }
      } catch (err) {
        console.error('AI init error:', err);
      } finally {
        setAiProcessing(false);
      }
    };
    
    initAI();
  }, []);

  // Generate AI predictions when data changes
  useEffect(() => {
    if (exoplanetData.length > 0 && predictiveAnalytics) {
      try {
        const analysis = predictiveAnalytics.analyzeDiscoveryPatterns(exoplanetData);
        setAiPredictions(analysis);
      } catch (err) {
        console.error('Predictive analytics error:', err);
      }
    }
  }, [exoplanetData, predictiveAnalytics]);

  // Analyze selected planet's spectrum
  useEffect(() => {
    if (selectedPlanet) {
      try {
        const spectralData = ExoplanetSpectroscopy.generateRealSpectroscopicData(selectedPlanet);
        const analysis = ExoplanetSpectroscopy.performSpectralAnalysis(spectralData, selectedPlanet);
        setSpectralAnalysis(analysis);
      } catch (err) {
        console.error('Spectroscopy AI error:', err);
      }
    } else {
      setSpectralAnalysis({});
    }
  }, [selectedPlanet]);

  // Fetch stable spectroscopy summary data from NASA Exoplanet Archive Firefly endpoint
  useEffect(() => {
    let mounted = true;
    const FIRE_FLY_URL = 'https://exoplanetarchive.ipac.caltech.edu/cgi-bin/atmospheres/nph-firefly?atmospheres&format=json';
    const knownMolecules = ['H2O', 'CO2', 'CH4', 'O2', 'NH3', 'CO', 'H2', 'He', 'N2'];

    const parseRecordsForMolecules = (records) => {
      // records expected to be array of objects; we scan string values for molecule names
      const counts = {};
      knownMolecules.forEach(m => counts[m] = 0);
      records.forEach(rec => {
        Object.values(rec).forEach(val => {
          if (!val) return;
          const s = String(val).toUpperCase();
          knownMolecules.forEach(mol => {
            // match whole word or simple substring (robust against formats)
            if (s.includes(mol)) counts[mol] += 1;
          });
        });
      });
      // Build pie array (only keep molecules with counts > 0)
      const pie = Object.entries(counts)
        .filter(([, c]) => c > 0)
        .map(([name, value]) => ({ name, value }));
      return pie.length ? pie : null;
    };

    const fetchData = async () => {
      setSpectroscopyLoading(true);
      setSpectroscopyError(null);
      try {
        const res = await fetch(FIRE_FLY_URL, {cache: 'force-cache'});
        if (!res.ok) throw new Error(`Firefly fetch failed: ${res.status}`);
        const data = await res.json();
        // Firefly returns an object with "data" or array directly; handle both
        let records = Array.isArray(data) ? data : data.data || data.table || [];
        if (!Array.isArray(records)) records = [];
        const pie = parseRecordsForMolecules(records);
        if (mounted) {
          if (pie) {
            setSpectroscopyPieData(pie);
          } else {
            // fallback: try scanning CSV if JSON payload empty/unexpected - attempt text parse
            const text = await res.text();
            // naive CSV fallback
            const lines = text.split('\n').filter(Boolean);
            if (lines.length > 1) {
              const headers = lines[0].split(',');
              const csvRecords = lines.slice(1).map(l => {
                const cols = l.split(',');
                const obj = {};
                headers.forEach((h, i) => obj[h.trim()] = (cols[i] || '').trim());
                return obj;
              });
              const pie2 = parseRecordsForMolecules(csvRecords);
              setSpectroscopyPieData(pie2 || null);
            } else {
              setSpectroscopyPieData(null);
            }
          }
        }
      } catch (err) {
        console.error('Spectroscopy fetch error:', err);
        if (mounted) setSpectroscopyError(err.message);
      } finally {
        if (mounted) setSpectroscopyLoading(false);
      }
    };

    fetchData();

    return () => { mounted = false; };
  }, []);

  // Real-time data simulation (continued)
  // Filtered planets
  const filteredPlanets = useMemo(() => {
    let filtered = exoplanetData.filter(planet => {
      const matchesSearch = planet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          planet.host_star.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterType === 'all' || 
                          planet.planet_type.toLowerCase().includes(filterType.toLowerCase()) ||
                          planet.discovery_method.toLowerCase().includes(filterType.toLowerCase());
      
      return matchesSearch && matchesFilter;
    });

    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'discovery_year':
          return b.discovery_year - a.discovery_year;
        case 'distance':
          return parseFloat(a.distance) - parseFloat(b.distance);
        case 'habitability':
          return parseFloat(b.habitability_score) - parseFloat(a.habitability_score);
        case 'ai_priority':
          return parseFloat(b.ai_confidence) - parseFloat(a.ai_confidence);
        case 'observations':
          return b.follow_up_observations - a.follow_up_observations;
        default:
          return 0;
      }
    });

    return filtered;
  }, [exoplanetData, searchTerm, filterType, sortBy]);

  // Statistics for charts
  const discoveryMethodStats = useMemo(() => {
    const methods = {};
    exoplanetData.forEach(planet => {
      methods[planet.discovery_method] = (methods[planet.discovery_method] || 0) + 1;
    });
    return Object.entries(methods).map(([method, count]) => ({ name: method, value: count }));
  }, [exoplanetData]);

  const planetTypeStats = useMemo(() => {
    const types = {};
    exoplanetData.forEach(planet => {
      types[planet.planet_type] = (types[planet.planet_type] || 0) + 1;
    });
    return Object.entries(types).map(([type, count]) => ({ name: type, value: count }));
  }, [exoplanetData]);

  const telescopeStats = useMemo(() => {
    const telescopeData = {};
    exoplanetData.forEach(planet => {
      telescopeData[planet.discovery_telescope] = (telescopeData[planet.discovery_telescope] || 0) + 1;
    });
    return Object.entries(telescopeData).map(([telescope, count]) => ({
      name: telescopes[telescope]?.name.split(' ')[0] || telescope,
      value: count,
      efficiency: telescopes[telescope]?.efficiency || 0
    }));
  }, [exoplanetData]);

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316'];

  const paginatedPlanets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPlanets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPlanets, currentPage]);

  const totalPages = Math.ceil(filteredPlanets.length / itemsPerPage);

  // AI Analysis
  const aiAnalysis = useMemo(() => {
    if (!selectedPlanet) return null;
    
    const habitability = parseFloat(selectedPlanet.habitability_score);
    const temperature = selectedPlanet.temperature;
    const hasAtmosphere = selectedPlanet.atmosphere !== 'Unknown';
    const distance = parseFloat(selectedPlanet.distance);
    
    let recommendation = 'Low Priority';
    let reasoning = '';
    let nextSteps = [];
    let urgency = 'Low';
    
    if (habitability > 0.7 && temperature > 273 && temperature < 373 && hasAtmosphere && distance < 100) {
      recommendation = 'Immediate Priority Target';
      reasoning = 'Exceptional habitability metrics with confirmed atmosphere, liquid water potential, and proximity make this a prime candidate for intensive study.';
      nextSteps = ['Emergency JWST time allocation', 'Multi-telescope coordinated campaign', 'Atmospheric biosignature search', 'Direct imaging feasibility study'];
      urgency = 'Critical';
    } else if (habitability > 0.6 && hasAtmosphere && distance < 200) {
      recommendation = 'High Priority Target';
      reasoning = 'Strong habitability potential with detectable atmosphere suitable for detailed characterization studies.';
      nextSteps = ['Schedule JWST atmospheric spectroscopy', 'Coordinate ground-based radial velocity follow-up', 'Plan direct imaging attempts'];
      urgency = 'High';
    } else if (habitability > 0.4 || hasAtmosphere) {
      recommendation = 'Medium Priority';
      reasoning = 'Moderate interest for comparative planetology and atmospheric studies.';
      nextSteps = ['Request Hubble transit observations', 'Schedule ground-based photometry', 'Atmospheric modeling'];
      urgency = 'Medium';
    } else {
      recommendation = 'Research Target';
      reasoning = 'Valuable for population statistics and comparative planetology studies.';
      nextSteps = ['Include in survey programs', 'Long-term monitoring', 'Statistical analysis'];
      urgency = 'Low';
    }
    
    return { 
      recommendation, 
      reasoning, 
      nextSteps, 
      confidence: selectedPlanet.ai_confidence, 
      urgency,
      riskFactors: distance > 1000 ? ['Extremely distant'] : distance > 500 ? ['Very distant'] : [],
      opportunities: hasAtmosphere ? ['Atmospheric characterization possible'] : []
    };
  }, [selectedPlanet]);

  // Real exoplanet spectroscopic data based on NASA Exoplanet Archive observations
  const ExoplanetSpectroscopy = {
    generateRealSpectroscopicData: (planet) => {
      const wavelengths = [];
      const telescope = telescopes[selectedTelescope];
     
      // Real molecular absorption databases (wavelengths in microns, converted to nm)
      const realMolecularLines = {
        'H2O': [
          // Near-infrared H2O bands observed by JWST/HST
          1134, 1177, 1368, 1400, 1454, 1500, 1560, 1620, 1650, 1700, 1750, 1800,
          1900, 1950, 2700, 2800, 2900, 3000, 3200, 3400, 3600, 3800, 4000, 4200
        ],
        'CO2': [
          // CO2 bands from Venus Express, ExoMars, JWST observations
          1430, 1600, 2000, 2070, 2080, 4300, 4600, 14800, 15000
        ],
        'CH4': [
          // Methane bands from Titan, exoplanet observations
          1170, 1240, 1320, 1660, 2200, 2300, 2400, 3300, 7700, 8900
        ],
        'CO': [
          // Carbon monoxide from hot Jupiter observations
          1580, 2300, 4600, 4700
        ],
        'NH3': [
          // Ammonia from Jupiter, Saturn observations
          1500, 2000, 6450, 10500
        ],
        'O2': [
          // Oxygen A-band and other features
          760, 1270, 13120
        ],
        'N2': [
          // Nitrogen collision-induced absorption
          4100, 4300
        ],
        'H2': [
          // Hydrogen collision-induced absorption
          17000, 20000, 28000
        ],
        'He': [
          // Helium features in hot atmospheres
          10830, 5876
        ]
      };
      // Generate wavelength range from 0.4 to 5.0 microns (400-5000 nm)
      for (let wavelength = 400; wavelength <= 5000; wavelength += 2) {
        // Base stellar continuum with realistic noise
        let stellarFlux = 1.0;
       
        // Apply telescope throughput curves
        let telescopeEfficiency = (telescope?.efficiency || 90) / 100;
       
        // Realistic telescope efficiency curves
        if (telescope?.type.includes('Infrared')) {
          if (wavelength < 1000) telescopeEfficiency *= 0.3;
          else if (wavelength < 2000) telescopeEfficiency *= 0.8;
          else telescopeEfficiency *= Math.min(1.2, 0.9 + (wavelength - 2000) / 10000);
        }
        if (telescope?.type.includes('Optical')) {
          if (wavelength < 350) telescopeEfficiency *= 0.1;
          else if (wavelength < 1000) telescopeEfficiency *= 1.1;
          else telescopeEfficiency *= Math.max(0.2, 1.1 - (wavelength - 1000) / 2000);
        }
       
        // Calculate transit depth for transmission spectrum
        let transitDepth = 0;
        const planetRadius = parseFloat(planet.radius); // Earth radii
        const baseTransitDepth = Math.pow(planetRadius * 6371 / (695700), 2); // (Rp/Rs)^2 approximation
       
        // Apply atmospheric opacity
        const atmosphereComponents = planet.atmosphere.split('/').map(comp =>
          comp.replace('-rich', '').replace('-dominated', '').trim()
        );
       
        atmosphereComponents.forEach(molecule => {
          const lines = realMolecularLines[molecule] || [];
         
          lines.forEach(lineWavelength => {
            const lineWidth = molecule === 'H2O' ? 50 : molecule === 'CO2' ? 30 : 25; // nm
            const lineStrength = {
              'H2O': 0.0003,
              'CO2': 0.0002,
              'CH4': 0.00015,
              'CO': 0.0001,
              'NH3': 0.0001,
              'O2': 0.00008,
              'N2': 0.00005,
              'H2': 0.00003,
              'He': 0.00002
            }[molecule] || 0.00005;
           
            if (Math.abs(wavelength - lineWavelength) < lineWidth) {
              const gaussian = Math.exp(-0.5 * Math.pow((wavelength - lineWavelength) / (lineWidth / 3), 2));
              transitDepth += baseTransitDepth * lineStrength * gaussian * 1000; // Scale factor
            }
          });
        });
       
        // Add stellar activity and systematic noise
        const stellarActivity = 0.00001 * Math.sin(wavelength / 100) * Math.random();
        const systematicNoise = 0.00002 * (Math.random() - 0.5);
        const photonNoise = 0.00001 * Math.sqrt(1 / telescopeEfficiency) * (Math.random() - 0.5);
       
        const finalTransitDepth = baseTransitDepth + transitDepth + stellarActivity + systematicNoise + photonNoise;
       
        // Convert to relative flux (1 - transit_depth for transmission)
        const relativeFlux = Math.max(0.0001, Math.min(1.0, 1 - finalTransitDepth));
       
        // Calculate SNR based on realistic observing conditions
        const photonCount = telescopeEfficiency * 1000000 * (wavelength < 1000 ? 1 : wavelength < 2000 ? 0.8 : 0.5);
        const totalNoise = Math.sqrt(photonCount + Math.pow(systematicNoise * 1000000, 2));
        const snr = Math.max(3, photonCount / totalNoise);
       
        wavelengths.push({
          wavelength: wavelength,
          flux: relativeFlux,
          transit_depth: finalTransitDepth,
          snr: snr,
          telescope_efficiency: telescopeEfficiency,
          photon_noise: Math.abs(photonNoise),
          systematic_noise: Math.abs(systematicNoise),
          stellar_flux: stellarFlux,
          atmospheric_absorption: transitDepth > 0,
          uncertainty: Math.max(0.00001, finalTransitDepth / snr)
        });
      }
     
      return wavelengths;
    },
    // Enhanced AI spectral analysis
    performSpectralAnalysis: (spectralData, planet) => {
      const detectedMolecules = [];
      const molecularConfidence = {};
     
      // Real detection algorithm simulation
      const realMolecularSignatures = {
        'H2O': [1134, 1368, 1400, 1800, 2700, 3200],
        'CO2': [1430, 1600, 2070, 4300],
        'CH4': [1170, 1660, 2300, 3300],
        'CO': [1580, 2300, 4700],
        'NH3': [1500, 6450],
        'O2': [760, 1270],
        'N2': [4300]
      };
     
      Object.entries(realMolecularSignatures).forEach(([molecule, wavelengths]) => {
        let detectionScore = 0;
        let totalFeatures = 0;
       
        wavelengths.forEach(targetWavelength => {
          const matchingData = spectralData.find(d =>
            Math.abs(d.wavelength - targetWavelength) < 30 && d.atmospheric_absorption
          );
         
          if (matchingData && matchingData.snr > 3) {
            const signalStrength = matchingData.transit_depth / matchingData.uncertainty;
            if (signalStrength > 2) {
              detectionScore += Math.min(1, signalStrength / 5);
              totalFeatures++;
            }
          }
        });
       
        if (totalFeatures > 0) {
          const confidence = (detectionScore / wavelengths.length) * (totalFeatures / wavelengths.length);
          if (confidence > 0.3) {
            detectedMolecules.push(molecule);
            molecularConfidence[molecule] = confidence;
          }
        }
      });
     
      // Biosignature assessment
      let biosignaturePotential = { level: 'Low', reason: 'No biosignature molecules detected', score: 0 };
     
      if (detectedMolecules.includes('O2') && detectedMolecules.includes('H2O')) {
        biosignaturePotential = {
          level: 'High',
          reason: 'O2 + H2O co-detection suggests possible photosynthesis',
          score: 0.85
        };
      } else if (detectedMolecules.includes('O2') || (detectedMolecules.includes('CH4') && detectedMolecules.includes('H2O'))) {
        biosignaturePotential = {
          level: 'Medium',
          reason: 'Single biosignature gas detected, follow-up needed',
          score: 0.6
        };
      } else if (detectedMolecules.includes('H2O') && planet.temperature > 273 && planet.temperature < 373) {
        biosignaturePotential = {
          level: 'Medium',
          reason: 'Water vapor in habitable temperature range',
          score: 0.5
        };
      }
     
      return {
        detectedMolecules,
        molecularConfidence,
        biosignaturePotential,
        spectralQuality: spectralData.reduce((sum, d) => sum + d.snr, 0) / spectralData.length,
        atmosphericPressure: detectedMolecules.length > 2 ? 'Dense' : detectedMolecules.length > 0 ? 'Moderate' : 'Thin',
        recommendedFollowUp: biosignaturePotential.level === 'High' ? 'Immediate multi-telescope campaign' :
                            biosignaturePotential.level === 'Medium' ? 'Extended JWST observations' :
                            'Continue routine monitoring'
      };
    },
    // Combined function to generate and analyze in one step
    generateAndAnalyze: (planet) => {
      const spectralData = ExoplanetSpectroscopy.generateRealSpectroscopicData(planet);
      return ExoplanetSpectroscopy.performSpectralAnalysis(spectralData, planet);
    }
  };

  const spectroscopyData = selectedPlanet ? ExoplanetSpectroscopy.generateRealSpectroscopicData(selectedPlanet) : [];

  // Deterministic atmospheric profile for RadarChart:
  // - Prefer real per-planet atmosphereComposition if available
  // - Fallback to spectralAnalysis.molecularConfidence if present
  // - Final fallback: seeded deterministic pseudo-random values based on planet id/name
  const atmosphericProfile = useMemo(() => {
    const species = ['H2O', 'CO2', 'CH4', 'N2', 'O2', 'H2', 'He', 'NH3', 'CO'];
    const defaultVal = 20; // baseline
    if (!selectedPlanet) {
      return species.map(s => ({ subject: s, A: defaultVal }));
    }

    const comp = selectedPlanet.atmosphereComposition || {};
    const mconf = spectralAnalysis?.molecularConfidence || {};
    const seedStr = `${selectedPlanet.name}-${selectedPlanet.id || 0}`;
    const rand = seededRandomFromString(seedStr);

    // Normalize keys of atmosphereComposition (e.g., "H2/He" -> keys might be "H2" and "He")
    const normalizedComp = {};
    Object.entries(comp).forEach(([k, v]) => {
      // split by non-alphanumeric characters and map
      const parts = k.split(/[^A-Za-z0-9]+/).filter(Boolean);
      if (parts.length === 1) normalizedComp[parts[0].toUpperCase()] = Number(v);
      else {
        const share = Number(v) / parts.length;
        parts.forEach(p => normalizedComp[p.toUpperCase()] = (normalizedComp[p.toUpperCase()] || 0) + share);
      }
    });

    return species.map(s => {
      const key = s.toUpperCase();
      let val = defaultVal;

      if (normalizedComp[key] !== undefined) {
        // map to 0..100, clamp
        val = Math.min(100, Math.max(0, Math.round(Number(normalizedComp[key]))));
        // small floor to ensure visibility in radar
        val = Math.max(5, val);
      } else if (mconf[key] !== undefined) {
        // confidence 0..1 -> 0..100
        val = Math.min(100, Math.round(Number(mconf[key]) * 100));
        val = Math.max(5, val);
      } else {
        // deterministic fallback per-planet + species
        const pseudo = rand(); // deterministic per planet
        // map pseudo [0,1) to 10..85
        val = Math.round(10 + pseudo * 75);
      }

      return { subject: s, A: val };
    });
  }, [selectedPlanet, spectralAnalysis]);

  const getTypeClass = (type) => {
    switch (type) {
      case 'Terrestrial':
        return 'bg-green-500/20 text-green-300 border-green-500/40';
      case 'Super Earth':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Mini-Neptune':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'Gas Giant':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'Hot Jupiter':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'Ice Giant':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      case 'Sub-Earth':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/40';
      case 'Puffy Planet':
        return 'bg-pink-500/20 text-pink-300 border-pink-500/40';
      case 'Ocean World':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      case 'Desert World':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/40'; // Fallback
    }
  };

  // Real AI classification function
  const performAIClassification = async (planet) => {
    if (!aiClassifier) return null;
    
    setAiProcessing(true);
    try {
      const classification = await aiClassifier.classifyPlanet(planet);
      const habitability = await aiClassifier.calculateHabitability(planet);
      const priorityScore = predictiveAnalytics.calculatePriorityScore(planet);
      
      return {
        ...classification,
        habitability,
        priorityScore,
        aiGenerated: true
      };
    } catch (error) {
      console.error('AI Classification error:', error);
      return null;
    } finally {
      setAiProcessing(false);
    }
  };

  // AI Analysis Display Component
  const AIAnalysisPanel = ({ planet, classification, spectralAnalysis }) => {
    if (!planet || !classification) return null;
    
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 shadow-xl">
        <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <Brain className="w-6 h-6 text-purple-400" />
          AI Deep Learning Analysis
          <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
            Live AI
          </span>
        </h3>
        
        <div className="space-y-6">
          {/* Classification Results */}
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
            <h4 className="text-lg font-semibold text-purple-300 mb-3">Neural Network Classification</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-white">Predicted Type:</span>
                <span className="text-purple-300 font-bold">{classification.predictedType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white">Confidence:</span>
                <span className="text-green-300 font-bold">
                  {(classification.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="mt-3">
                <div className="text-sm text-gray-300 mb-2">Classification Probabilities:</div>
                {Object.entries(classification.probabilities).map(([type, prob]) => (
                  <div key={type} className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-400">{type}:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-700 rounded-full h-1">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-1 rounded-full"
                          style={{ width: `${prob * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-300">{(prob * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Habitability Analysis */}
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
            <h4 className="text-lg font-semibold text-green-300 mb-3">AI Habitability Assessment</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white">Overall Score:</span>
                <span className="text-green-300 font-bold">
                  {(classification.habitability.score * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-sm text-green-200 mb-2">
                {classification.habitability.recommendation}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(classification.habitability.factors).map(([factor, score]) => (
                  <div key={factor} className="bg-white/5 p-2 rounded">
                    <div className="text-gray-400 capitalize">{factor}:</div>
                    <div className="text-green-300 font-semibold">{(score * 100).toFixed(0)}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Spectral Analysis */}
          {spectralAnalysis.detectedMolecules && spectralAnalysis.detectedMolecules.length > 0 && (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <h4 className="text-lg font-semibold text-blue-300 mb-3">AI Spectroscopic Analysis</h4>
              <div className="space-y-2">
                <div className="text-sm text-blue-200">
                  Detected Molecules: {spectralAnalysis.detectedMolecules.join(', ')}
                </div>
                <div className="text-sm">
                  <span className="text-blue-300">Biosignature Potential: </span>
                  <span className={`font-bold ${
                    spectralAnalysis.biosignaturePotential.level === 'High' ? 'text-green-300' :
                    spectralAnalysis.biosignaturePotential.level === 'Medium' ? 'text-yellow-300' :
                    'text-red-300'
                  }`}>
                    {spectralAnalysis.biosignaturePotential.level}
                  </span>
                </div>
                <div className="text-xs text-blue-200">
                  {spectralAnalysis.biosignaturePotential.reason}
                </div>
              </div>
            </div>
          )}

          {/* Priority Score */}
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <h4 className="text-lg font-semibold text-yellow-300 mb-3">AI Priority Scoring</h4>
            <div className="flex items-center justify-between">
              <span className="text-white">Research Priority Score:</span>
              <div className="flex items-center gap-3">
                <div className="w-24 bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-yellow-500 to-green-500 h-3 rounded-full"
                    style={{ width: `${classification.priorityScore * 100}%` }}
                  />
                </div>
                <span className="text-yellow-300 font-bold">
                  {(classification.priorityScore * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Handle planet selection and include AI analysis
  const handlePlanetSelection = async (planet) => {
    setSelectedPlanet(planet);
    
    // Perform AI classification
    if (aiClassifier) {
      const aiAnalysis = await performAIClassification(planet);
      if (aiAnalysis) {
        setSelectedPlanet(prev => ({ ...prev, aiAnalysis }));
      }
    }
  };

  // Navigation tabs
  const tabs = [
    { id: 'catalog', label: 'Exoplanet Catalog', icon: Globe },
    { id: 'observatory', label: 'Observatory Network', icon: Telescope },
    { id: 'analytics', label: 'Analytics Dashboard', icon: BarChart3 },
    { id: 'spectroscopy', label: 'Spectroscopy Lab', icon: Zap },
    { id: 'ai-insights', label: 'AI Mission Control', icon: Brain },
    { id: 'mission-planner', label: 'Mission Planner', icon: Target }
  ];

  // Network status indicator
  const getNetworkStatusColor = (status) => {
    switch(status) {
      case 'online': return 'text-green-400 bg-green-500/20';
      case 'maintenance': return 'text-yellow-400 bg-yellow-500/20';
      case 'partial': return 'text-orange-400 bg-orange-500/20';
      default: return 'text-red-400 bg-red-500/20';
    }
  };

  const getNetworkStatusIcon = (status) => {
    switch(status) {
      case 'online': return Wifi;
      case 'maintenance': return Settings;
      case 'partial': return AlertTriangle;
      default: return WifiOff;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Top Navigation Bar */}
      <div className="bg-black/30 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-105"
              >
                {sidebarOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
              </button>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Brain className="w-10 h-10 text-purple-400" />
                  {aiProcessing && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full animate-pulse">
                      <Sparkles className="w-3 h-3 text-white m-0.5" />
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                    AI Exoplanet Observatory
                  </h1>
                  <p className="text-sm text-gray-300 font-medium">Advanced Deep Space Intelligence Network</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${getNetworkStatusColor(networkStatus)}`}>
                {React.createElement(getNetworkStatusIcon(networkStatus), { className: "w-4 h-4" })}
                <span className="text-sm font-semibold capitalize">{networkStatus} Network</span>
              </div>
              <div className="text-white text-sm bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20">
                <span className="font-bold text-purple-300">{exoplanetData.length.toLocaleString()}</span> Exoplanets
              </div>
              {aiProcessing && (
                <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 rounded-xl border border-purple-500/30">
                  <Cpu className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span className="text-purple-300 text-sm font-medium">AI Processing</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Navigation */}
        {sidebarOpen && (
          <div className="w-80 bg-black/30 backdrop-blur-xl border-r border-white/20 min-h-screen">
            <div className="p-6">
              {/* Search Bar */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search exoplanets, stars, or telescopes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter Controls */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Planet Classification
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
                  >
                    <option value="all">All Classifications</option>
                    <option value="terrestrial">🌍 Terrestrial Worlds</option>
                    <option value="super earth">🪐 Super Earths</option>
                    <option value="neptune">❄️ Neptune-like</option>
                    <option value="gas giant">🌪️ Gas Giants</option>
                    <option value="hot jupiter">🔥 Hot Jupiters</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Priority Sorting
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
                  >
                    <option value="ai_priority">🤖 AI Priority Score</option>
                    <option value="discovery_year">📅 Discovery Year</option>
                    <option value="distance">📏 Distance from Earth</option>
                    <option value="habitability">🌱 Habitability Index</option>
                    <option value="observations">👁️ Observation Count</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
                    <Telescope className="w-4 h-4" />
                    Primary Observatory
                  </label>
                  <select
                    value={selectedTelescope}
                    onChange={(e) => setSelectedTelescope(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
                  >
                    {Object.entries(telescopes).map(([key, telescope]) => (
                      <option key={key} value={key}>
                        {telescope.status === 'Active' ? '🟢' : '🔴'} {telescope.name.split(' ')[0]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Enhanced Quick Stats */}
              <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-5 border border-white/20 backdrop-blur-sm">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-400" />
                  Discovery Statistics
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                    <span className="text-gray-300 flex items-center gap-2">
                      <Target className="w-3 h-3" />
                      Total Results
                    </span>
                    <span className="text-white font-bold">{filteredPlanets.length.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    <span className="text-green-300 flex items-center gap-2">
                      <Star className="w-3 h-3" />
                      High Priority
                    </span>
                    <span className="text-green-400 font-bold">
                      {filteredPlanets.filter(p => parseFloat(p.habitability_score) > 0.7).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <span className="text-blue-300 flex items-center gap-2">
                      <Atom className="w-3 h-3" />
                      With Atmosphere
                    </span>
                    <span className="text-blue-400 font-bold">
                      {filteredPlanets.filter(p => p.atmosphere !== 'Unknown').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <span className="text-purple-300 flex items-center gap-2">
                      <Map className="w-3 h-3" />
                      Within 100 ly
                    </span>
                    <span className="text-purple-400 font-bold">
                      {filteredPlanets.filter(p => parseFloat(p.distance) < 100).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <span className="text-yellow-300 flex items-center gap-2">
                      <Eye className="w-3 h-3" />
                      Under Observation
                    </span>
                    <span className="text-yellow-400 font-bold">
                      {filteredPlanets.filter(p => p.follow_up_observations > 5).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1">
          {/* Tab Navigation */}
          <div className="bg-black/20 backdrop-blur-sm border-b border-white/20">
            <div className="px-6">
              <div className="flex space-x-1 overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'text-purple-400 border-purple-400 bg-purple-500/10'
                          : 'text-gray-400 border-transparent hover:text-gray-200 hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Exoplanet Catalog Tab */}
            {activeTab === 'catalog' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Planet List */}
                <div className="lg:col-span-2">
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
                    <div className="p-6 border-b border-white/10">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                          <Database className="w-6 h-6 text-purple-400" />
                          Exoplanet Discovery Catalog
                        </h2>
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-gray-300 bg-white/10 px-4 py-2 rounded-lg">
                            {filteredPlanets.length.toLocaleString()} results
                          </div>
                          <div className="text-xs text-gray-300">
                            Updated {new Date().toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="space-y-4 max-h-[700px] overflow-y-auto custom-scrollbar">
                        {paginatedPlanets.map((planet) => (
                          <div
                            key={planet.id}
                            onClick={() => handlePlanetSelection(planet)}
                            className={`p-5 rounded-xl cursor-pointer transition-all duration-300 border-2 hover:shadow-xl hover:scale-[1.02] ${
                              selectedPlanet?.id === planet.id
                                ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/20 border-purple-500/60 shadow-lg shadow-purple-500/25'
                                : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/30'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="font-bold text-white text-xl mb-1">{planet.name}</h3>
                                <div className="text-sm text-gray-300 flex items-center gap-3">
                                  <span className="flex items-center gap-1">
                                    <Telescope className="w-4 h-4" />
                                    {telescopes[planet.discovery_telescope]?.name.split(' ')[0]}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {planet.discovery_year}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-3">
                                <span className={`px-4 py-2 rounded-full text-xs font-bold border-2 ${getTypeClass(planet.planet_type)}`}>
                                  {planet.planet_type}
                                </span>
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="text-purple-300 flex items-center gap-2">
                                    <Globe className="w-4 h-4" />
                                    {planet.distance} ly
                                  </div>
                                  <div className="text-blue-300 flex items-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    {planet.temperature} K
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                              <div>
                                <span className="text-gray-400 block">Mass</span>
                                <span className="text-white font-semibold">{planet.mass} M⊕</span>
                              </div>
                              <div>
                                <span className="text-gray-400 block">Radius</span>
                                <span className="text-white font-semibold">{planet.radius} R⊕</span>
                              </div>
                              <div>
                                <span className="text-gray-400 block">Orbit</span>
                                <span className="text-white font-semibold">{planet.orbital_period} days</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 text-sm flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-400" />
                                Habitability: {planet.habitability_score}
                              </span>
                              <span className="text-gray-400 text-sm flex items-center gap-2">
                                <Eye className="w-4 h-4 text-green-400" />
                                Observations: {planet.follow_up_observations}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-6">
                        <button 
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="px-4 py-2 bg-white/10 rounded-lg disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <span className="text-gray-300">Page {currentPage} of {totalPages}</span>
                        <button 
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 bg-white/10 rounded-lg disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Planet Details */}
                <div className="space-y-6">
                  {selectedPlanet ? (
                    <>
                      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 shadow-xl">
                        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                          <Info className="w-6 h-6 text-purple-400" />
                          Planet Details: {selectedPlanet.name}
                        </h3>
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                            <h4 className="text-lg font-semibold text-purple-300 mb-2">System Information</h4>
                            <div className="space-y-2 text-sm text-gray-300">
                              <div className="flex justify-between">
                                <span>Host Star</span>
                                <span className="text-white">{selectedPlanet.host_star} ({selectedPlanet.stellar_type})</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Distance</span>
                                <span className="text-white">{selectedPlanet.distance} light-years</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Discovery Method</span>
                                <span className="text-white">{selectedPlanet.discovery_method}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Discovery Year</span>
                                <span className="text-white">{selectedPlanet.discovery_year}</span>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                            <h4 className="text-lg font-semibold text-blue-300 mb-2">Physical Characteristics</h4>
                            <div className="space-y-2 text-sm text-gray-300">
                              <div className="flex justify-between">
                                <span>Mass</span>
                                <span className="text-white">{selectedPlanet.mass} Earth masses</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Radius</span>
                                <span className="text-white">{selectedPlanet.radius} Earth radii</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Temperature</span>
                                <span className="text-white">{selectedPlanet.temperature} K</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Orbital Period</span>
                                <span className="text-white">{selectedPlanet.orbital_period} days</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Climate Zone</span>
                                <span className="text-white">{selectedPlanet.climate_zone}</span>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                            <h4 className="text-lg font-semibold text-green-300 mb-2">Habitability Assessment</h4>
                            <div className="space-y-2 text-sm text-gray-300">
                              <div className="flex justify-between">
                                <span>Habitability Score</span>
                                <span className="text-green-300 font-bold">{selectedPlanet.habitability_score}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Atmosphere</span>
                                <span className="text-white">{selectedPlanet.atmosphere}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Gas Composition</span>
                                <div className="text-right text-white">
                                  {selectedPlanet.atmosphere !== 'Unknown' ? (
                                    Object.entries(selectedPlanet.atmosphereComposition).map(([gas, pct]) => (
                                      <div key={gas}>{gas}: {pct}%</div>
                                    ))
                                  ) : (
                                    <span>N/A</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex justify-between">
                                <span>Water Presence</span>
                                <span className="text-white">{selectedPlanet.water_presence}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Biosignature Potential</span>
                                <span className={`font-bold ${
                                  selectedPlanet.biosignature_potential === 'High' ? 'text-green-300' :
                                  selectedPlanet.biosignature_potential === 'Medium' ? 'text-yellow-300' :
                                  'text-red-300'
                                }`}>
                                  {selectedPlanet.biosignature_potential}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Research Priority</span>
                                <span className={`font-bold ${
                                  selectedPlanet.research_priority === 'Critical' ? 'text-red-300' :
                                  selectedPlanet.research_priority === 'High' ? 'text-orange-300' :
                                  selectedPlanet.research_priority === 'Medium' ? 'text-yellow-300' :
                                  'text-blue-300'
                                }`}>
                                  {selectedPlanet.research_priority}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {selectedPlanet.aiAnalysis && (
                        <AIAnalysisPanel 
                          planet={selectedPlanet}
                          classification={selectedPlanet.aiAnalysis}
                          spectralAnalysis={spectralAnalysis}
                        />
                      )}

                      {aiAnalysis && (
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 shadow-xl">
                          <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <Target className="w-6 h-6 text-orange-400" />
                            Mission Recommendation
                          </h3>
                          <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
                              <h4 className="text-lg font-semibold text-orange-300 mb-2">AI Recommendation</h4>
                              <p className="text-white">{aiAnalysis.recommendation}</p>
                              <p className="text-gray-300 text-sm mt-2">{aiAnalysis.reasoning}</p>
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-white mb-2">Next Steps</h4>
                              <ul className="space-y-2">
                                {aiAnalysis.nextSteps.map((step, index) => (
                                  <li key={index} className="flex items-center gap-2 text-gray-300 text-sm">
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                    {step}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-300">Confidence: <span className="text-white font-bold">{(parseFloat(aiAnalysis.confidence) * 100).toFixed(1)}%</span></span>
                              <span className="text-gray-300">Urgency: <span className={`font-bold ${
                                aiAnalysis.urgency === 'Critical' ? 'text-red-300' :
                                aiAnalysis.urgency === 'High' ? 'text-orange-300' :
                                aiAnalysis.urgency === 'Medium' ? 'text-yellow-300' :
                                'text-blue-300'
                              }`}>{aiAnalysis.urgency}</span></span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-16 text-center h-full">
                      <Globe className="w-24 h-24 text-gray-400 mx-auto mb-6 opacity-50" />
                      <h3 className="text-2xl font-bold text-gray-300 mb-4">Select an Exoplanet</h3>
                      <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
                        Choose a planet from the catalog to view detailed information, AI analysis, and mission recommendations.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Observatory Network Tab */}
            {activeTab === 'observatory' && (
              <div className="space-y-8">
                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 shadow-xl">
                  <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                    <Telescope className="w-8 h-8 text-blue-400" />
                    Observatory Network Status
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(telescopes).map(([key, telescope]) => (
                      <div key={key} className="bg-gradient-to-br from-white/5 to-white/10 rounded-xl p-6 border border-white/20">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-white">{telescope.name.split(' ')[0]}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            telescope.status === 'Active' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                          }`}>
                            {telescope.status}
                          </span>
                        </div>
                        <div className="space-y-3 text-sm text-gray-300">
                          <div className="flex justify-between">
                            <span>Type</span>
                            <span className="text-white">{telescope.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Launched</span>
                            <span className="text-white">{telescope.launched}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Discoveries</span>
                            <span className="text-white">{telescope.discoveries.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Efficiency</span>
                            <span className="text-green-300">{telescope.efficiency}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Wavelengths</span>
                            <span className="text-white">{telescope.wavelengths}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <h3 className="text-2xl font-bold text-white my-8 flex items-center gap-3">
                    <Satellite className="w-7 h-7 text-green-400" />
                    Ground-Based Observatories
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {observatories.map((obs) => (
                      <div key={obs.name} className="bg-gradient-to-br from-white/5 to-white/10 rounded-xl p-6 border border-white/20">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-white">{obs.name}</h3>
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-300">
                            Active
                          </span>
                        </div>
                        <div className="space-y-3 text-sm text-gray-300">
                          <div className="flex justify-between">
                            <span>Location</span>
                            <span className="text-white">{obs.location}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Type</span>
                            <span className="text-white">{obs.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Discoveries</span>
                            <span className="text-white">{obs.discoveries}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Efficiency</span>
                            <span className="text-green-300">{obs.efficiency}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 p-6 rounded-xl border border-purple-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <Activity className="w-8 h-8 text-purple-400" />
                      <span className="text-2xl font-bold text-purple-300">
                        {realTimeData.length > 0 ? realTimeData[realTimeData.length - 1].observations : 0}
                      </span>
                    </div>
                    <div className="text-purple-200 font-medium">Active Observations</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 p-6 rounded-xl border border-blue-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <Database className="w-8 h-8 text-blue-400" />
                      <span className="text-2xl font-bold text-blue-300">
                        {realTimeData.length > 0 ? (realTimeData[realTimeData.length - 1].dataVolume / 1000).toFixed(1) : 0}GB
                      </span>
                    </div>
                    <div className="text-blue-200 font-medium">Data Volume/Hour</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 p-6 rounded-xl border border-yellow-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <Star className="w-8 h-8 text-yellow-400" />
                      <span className="text-2xl font-bold text-yellow-300">
                        {realTimeData.reduce((sum, d) => sum + d.discoveries, 0)}
                      </span>
                    </div>
                    <div className="text-yellow-200 font-medium">New Discoveries</div>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Dashboard Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-8">
                {/* Main Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
                      <Microscope className="w-6 h-6 text-purple-400" />
                      Discovery Methods
                    </h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={discoveryMethodStats}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            label={({name, percent}) => `${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {discoveryMethodStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(0,0,0,0.9)',
                              border: '1px solid #333',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                      {discoveryMethodStats.map((entry, index) => (
                        <div key={entry.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-gray-300">{entry.name}</span>
                          </div>
                          <span className="text-white font-semibold">{entry.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Replaced Planet Classifications pie with Spectroscopic Detections pie fed from NASA Exoplanet Archive Firefly */}
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
                      <Globe className="w-6 h-6 text-blue-400" />
                      Spectroscopic Detections (stable data)
                    </h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={spectroscopyPieData || planetTypeStats}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {(spectroscopyPieData || planetTypeStats).map((entry, index) => (
                              <Cell key={`cell-spec-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(0,0,0,0.9)',
                              border: '1px solid #333',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                            formatter={(value, name) => {
                              // show raw counts when spectroscopyPieData present
                              return [value, name];
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                      {(spectroscopyPieData || planetTypeStats).map((entry, index) => (
                        <div key={entry.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-gray-300">{entry.name}</span>
                          </div>
                          <span className="text-white font-semibold">{entry.value.toLocaleString()}</span>
                        </div>
                      ))}
                      {spectroscopyLoading && <div className="text-xs text-gray-400 mt-2">Loading spectroscopy summary...</div>}
                      {spectroscopyError && <div className="text-xs text-red-400 mt-2">Spectroscopy fetch error: {spectroscopyError}</div>}
                      {!spectroscopyLoading && !spectroscopyPieData && !spectroscopyError && (
                        <div className="text-xs text-gray-400 mt-2">No spectroscopy summary found — showing fallback dataset.</div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
                      <Telescope className="w-6 h-6 text-green-400" />
                      Observatory Performance
                    </h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={telescopeStats}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                          <XAxis dataKey="name" stroke="#fff" fontSize={11} />
                          <YAxis stroke="#fff" fontSize={11} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(0,0,0,0.9)',
                              border: '1px solid #333',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                          />
                          <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {[
                    { 
                      label: 'Total Exoplanets', 
                      value: exoplanetData.length.toLocaleString(), 
                      color: 'purple', 
                      icon: Globe 
                    },
                    { 
                      label: 'Active Telescopes', 
                      value: Object.keys(telescopes).filter(key => telescopes[key].status === 'Active').length, 
                      color: 'blue', 
                      icon: Telescope 
                    },
                    { 
                      label: 'High Priority Targets', 
                      value: exoplanetData.filter(p => parseFloat(p.habitability_score) > 0.7).length, 
                      color: 'green', 
                      icon: Star 
                    },
                    { 
                      label: 'Within 50 ly', 
                      value: exoplanetData.filter(p => parseFloat(p.distance) < 50).length, 
                      color: 'yellow', 
                      icon: Map 
                    },
                    { 
                      label: 'With Atmosphere', 
                      value: exoplanetData.filter(p => p.atmosphere !== 'Unknown').length, 
                      color: 'red', 
                      icon: Atom 
                    },
                    { 
                      label: 'Total Observations', 
                      value: exoplanetData.reduce((sum, p) => sum + p.follow_up_observations, 0).toLocaleString(), 
                      color: 'indigo', 
                      icon: Eye 
                    }
                  ].map((stat, index) => (
                    <div key={index} className={`bg-gradient-to-br from-${stat.color}-500/20 to-${stat.color}-600/10 backdrop-blur-md rounded-xl border border-${stat.color}-500/30 p-6 text-center hover:scale-105 transition-transform duration-200`}>
                      <stat.icon className={`w-8 h-8 text-${stat.color}-400 mx-auto mb-3`} />
                      <div className={`text-3xl font-bold text-${stat.color}-300 mb-2`}>{stat.value}</div>
                      <div className={`text-${stat.color}-200 text-sm font-medium`}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Discovery Timeline */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 shadow-xl">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <TrendingUp className="w-7 h-7 text-orange-400" />
                    Discovery Timeline Analysis
                  </h3>
                  
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={
                        Array.from({length: 30}, (_, i) => {
                          const year = 1995 + i;
                          const count = exoplanetData.filter(p => p.discovery_year === year).length;
                          return { year, discoveries: count };
                        })
                      }>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                        <XAxis dataKey="year" stroke="#fff" fontSize={12} />
                        <YAxis stroke="#fff" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            border: '1px solid #333',
                            borderRadius: '12px',
                            color: '#fff'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="discoveries" 
                          stroke="#f59e0b" 
                          fill="url(#discoveryGradient)" 
                          strokeWidth={3}
                        />
                        <defs>
                          <linearGradient id="discoveryGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Spectroscopy Lab Tab */}
            {activeTab === 'spectroscopy' && (
              <div className="space-y-8">
                {selectedPlanet ? (
                  <>
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 shadow-xl">
                      <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                          <Zap className="w-8 h-8 text-yellow-400" />
                          Advanced Spectroscopy Laboratory
                        </h2>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-300">{selectedPlanet.name}</div>
                          <div className="text-sm text-gray-300">Target Analysis</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                            <div className="text-sm text-blue-200 mb-2 flex items-center gap-2">
                              <Telescope className="w-4 h-4" />
                              Primary Observatory: <span className="text-blue-100 font-semibold">{telescopes[selectedTelescope]?.name}</span>
                            </div>
                            <div className="text-xs text-blue-300 flex items-center gap-4">
                              <span>Type: {telescopes[selectedTelescope]?.type}</span>
                              <span>•</span>
                              <span>Wavelengths: {telescopes[selectedTelescope]?.wavelengths}</span>
                              <span>•</span>
                              <span>Efficiency: {telescopes[selectedTelescope]?.efficiency?.toFixed(1)}%</span>
                            </div>
                          </div>
                          
                          <div className="h-96">
                            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                              <Signal className="w-5 h-5 text-purple-400" />
                              Atmospheric Absorption Spectrum
                            </h4>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={spectroscopyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                                <XAxis
                                  dataKey="wavelength"
                                  stroke="#fff"
                                  fontSize={12}
                                  label={{ 
                                    value: 'Wavelength (nm)', 
                                    position: 'insideBottom', 
                                    offset: -10, 
                                    style: { textAnchor: 'middle', fill: '#fff', fontSize: '12px' } 
                                  }}
                                />
                                <YAxis
                                  stroke="#fff"
                                  fontSize={12}
                                  label={{ 
                                    value: 'Relative Flux', 
                                    angle: -90, 
                                    position: 'insideLeft', 
                                    style: { textAnchor: 'middle', fill: '#fff', fontSize: '12px' } 
                                  }}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: 'rgba(0,0,0,0.9)',
                                    border: '1px solid #444',
                                    borderRadius: '8px',
                                    color: '#fff'
                                  }}
                                  formatter={(value, name) => [
                                    name === 'flux' ? value.toFixed(4) : value.toFixed(1),
                                    name === 'flux' ? 'Flux' : name === 'snr' ? 'S/N Ratio' : 'Response'
                                  ]}
                                  labelFormatter={(label) => `${label} nm`}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="flux"
                                  stroke="#8b5cf6"
                                  strokeWidth={2}
                                  dot={false}
                                  name="flux"
                                />
                                <Line
                                  type="monotone"
                                  dataKey="snr"
                                  stroke="#06b6d4"
                                  strokeWidth={1}
                                  strokeOpacity={0.7}
                                  dot={false}
                                  name="snr"
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                                <span className="text-green-300 font-semibold">Signal Quality</span>
                              </div>
                              <div className="text-2xl font-bold text-green-300">
                                {(spectroscopyData.reduce((sum, d) => sum + d.snr, 0) / spectroscopyData.length).toFixed(1)}
                              </div>
                              <div className="text-xs text-green-200">Average S/N Ratio</div>
                            </div>
                            
                            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                              <div className="flex items-center gap-2 mb-2">
                                <Camera className="w-5 h-5 text-blue-400" />
                                <span className="text-blue-300 font-semibold">Coverage</span>
                              </div>
                              <div className="text-2xl font-bold text-blue-300">
                                {spectroscopyData.length}
                              </div>
                              <div className="text-xs text-blue-200">Spectral Points</div>
                            </div>
                            
                            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                              <div className="flex items-center gap-2 mb-2">
                                <Atom className="w-5 h-5 text-purple-400" />
                                <span className="text-purple-300 font-semibold">Features</span>
                              </div>
                              <div className="text-2xl font-bold text-purple-300">
                                {spectroscopyData.filter(d => d.atmospheric_absorption).length}
                              </div>
                              <div className="text-xs text-purple-200">Absorption Lines</div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="bg-white/5 rounded-xl p-6 border border-white/20">
                            <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                              <Microscope className="w-5 h-5 text-yellow-400" />
                              Analysis Summary
                            </h4>
                            <div className="space-y-4 text-sm">
                              <div className="p-3 rounded-lg bg-white/5">
                                <span className="text-gray-400 block mb-1">Primary Atmosphere</span>
                                <div className="text-purple-300 font-semibold">{selectedPlanet.atmosphere}</div>
                              </div>
                              <div className="p-3 rounded-lg bg-white/5">
                                <span className="text-gray-400 block mb-1">Transit Depth</span>
                                <div className="text-blue-300 font-semibold">{selectedPlanet.transit_depth}</div>
                              </div>
                              <div className="p-3 rounded-lg bg-white/5">
                                <span className="text-gray-400 block mb-1">Host Star Magnitude</span>
                                <div className="text-yellow-300 font-semibold">{selectedPlanet.stellar_magnitude}</div>
                              </div>
                              <div className="p-3 rounded-lg bg-white/5">
                                <span className="text-gray-400 block mb-1">Observation Time</span>
                                <div className="text-green-300 font-semibold">
                                  {Math.floor(parseFloat(selectedPlanet.transit_depth) * 10000)} minutes
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white/5 rounded-xl p-6 border border-white/20">
                            <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                              <Brain className="w-5 h-5 text-purple-400" />
                              Atmospheric Profile
                            </h4>
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={atmosphericProfile}>
                                  <PolarGrid stroke="#ffffff30" />
                                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#fff', fontSize: 12 }} />
                                  <PolarRadiusAxis tick={{ fill: '#fff', fontSize: 10 }} tickCount={4} />
                                  <RechartsRadar
                                    name="Confidence %"
                                    dataKey="A"
                                    stroke="#8b5cf6"
                                    fill="#8b5cf6"
                                    fillOpacity={0.3}
                                    strokeWidth={2}
                                  />
                                </RadarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          <div className="bg-white/5 rounded-xl p-6 border border-white/20">
                            <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                              <Camera className="w-5 h-5 text-green-400" />
                              Observation Log
                            </h4>
                            <div className="space-y-3 text-xs max-h-32 overflow-y-auto">
                              {Array.from({length: 8}, (_, i) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded bg-white/5">
                                  <span className="text-gray-400">
                                    {new Date(Date.now() - i * 3600000).toLocaleDateString()}
                                  </span>
                                  <span className="text-green-300 font-medium">
                                    {(Math.random() * 3 + 1).toFixed(1)}h
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {selectedPlanet.atmosphere !== 'Unknown' && (
                        <div className="mt-8 p-6 bg-gradient-to-r from-purple-500/20 to-blue-500/10 rounded-xl border border-purple-500/30">
                          <div className="flex items-center gap-3 mb-3">
                            <Brain className="w-6 h-6 text-purple-400" />
                            <span className="text-purple-200 font-bold text-lg">AI Spectroscopic Analysis</span>
                          </div>
                          <div className="text-sm text-white leading-relaxed">
                            High-confidence detection of <span className="text-purple-300 font-semibold">{selectedPlanet.atmosphere}</span> absorption signatures at multiple wavelengths. 
                            Observatory efficiency with <span className="text-blue-300 font-semibold">{telescopes[selectedTelescope]?.name}</span>: {telescopes[selectedTelescope]?.efficiency?.toFixed(1)}% optimal for this spectral range.
                            <br/><br/>
                            <span className="text-yellow-300 font-semibold">Recommendation:</span> Continue high-resolution spectroscopic monitoring for atmospheric dynamics and potential biosignature detection. 
                            Consider coordinated multi-telescope campaign for isotope ratio analysis.
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-16 text-center">
                    <Zap className="w-24 h-24 text-gray-400 mx-auto mb-6 opacity-50" />
                    <h3 className="text-2xl font-bold text-gray-300 mb-4">Select Target for Analysis</h3>
                    <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
                      Choose an exoplanet from the catalog to begin advanced spectroscopic analysis and atmospheric characterization
                    </p>
                    <button 
                      onClick={() => setActiveTab('catalog')}
                      className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-200"
                    >
                      Browse Exoplanet Catalog
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* AI Mission Control Tab */}
            {activeTab === 'ai-insights' && (
              <div className="space-y-8">
                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 shadow-xl">
                  <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                    <Brain className="w-8 h-8 text-purple-400" />
                    AI Mission Control Center
                    {aiProcessing && <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />}
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/10 rounded-xl p-6 border border-green-500/30">
                      <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-green-400" />
                        AI Predictions & Forecasts
                      </h4>
                      <div className="space-y-3 text-sm text-gray-200">
                        <div className="flex items-center justify-between p-2 rounded bg-white/10">
                          <span>Next major discovery:</span>
                          <span className="text-green-300 font-bold">{Math.floor(Math.random() * 30 + 15)} days</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-white/10">
                          <span>JWST queue targets:</span>
                          <span className="text-blue-300 font-bold">{Math.floor(Math.random() * 50 + 20)}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-white/10">
                          <span>Habitable candidates:</span>
                          <span className="text-yellow-300 font-bold">{Math.floor(Math.random() * 15 + 5)}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-white/10">
                          <span>Optimal windows:</span>
                          <span className="text-purple-300 font-bold">{Math.floor(Math.random() * 100 + 50)}</span>
                        </div>
                        <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                          <div className="text-xs text-green-200 mb-1">Confidence Level</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-700 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{width: '87%'}}></div>
                            </div>
                            <span className="text-green-300 font-bold text-sm">87%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/10 rounded-xl p-6 border border-blue-500/30">
                      <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                        <Settings className="w-6 h-6 text-blue-400" />
                        Research Optimization
                      </h4>
                      <div className="space-y-3 text-sm text-gray-200">
                        <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
                          <div className="font-semibold text-blue-300 mb-1">Priority Focus</div>
                          <div>K-dwarf systems within 100 light-years</div>
                        </div>
                        <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
                          <div className="font-semibold text-blue-300 mb-1">Current Queue</div>
                          <div>Atmospheric characterization pipeline</div>
                        </div>
                        <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
                          <div className="font-semibold text-blue-300 mb-1">Analysis Priority</div>
                          <div>Transit timing variation detection</div>
                        </div>
                        <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
                          <div className="font-semibold text-blue-300 mb-1">ML Pipeline</div>
                          <div>Planet validation accuracy: 94.2%</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-yellow-500/20 to-orange-600/10 rounded-xl p-6 border border-yellow-500/30">
                      <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-yellow-400" />
                        Network Performance
                      </h4>
                      <div className="space-y-3 text-sm text-gray-200">
                        <div className="flex items-center justify-between p-2 rounded bg-white/10">
                          <span>Overall efficiency:</span>
                          <span className="text-green-300 font-bold">{(Math.random() * 15 + 85).toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-white/10">
                          <span>Processing lag:</span>
                          <span className="text-yellow-300 font-bold">{(Math.random() * 2 + 1).toFixed(1)}h</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-white/10">
                          <span>Next maintenance:</span>
                          <span className="text-blue-300 font-bold">{Math.floor(Math.random() * 7 + 1)} days</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-white/10">
                          <span>AI model accuracy:</span>
                          <span className="text-purple-300 font-bold">{(Math.random() * 5 + 94).toFixed(1)}%</span>
                        </div>
                        <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                          <div className="text-xs text-yellow-200 mb-1">System Health</div>
                          <div className="text-yellow-300 font-bold">All systems operational</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Model Performance Metrics */}
                  <div className="bg-white/5 rounded-xl p-6 border border-white/20 mb-8">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                      <Cpu className="w-7 h-7 text-purple-400" />
                      AI Model Performance Dashboard
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                        <div className="text-4xl font-bold text-green-400 mb-2">{(Math.random() * 5 + 94).toFixed(1)}%</div>
                        <div className="text-green-200 font-semibold mb-1">Detection Accuracy</div>
                        <div className="text-xs text-green-300">False positive rate: 2.1%</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                        <div className="text-4xl font-bold text-blue-400 mb-2">{(Math.random() * 10 + 85).toFixed(1)}%</div>
                        <div className="text-blue-200 font-semibold mb-1">Classification Precision</div>
                        <div className="text-xs text-blue-300">Multi-class accuracy</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                        <div className="text-4xl font-bold text-purple-400 mb-2">{(Math.random() * 0.5 + 0.3).toFixed(2)}s</div>
                        <div className="text-purple-200 font-semibold mb-1">Processing Speed</div>
                        <div className="text-xs text-purple-300">Per observation</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                        <div className="text-4xl font-bold text-yellow-400 mb-2">{Math.floor(Math.random() * 1000 + 5000)}</div>
                        <div className="text-yellow-200 font-semibold mb-1">Daily Predictions</div>
                        <div className="text-xs text-yellow-300">Automated analysis</div>
                      </div>
                    </div>
                  </div>

                  {/* Real-time AI Insights */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white/5 rounded-xl p-6 border border-white/20">
                      <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Brain className="w-6 h-6 text-purple-400" />
                        Live AI Recommendations
                      </h4>
                      <div className="space-y-4">
                        {[
                          {
                            priority: 'High',
                            action: 'Schedule JWST follow-up for TRAPPIST-1e atmospheric analysis',
                            confidence: 92,
                            urgency: 'Within 48 hours'
                          },
                          {
                            priority: 'Medium',
                            action: 'Coordinate ground-based photometry for Kepler-442b transit',
                            confidence: 78,
                            urgency: 'Next week'
                          },
                          {
                            priority: 'High',
                            action: 'Investigate potential biosignature in K2-18b spectrum',
                            confidence: 85,
                            urgency: 'Immediate'
                          },
                          {
                            priority: 'Low',
                            action: 'Update orbital parameters for HD 40307g system',
                            confidence: 67,
                            urgency: 'Next month'
                          }
                        ].map((rec, index) => (
                          <div key={index} className={`p-4 rounded-lg border ${
                            rec.priority === 'High' ? 'bg-red-500/10 border-red-500/30' :
                            rec.priority === 'Medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
                            'bg-blue-500/10 border-blue-500/30'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                rec.priority === 'High' ? 'bg-red-500/20 text-red-300' :
                                rec.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                                'bg-blue-500/20 text-blue-300'
                              }`}>
                                {rec.priority} Priority
                              </span>
                              <span className="text-gray-400 text-xs">{rec.confidence}% confidence</span>
                            </div>
                            <div className="text-white text-sm mb-2">{rec.action}</div>
                            <div className="text-gray-400 text-xs">Timeline: {rec.urgency}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-6 border border-white/20">
                      <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-green-400" />
                        Discovery Probability Matrix
                      </h4>
                      <div className="space-y-4">
                        {[
                          { target: 'TOI-715 System', probability: 0.87, type: 'Terrestrial Planet' },
                          { target: 'LP 890-9 System', probability: 0.73, type: 'Super Earth' },
                          { target: 'GJ 1002 System', probability: 0.69, type: 'Habitable Zone' },
                          { target: 'Wolf 1069 System', probability: 0.54, type: 'Rocky Planet' },
                          { target: 'Ross 508 System', probability: 0.41, type: 'Sub-Neptune' }
                        ].map((target, index) => (
                          <div key={index} className="p-4 rounded-lg bg-white/5 border border-white/10">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white font-semibold">{target.target}</span>
                              <span className="text-purple-300 font-bold">{(target.probability * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-gray-400 text-sm">{target.type}</span>
                              <div className="w-24 bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-purple-500 to-green-500 h-2 rounded-full"
                                  style={{ width: `${target.probability * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mission Planner Tab */}
            {activeTab === 'mission-planner' && (
              <div className="space-y-8">
                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 shadow-xl">
                  <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                    <Target className="w-8 h-8 text-orange-400" />
                    Mission Planning & Coordination Hub
                  </h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Mission Queue */}
                    <div className="lg:col-span-2">
                      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <Clock className="w-6 h-6 text-blue-400" />
                        Active Mission Queue
                      </h3>
                      <div className="space-y-4">
                        {[
                          {
                            mission: 'JWST Atmospheric Survey - TRAPPIST-1 System',
                            telescope: 'jwst',
                            duration: '12 hours',
                            priority: 'Critical',
                            status: 'In Progress',
                            completion: 65,
                            startTime: '2025-09-14 22:00 UTC'
                          },
                          {
                            mission: 'Kepler-442b Transit Photometry Campaign',
                            telescope: 'hubble',
                            duration: '8 hours',
                            priority: 'High',
                            status: 'Scheduled',
                            completion: 0,
                            startTime: '2025-09-16 14:30 UTC'
                          },
                          {
                            mission: 'K2-18b Follow-up Spectroscopy',
                            telescope: 'jwst',
                            duration: '15 hours',
                            priority: 'High',
                            status: 'Planning',
                            completion: 0,
                            startTime: '2025-09-18 08:15 UTC'
                          },
                          {
                            mission: 'Proxima Centauri b Radial Velocity Study',
                            telescope: 'ground',
                            duration: '72 hours',
                            priority: 'Medium',
                            status: 'Approved',
                            completion: 0,
                            startTime: '2025-09-20 00:00 UTC'
                          }
                        ].map((mission, index) => (
                          <div key={index} className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                            mission.status === 'In Progress' ? 'bg-green-500/10 border-green-500/40' :
                            mission.status === 'Scheduled' ? 'bg-blue-500/10 border-blue-500/40' :
                            mission.status === 'Planning' ? 'bg-yellow-500/10 border-yellow-500/40' :
                            'bg-purple-500/10 border-purple-500/40'
                          }`}>
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-bold text-white text-lg">{mission.mission}</h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                mission.priority === 'Critical' ? 'bg-red-500/20 text-red-300 animate-pulse' :
                                mission.priority === 'High' ? 'bg-orange-500/20 text-orange-300' :
                                'bg-blue-500/20 text-blue-300'
                              }`}>
                                {mission.priority}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                              <div>
                                <span className="text-gray-400 block mb-1">Observatory</span>
                                <span className="text-white font-semibold">
                                  {mission.telescope === 'ground' ? 'Ground Network' : telescopes[mission.telescope]?.name.split(' ')[0]}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400 block mb-1">Duration</span>
                                <span className="text-white font-semibold">{mission.duration}</span>
                              </div>
                              <div>
                                <span className="text-gray-400 block mb-1">Status</span>
                                <span className={`font-semibold ${
                                  mission.status === 'In Progress' ? 'text-green-300' :
                                  mission.status === 'Scheduled' ? 'text-blue-300' :
                                  mission.status === 'Planning' ? 'text-yellow-300' :
                                  'text-purple-300'}
                                }`}>
                                  {mission.status}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400 block mb-1">Start Time</span>
                                <span className="text-white font-semibold text-xs">{mission.startTime}</span>
                              </div>
                            </div>

                            {mission.status === 'In Progress' && (
                              <div className="mt-4">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-gray-300 text-sm">Progress</span>
                                  <span className="text-green-300 font-bold">{mission.completion}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-3">
                                  <div 
                                    className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-1000"
                                    style={{ width: `${mission.completion}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mission Control Panel */}
                    <div className="space-y-6">
                      <div className="bg-white/5 rounded-xl p-6 border border-white/20">
                        <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                          <Settings className="w-5 h-5 text-purple-400" />
                          Mission Control
                        </h4>
                        <div className="space-y-4">
                          <button className="w-full p-3 bg-green-600/20 hover:bg-green-600/30 border border-green-500/40 rounded-lg text-green-300 font-semibold transition-all duration-200">
                            Start Emergency Observation
                          </button>
                          <button className="w-full p-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 rounded-lg text-blue-300 font-semibold transition-all duration-200">
                            Schedule New Mission
                          </button>
                          <button className="w-full p-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 rounded-lg text-purple-300 font-semibold transition-all duration-200">
                            Coordinate Multi-Telescope
                          </button>
                          <button className="w-full p-3 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/40 rounded-lg text-yellow-300 font-semibold transition-all duration-200">
                            Generate Target Report
                          </button>
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-xl p-6 border border-white/20">
                        <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                          <Layers className="w-5 h-5 text-blue-400" />
                          Resource Allocation
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-300 text-sm">JWST Schedule</span>
                              <span className="text-blue-300 font-bold">78% utilized</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{width: '78%'}}/>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-300 text-sm">Hubble Schedule</span>
                              <span className="text-green-300 font-bold">45% utilized</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{width: '45%'}}/>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-300 text-sm">Ground Network</span>
                              <span className="text-purple-300 font-bold">92% utilized</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div className="bg-purple-500 h-2 rounded-full" style={{width: '92%'}}/>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-300 text-sm">Data Processing</span>
                              <span className="text-yellow-300 font-bold">63% capacity</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div className="bg-yellow-500 h-2 rounded-full" style={{width: '63%'}}/>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-xl p-6 border border-white/20">
                        <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                          Mission Alerts
                        </h4>
                        <div className="space-y-3 text-sm">
                          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                            <div className="text-red-300 font-semibold mb-1">High Priority</div>
                            <div className="text-red-200">Weather delay for ground observations</div>
                          </div>
                          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                            <div className="text-yellow-300 font-semibold mb-1">Medium Priority</div>
                            <div className="text-yellow-200">JWST calibration scheduled</div>
                          </div>
                          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                            <div className="text-blue-300 font-semibold mb-1">Info</div>
                            <div className="text-blue-200">New target approved for observation</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExoplanetFinder;
