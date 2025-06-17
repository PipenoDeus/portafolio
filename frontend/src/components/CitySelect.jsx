import React from 'react';
import { Select, MenuItem, InputLabel, FormControl } from '@mui/material';

const CitySelect = ({ cities, city, onChange }) => (
  <FormControl fullWidth required>
    <InputLabel id="city-label">Ciudad</InputLabel>
    <Select
      value={city}
      label="Ciudad"
      onChange={onChange}
      variant="standard"
    >
      {Array.isArray(cities) && cities.map((c) => (
        <MenuItem key={c.id} value={c.id}>
          {c.nombre}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

export default CitySelect;
