import React from 'react';
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';

export type DateRange = {
  start: Date;
  end: Date;
};

interface DashboardFilterProps {
  onDateRangeChange: (range: DateRange) => void;
}

export const DashboardFilter: React.FC<DashboardFilterProps> = ({ onDateRangeChange }) => {
  const [selectedRange, setSelectedRange] = React.useState('today');
  const [customDateRange, setCustomDateRange] = React.useState<DateRange>({
    start: new Date(),
    end: new Date()
  });
  const [customDialogOpen, setCustomDialogOpen] = React.useState(false);

  const handleRangeChange = (value: string) => {
    setSelectedRange(value);
    if (value === 'custom') {
      setCustomDialogOpen(true);
      return;
    }

    const today = new Date();
    let range: DateRange;

    switch (value) {
      case 'today':
        range = {
          start: startOfDay(today),
          end: endOfDay(today)
        };
        break;
      case 'week':
        range = {
          start: startOfWeek(today),
          end: endOfWeek(today)
        };
        break;
      case 'month':
        range = {
          start: startOfMonth(today),
          end: endOfMonth(today)
        };
        break;
      case 'quarter':
        range = {
          start: startOfQuarter(today),
          end: endOfQuarter(today)
        };
        break;
      case 'year':
        range = {
          start: startOfYear(today),
          end: endOfYear(today)
        };
        break;
      default:
        range = {
          start: startOfDay(today),
          end: endOfDay(today)
        };
    }

    onDateRangeChange(range);
  };

  const handleCustomDateSubmit = () => {
    onDateRangeChange(customDateRange);
    setCustomDialogOpen(false);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel>Date Range</InputLabel>
        <Select
          value={selectedRange}
          label="Date Range"
          onChange={(e) => handleRangeChange(e.target.value)}
        >
          <MenuItem value="today">Today</MenuItem>
          <MenuItem value="week">This Week</MenuItem>
          <MenuItem value="month">This Month</MenuItem>
          <MenuItem value="quarter">This Quarter</MenuItem>
          <MenuItem value="year">This Year</MenuItem>
          <MenuItem value="custom">Custom Range</MenuItem>
        </Select>
      </FormControl>

      <Dialog open={customDialogOpen} onClose={() => setCustomDialogOpen(false)}>
        <DialogTitle>Select Date Range</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <DatePicker
                label="Start Date"
                value={customDateRange.start}
                onChange={(newValue) => newValue && setCustomDateRange(prev => ({ ...prev, start: newValue }))}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <DatePicker
                label="End Date"
                value={customDateRange.end}
                onChange={(newValue) => newValue && setCustomDateRange(prev => ({ ...prev, end: newValue }))}
                slotProps={{ textField: { fullWidth: true } }}
                minDate={customDateRange.start}
              />
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCustomDateSubmit} variant="contained">Apply</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardFilter;