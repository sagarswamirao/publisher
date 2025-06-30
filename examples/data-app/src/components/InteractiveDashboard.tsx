import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  Stack, 
  Tabs, 
  Tab, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Paper,
  CircularProgress,
  Alert,
  SelectChangeEvent
} from "@mui/material";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { PackageProvider, QueryResult } from "@malloy-publisher/sdk";
import Header from "./Header";

// Custom hook to fetch raw query data using the existing API
const useRawQueryData = ({ modelPath, query }: { modelPath: string; query: string }) => {
  const [data, setData] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isError, setIsError] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const encodedQuery = encodeURIComponent(query);
        const response = await fetch(`http://localhost:4000/api/v0/projects/malloy-samples/packages/faa/queryResults/${modelPath}?query=${encodedQuery}`);
        
        if (!response.ok) throw new Error('Failed to fetch');
        
        const result = await response.json();
        const parsed = typeof result.result === 'string' ? JSON.parse(result.result) : result;
        
        // Convert the Malloy result format to simple objects
        const arrayData = parsed.data?.array_value || [];
        const processedData = arrayData.map((row: any) => {
          const record = row.record_value || [];
          const obj: any = {};
          
          // Map field values based on schema
          record.forEach((cell: any, index: number) => {
            const fieldName = parsed.schema?.fields[index]?.name;
            if (fieldName) {
              if (cell.string_value !== undefined) {
                obj[fieldName] = cell.string_value;
              } else if (cell.number_value !== undefined) {
                obj[fieldName] = cell.number_value;
              }
            }
          });
          
          return obj;
        });
        
        setData(processedData);
      } catch (error) {
        setIsError(true);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (query) {
      fetchData();
    }
  }, [modelPath, query]);

  return { data, isLoading, isError };
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981', 
  accent: '#F59E0B',
  purple: '#8B5CF6',
  pink: '#EC4899',
  facilityTypes: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280']
};

export default function InteractiveDashboard({
  selectedView,
}: {
  selectedView: "malloySamples" | "singleEmbed" | "dynamicDashboard" | "interactive";
}) {
  const [tabValue, setTabValue] = useState(0);
  const [stateFilter, setStateFilter] = useState('');
  const [manufacturerFilter, setManufacturerFilter] = useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Store scroll position to prevent auto-scroll to top
  const scrollPositionRef = React.useRef(0);

  React.useEffect(() => {
    const handleScroll = () => {
      scrollPositionRef.current = window.pageYOffset;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTabChange = React.useCallback((event: React.SyntheticEvent, newValue: number) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Store current scroll position
    const currentScroll = window.pageYOffset;
    scrollPositionRef.current = currentScroll;
    
    setTabValue(newValue);
    
    // Prevent scroll to top by restoring position immediately
    requestAnimationFrame(() => {
      window.scrollTo(0, currentScroll);
    });
  }, []);

  const handleStateFilterChange = React.useCallback((event: SelectChangeEvent) => {
    event.preventDefault();
    
    // Store current scroll position
    const currentScroll = window.pageYOffset;
    scrollPositionRef.current = currentScroll;
    
    setStateFilter(event.target.value);
    
    // Prevent scroll to top by restoring position immediately
    requestAnimationFrame(() => {
      window.scrollTo(0, currentScroll);
    });
  }, []);

  const handleManufacturerFilterChange = React.useCallback((event: SelectChangeEvent) => {
    event.preventDefault();
    
    // Store current scroll position
    const currentScroll = window.pageYOffset;
    scrollPositionRef.current = currentScroll;
    
    setManufacturerFilter(event.target.value);
    
    // Prevent scroll to top by restoring position immediately
    requestAnimationFrame(() => {
      window.scrollTo(0, currentScroll);
    });
  }, []);

  // Build filtered query with where clause appended
  const buildFilteredQuery = (baseQuery: string) => {
    const conditions = [];
    if (stateFilter) {
      conditions.push(`origin.state ~ '${stateFilter}'`);
    }
    if (manufacturerFilter) {
      conditions.push(`aircraft.aircraft_models.manufacturer ~ '${manufacturerFilter}'`);
    }
    
    if (conditions.length > 0) {
      return `${baseQuery} + { where: ${conditions.join(' and ')} }`;
    }
    return baseQuery;
  };

  // Raw data queries using the SDK hook
  const carriersQuery = buildFilteredQuery(`run: flights -> top_carriers`);
  const manufacturersQuery = buildFilteredQuery(`run: flights -> by_manufacturer`);
  const originsQuery = buildFilteredQuery(`run: flights -> top_origins`);
  const mekkoQuery = buildFilteredQuery(`run: flights -> {
    group_by: 
      carriers.nickname
      aircraft.aircraft_models.model
    aggregate: flight_count
  }`);

  // Use the custom hook to fetch raw data
  const { data: carriersData, isLoading: carriersLoading, isError: carriersError } = useRawQueryData({
    modelPath: 'flights.malloy',
    query: carriersQuery,
  });

  const { data: manufacturersData, isLoading: manufacturersLoading, isError: manufacturersError } = useRawQueryData({
    modelPath: 'flights.malloy',
    query: manufacturersQuery,
  });

  const { data: originsData, isLoading: originsLoading, isError: originsError } = useRawQueryData({
    modelPath: 'flights.malloy',
    query: originsQuery,
  });

  const { data: mekkoData, isLoading: mekkoLoading, isError: mekkoError } = useRawQueryData({
    modelPath: 'flights.malloy',
    query: mekkoQuery,
  });

  // Process data for charts
  const processedCarriersData = carriersData?.map((item: any, index: number) => ({
    name: item.nickname || 'Unknown',
    count: item.flight_count || 0,
    fill: COLORS.facilityTypes[index % COLORS.facilityTypes.length]
  })) || [];

  const processedManufacturersData = manufacturersData?.map((item: any, index: number) => ({
    name: item.manufacturer || 'Unknown',
    value: item.flight_count || 0,
    fill: COLORS.facilityTypes[index % COLORS.facilityTypes.length]
  })) || [];

  const processedOriginsData = originsData?.map((item: any, index: number) => ({
    name: item.name || 'Unknown',
    count: item.flight_count || 0,
    fill: COLORS.facilityTypes[index % COLORS.facilityTypes.length]
  })) || [];

  // Process mekko data for the chart
  const processedMekkoData = React.useMemo(() => {
    if (!mekkoData || mekkoData.length === 0) return [];
    
    // Group by carrier and create mekko structure
    const carrierGroups: { [key: string]: any[] } = {};
    mekkoData.forEach((item: any) => {
      const carrier = item.nickname || 'Unknown';
      if (!carrierGroups[carrier]) {
        carrierGroups[carrier] = [];
      }
      carrierGroups[carrier].push({
        aircraft_model: item.model || 'Unknown',
        flight_count: item.flight_count || 0
      });
    });

    // Convert to mekko format
    const result: any[] = [];
    Object.entries(carrierGroups).forEach(([carrier, aircraftTypes]) => {
      const carrierTotal = aircraftTypes.reduce((sum, f) => sum + (f.flight_count || 0), 0);
      aircraftTypes.forEach((aircraft, index) => {
        result.push({
          carrier,
          aircraft_model: aircraft.aircraft_model || 'Unknown',
          count: aircraft.flight_count || 0,
          carrierTotal,
          percentage: ((aircraft.flight_count || 0) / carrierTotal) * 100,
          fill: COLORS.facilityTypes[index % COLORS.facilityTypes.length]
        });
      });
    });
    
    return result.slice(0, 50); // Limit for performance
  }, [mekkoData]);

  const tabs = [
    { id: 0, label: 'Top Carriers' },
    { id: 1, label: 'Aircraft Manufacturers' },
    { id: 2, label: 'Top Origins' },
    { id: 3, label: 'Mekko Chart' }
  ];

  // Calculate scale to fit content in viewport
  const [scale, setScale] = React.useState(1);
  
  React.useEffect(() => {
    const calculateScale = () => {
      const viewportHeight = window.innerHeight;
      const headerHeight = 100; // Approximate header height
      const availableHeight = viewportHeight - headerHeight;
      const contentHeight = 900; // Approximate content height (reduced)
      
      if (contentHeight > availableHeight) {
        const newScale = Math.max(0.7, Math.min(availableHeight / contentHeight, 1));
        setScale(newScale);
      } else {
        setScale(1);
      }
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  return (
    <Stack spacing={2} sx={{ mt: { xs: 8, md: 0 }, mb: 8 }}>
      <Header selectedView={selectedView} />
      
      <Box 
        ref={containerRef} 
        sx={{ 
          maxWidth: 1400, 
          mx: 'auto', 
          p: 3,
          scrollBehavior: 'smooth',
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          width: scale < 1 ? `${100 / scale}%` : '100%',
        }}
      >
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 'bold', 
            mb: 2, 
            background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Flight Data Explorer - Interactive Dashboard
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, color: '#6b7280' }}>
          Modern visualizations of flight data with interactive filtering by state and aircraft manufacturer
        </Typography>

        {        /* Statistics Cards */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <Card sx={{ 
            p: 3, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
            flex: 1
          }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>86K+</Typography>
            <Typography variant="body2">Total Flights</Typography>
          </Card>
          <Card sx={{ 
            p: 3, 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            boxShadow: '0 8px 32px rgba(240, 147, 251, 0.3)',
            flex: 1
          }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>15</Typography>
            <Typography variant="body2">Major Carriers</Typography>
          </Card>
          <Card sx={{ 
            p: 3, 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            boxShadow: '0 8px 32px rgba(79, 172, 254, 0.3)',
            flex: 1
          }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>50</Typography>
            <Typography variant="body2">States Covered</Typography>
          </Card>
        </Stack>

        {/* Interactive Filters - Above Tabs */}
        <Card sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Interactive Filters
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: '#6b7280' }}>
            Apply filters to modify all charts below. Filters append "+ where:" clauses to the queries.
          </Typography>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Origin State</InputLabel>
              <Select
                value={stateFilter}
                label="Filter by Origin State"
                onChange={handleStateFilterChange}
              >
                <MenuItem value="">All States</MenuItem>
                <MenuItem value="CA">California</MenuItem>
                <MenuItem value="TX">Texas</MenuItem>
                <MenuItem value="FL">Florida</MenuItem>
                <MenuItem value="NY">New York</MenuItem>
                <MenuItem value="IL">Illinois</MenuItem>
                <MenuItem value="CO">Colorado</MenuItem>
                <MenuItem value="WA">Washington</MenuItem>
                <MenuItem value="AZ">Arizona</MenuItem>
                <MenuItem value="NV">Nevada</MenuItem>
                <MenuItem value="OR">Oregon</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Aircraft Manufacturer</InputLabel>
              <Select
                value={manufacturerFilter}
                label="Filter by Aircraft Manufacturer"
                onChange={handleManufacturerFilterChange}
              >
                <MenuItem value="">All Manufacturers</MenuItem>
                <MenuItem value="BOEING">Boeing</MenuItem>
                <MenuItem value="AIRBUS">Airbus</MenuItem>
                <MenuItem value="EMBRAER">Embraer</MenuItem>
                <MenuItem value="BOMBARDIER">Bombardier</MenuItem>
                <MenuItem value="MCDONNELL DOUGLAS">McDonnell Douglas</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {(stateFilter || manufacturerFilter) && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Active Filters:</strong>{' '}
                {stateFilter && `Origin State = "${stateFilter}"`}
                {stateFilter && manufacturerFilter && ' AND '}
                {manufacturerFilter && `Aircraft Manufacturer = "${manufacturerFilter}"`}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                Query modification: + where: {[
                  stateFilter && `origin.state ~ '${stateFilter}'`,
                  manufacturerFilter && `aircraft.aircraft_models.manufacturer ~ '${manufacturerFilter}'`
                ].filter(Boolean).join(' and ')}
              </Typography>
            </Alert>
          )}
        </Card>

        {/* Tab Navigation */}
        <Paper sx={{ mb: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            {tabs.map((tab) => (
              <Tab key={tab.id} label={tab.label} />
            ))}
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <TabPanel value={tabValue} index={0}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
              Top Airlines by Flight Count
            </Typography>
            {carriersLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : carriersError ? (
              <Alert severity="error">Failed to load carriers data</Alert>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={processedCarriersData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    formatter={(value) => [value.toLocaleString(), 'Flights']}
                  />
                  <Bar dataKey="count" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
              Aircraft Manufacturers by Flight Count
            </Typography>
            {manufacturersLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : manufacturersError ? (
              <Alert severity="error">Failed to load manufacturers data</Alert>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={processedManufacturersData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    formatter={(value) => [value.toLocaleString(), 'Flights']}
                  />
                  <Bar dataKey="value" fill={COLORS.secondary} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
              Top Origin Airports by Flight Count
            </Typography>
            {originsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : originsError ? (
              <Alert severity="error">Failed to load origins data</Alert>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={processedOriginsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={150}
                    dataKey="count"
                    label={({ name, count }) => `${name}: ${count}`}
                  >
                    {processedOriginsData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value.toLocaleString(), 'Flights']} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
              Mekko Chart: Flight Count by Carrier and Aircraft Type
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: '#6b7280' }}>
              Width represents carrier size, height represents aircraft model distribution within each carrier
            </Typography>
            {mekkoLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : mekkoError ? (
              <Alert severity="error">Failed to load mekko data</Alert>
            ) : (
              <Box sx={{ width: '100%', height: 400, border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
                <svg viewBox="0 0 1200 600" style={{ width: '100%', height: '100%' }}>
                  {(() => {
                    if (!processedMekkoData.length) return null;
                    
                    // Group by carrier for mekko layout
                    const carrierGroups: { [key: string]: any[] } = {};
                    processedMekkoData.forEach(item => {
                      if (!carrierGroups[item.carrier]) {
                        carrierGroups[item.carrier] = [];
                      }
                      carrierGroups[item.carrier].push(item);
                    });

                    const carriers = Object.keys(carrierGroups).slice(0, 8); // Top 8 carriers
                    const totalWidth = 1100;
                    const totalHeight = 500;
                    let xOffset = 50;

                    return carriers.map((carrier, carrierIndex) => {
                      const carrierData = carrierGroups[carrier];
                      const carrierTotal = carrierData[0]?.carrierTotal || 1;
                      const maxCarrierTotal = Math.max(...Object.values(carrierGroups).map(g => g[0]?.carrierTotal || 0));
                      const carrierWidth = Math.max(80, (carrierTotal / maxCarrierTotal) * (totalWidth / carriers.length));
                      
                      let yOffset = 50;
                      
                      const segments = carrierData.map((aircraft, aircraftIndex) => {
                        const segmentHeight = (aircraft.count / carrierTotal) * totalHeight;
                        
                        const segment = (
                          <g key={`${carrierIndex}-${aircraftIndex}`}>
                            <rect
                              x={xOffset}
                              y={yOffset}
                              width={carrierWidth}
                              height={segmentHeight}
                              fill={aircraft.fill}
                              stroke="#fff"
                              strokeWidth="1"
                              opacity="0.8"
                            />
                            {segmentHeight > 25 && carrierWidth > 50 && (
                              <text
                                x={xOffset + carrierWidth / 2}
                                y={yOffset + segmentHeight / 2}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="white"
                                fontSize="10"
                                fontWeight="bold"
                              >
                                {aircraft.aircraft_model}
                              </text>
                            )}
                          </g>
                        );
                        
                        yOffset += segmentHeight;
                        return segment;
                      });
                      
                      // Carrier label
                      const carrierLabel = (
                        <text
                          key={`carrier-label-${carrierIndex}`}
                          x={xOffset + carrierWidth / 2}
                          y={30}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#374151"
                          fontSize="12"
                          fontWeight="bold"
                        >
                          {carrier}
                        </text>
                      );
                      
                      xOffset += carrierWidth + 20;
                      
                      return [carrierLabel, ...segments];
                    });
                  })()}
                </svg>
              </Box>
            )}
          </Card>
        </TabPanel>

      </Box>
    </Stack>
  );
} 