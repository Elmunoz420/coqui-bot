import React from 'react';
import coquiFrog from '../assets/coqui-headset-frog.png';

function CoquiIcon({ className = '' }) {
  return <img className={`coqui-icon ${className}`} src={coquiFrog} alt="" />;
}

export default CoquiIcon;
