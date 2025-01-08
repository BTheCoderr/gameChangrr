import React, { useState } from 'react';
import {
  Box,
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
  IconButton,
  Collapse,
  Chip
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const COLORS = {
  high: '#ff6b6b',
  medium: '#ffd93d',
  low: '#6c757d'
};

const LeadRow = ({ lead }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{lead.name}</TableCell>
        <TableCell>
          <Chip
            label={lead.priority}
            color={
              lead.priority === 'High' ? 'error' :
              lead.priority === 'Medium' ? 'warning' : 'default'
            }
            size="small"
          />
        </TableCell>
        <TableCell>{lead.score}</TableCell>
        <TableCell>{lead.potentialValue}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Lead Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Property Details</Typography>
                  <Typography variant="body2">Size: {lead.propertySize} sqft</Typography>
                  <Typography variant="body2">Type: {lead.propertyType}</Typography>
                  <Typography variant="body2">Current Bill: ${lead.currentBill}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Contact Information</Typography>
                  <Typography variant="body2">Email: {lead.email}</Typography>
                  <Typography variant="body2">Phone: {lead.phone}</Typography>
                  <Typography variant="body2">Best Time: {lead.bestContactTime}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Notes</Typography>
                  <Typography variant="body2">{lead.notes}</Typography>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const LeadPriorityDashboard = ({ leads = [] }) => {
  const priorityData = leads.reduce((acc, lead) => {
    const priority = lead.priority.toLowerCase();
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(priorityData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Lead Priority Distribution
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[entry.name.toLowerCase()]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [
                      `${value} leads`,
                      `${name} Priority`
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <TableContainer component={Paper} sx={{ maxHeight: 400, overflow: 'auto' }}>
              <Table stickyHeader aria-label="leads table">
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell>Name</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Potential Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leads.map((lead) => (
                    <LeadRow key={lead.id} lead={lead} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                * Lead priority is calculated based on multiple factors including
                property size, energy usage, and financial qualification.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default LeadPriorityDashboard; 