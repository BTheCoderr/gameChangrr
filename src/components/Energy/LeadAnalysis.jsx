import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
         ScatterChart, Scatter, PieChart, Pie, Cell } from 'recharts';
import { mockSolarPermits, ENERGY_PERFORMANCE } from '../../data/mockSolarData';

const COLORS = ['#F44336', '#FF9800', '#4CAF50'];

const LeadAnalysis = () => {
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [activeTab, setActiveTab] = useState(0);

  const leads = useMemo(() => {
    const allLeads = mockSolarPermits.features.map(feature => ({
      ...feature.properties,
      coordinates: feature.geometry.coordinates
    }));

    return priorityFilter === 'all'
      ? allLeads
      : allLeads.filter(lead => lead.energyPerformance.leadPriority === priorityFilter);
  }, [priorityFilter]);

  const statistics = useMemo(() => {
    return {
      totalLeads: leads.length,
      highPriority: leads.filter(l => l.energyPerformance.leadPriority === 'high').length,
      averageMonthlyBill: leads.reduce((sum, lead) => sum + lead.energyPerformance.monthlyBill, 0) / leads.length,
      averageEnergyScore: leads.reduce((sum, lead) => sum + lead.energyPerformance.energyScore, 0) / leads.length,
      potentialSavings: leads.reduce((sum, lead) => sum + lead.energyPerformance.potentialSavings.annual, 0),
      totalSystemSize: leads.reduce((sum, lead) => sum + lead.energyPerformance.solarAnalysis.recommendedSystemSize, 0),
      averageROI: leads.reduce((sum, lead) => sum + lead.energyPerformance.solarAnalysis.roi, 0) / leads.length,
      totalCarbonOffset: leads.reduce((sum, lead) => sum + lead.energyPerformance.solarAnalysis.carbonOffset, 0)
    };
  }, [leads]);

  const chartData = useMemo(() => {
    // ROI vs System Size scatter data
    const scatterData = leads.map(lead => ({
      systemSize: lead.energyPerformance.solarAnalysis.recommendedSystemSize,
      roi: lead.energyPerformance.solarAnalysis.roi,
      payback: lead.energyPerformance.solarAnalysis.paybackPeriod
    }));

    // Priority distribution pie data
    const priorityData = [
      { name: 'High', value: leads.filter(l => l.energyPerformance.leadPriority === 'high').length },
      { name: 'Medium', value: leads.filter(l => l.energyPerformance.leadPriority === 'medium').length },
      { name: 'Low', value: leads.filter(l => l.energyPerformance.leadPriority === 'low').length }
    ];

    // System size distribution
    const sizeRanges = leads.reduce((acc, lead) => {
      const size = lead.energyPerformance.solarAnalysis.recommendedSystemSize;
      const range = `${Math.floor(size/2)*2}-${Math.floor(size/2)*2+2}kW`;
      acc[range] = (acc[range] || 0) + 1;
      return acc;
    }, {});

    const sizeDistribution = Object.entries(sizeRanges).map(([range, count]) => ({
      range,
      count
    }));

    return { scatterData, priorityData, sizeDistribution };
  }, [leads]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <div>
      <Grid container spacing={3}>
        {/* Summary Statistics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Lead Summary</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <Typography variant="subtitle2">Total Leads</Typography>
                  <Typography variant="h4">{statistics.totalLeads}</Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="subtitle2">Average ROI</Typography>
                  <Typography variant="h4">{statistics.averageROI.toFixed(1)}%</Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="subtitle2">Total System Size</Typography>
                  <Typography variant="h4">{statistics.totalSystemSize.toFixed(1)} kW</Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="subtitle2">Carbon Offset</Typography>
                  <Typography variant="h4">{statistics.totalCarbonOffset.toFixed(1)} tons/yr</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Charts */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                <Tab label="ROI Analysis" />
                <Tab label="System Sizes" />
                <Tab label="Lead Distribution" />
              </Tabs>
              
              <Box sx={{ mt: 2 }}>
                {activeTab === 0 && (
                  <ScatterChart width={600} height={300} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid />
                    <XAxis type="number" dataKey="systemSize" name="System Size" unit="kW" />
                    <YAxis type="number" dataKey="roi" name="ROI" unit="%" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Properties" data={chartData.scatterData} fill="#8884d8" />
                  </ScatterChart>
                )}
                
                {activeTab === 1 && (
                  <BarChart width={600} height={300} data={chartData.sizeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#82ca9d" name="Number of Properties" />
                  </BarChart>
                )}
                
                {activeTab === 2 && (
                  <PieChart width={400} height={300}>
                    <Pie
                      data={chartData.priorityData}
                      cx={200}
                      cy={150}
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.priorityData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Lead Table */}
        <Grid item xs={12}>
          <Box sx={{ mb: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Priority Filter</InputLabel>
              <Select
                value={priorityFilter}
                label="Priority Filter"
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <MenuItem value="all">All Leads</MenuItem>
                <MenuItem value="high">High Priority</MenuItem>
                <MenuItem value="medium">Medium Priority</MenuItem>
                <MenuItem value="low">Low Priority</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Address</TableCell>
                  <TableCell>System Size</TableCell>
                  <TableCell>ROI</TableCell>
                  <TableCell>Payback Period</TableCell>
                  <TableCell>Monthly Payment</TableCell>
                  <TableCell>Carbon Offset</TableCell>
                  <TableCell>Priority</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>{lead.address}</TableCell>
                    <TableCell>{lead.energyPerformance.solarAnalysis.recommendedSystemSize.toFixed(1)} kW</TableCell>
                    <TableCell>{lead.energyPerformance.solarAnalysis.roi.toFixed(1)}%</TableCell>
                    <TableCell>{lead.energyPerformance.solarAnalysis.paybackPeriod.toFixed(1)} years</TableCell>
                    <TableCell>${lead.energyPerformance.solarAnalysis.monthlyPayment}</TableCell>
                    <TableCell>{lead.energyPerformance.solarAnalysis.carbonOffset} tons/yr</TableCell>
                    <TableCell>
                      <Chip
                        label={lead.energyPerformance.leadPriority.toUpperCase()}
                        color={getPriorityColor(lead.energyPerformance.leadPriority)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </div>
  );
};

export default LeadAnalysis; 