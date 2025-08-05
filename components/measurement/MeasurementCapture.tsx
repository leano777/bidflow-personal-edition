import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface Measurement {
  id: string;
  type: 'linear' | 'square' | 'cubic' | 'count';
  value: number;
  unit: string;
  description: string;
  photos: string[];
  location?: { lat: number; lng: number };
  timestamp: Date;
}

interface MeasurementCaptureProps {
  onBack: () => void;
  onDataCollected: (data: any) => void;
}

const MeasurementCapture: React.FC<MeasurementCaptureProps> = ({ onBack, onDataCollected }) => {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [currentMeasurement, setCurrentMeasurement] = useState<Partial<Measurement>>({});

  const handleAddMeasurement = () => {
    if (currentMeasurement.value && currentMeasurement.type) {
      setMeasurements([ ...measurements,
        { ...currentMeasurement, id: Date.now().toString(), timestamp: new Date() } as Measurement
      ]);
      setCurrentMeasurement({});
    }
  };

  return (
    <div className="measurement-capture">
      <h1>Capture Measurements</h1>
      <label>Type:</label>
      <select 
        value={currentMeasurement.type}
        onChange={e => setCurrentMeasurement({ ...currentMeasurement, type: e.target.value as 'linear' | 'square' | 'cubic' | 'count' })}>
        <option value="linear">Linear Feet</option>
        <option value="square">Square Feet</option>
        <option value="cubic">Cubic Feet/Yards</option>
        <option value="count">Count</option>
      </select>
      <label>Value:</label>
      <Input 
        type="number" 
        value={currentMeasurement.value || ''}
        onChange={e => setCurrentMeasurement({ ...currentMeasurement, value: Number(e.target.value) })}
      />
      <Button onClick={handleAddMeasurement}>Add Measurement</Button>

      <div className="measurement-list">
        <h2>Measurements</h2>
        {measurements.map(m => (
          <div key={m.id}>
            {m.type}: {m.value} {m.unit}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MeasurementCapture;
