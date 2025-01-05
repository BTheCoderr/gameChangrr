import React, { useState } from 'react';
import Map from './Map';
import Toggle from './Toggle';

function ParentComponent() {
  const [showCityBoundaries, setShowCityBoundaries] = useState(false);

  return (
    <>
      <Toggle 
        checked={showCityBoundaries}
        onChange={() => setShowCityBoundaries(!showCityBoundaries)}
      />
      
      <Map showCityBoundaries={showCityBoundaries} />
    </>
  );
}

export default ParentComponent; 