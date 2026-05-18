import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAppContext } from '../context/AppContext';

// Resolver problema de ícones default do Leaflet via CDN para evitar perdas de svg path
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapaEquipes() {
  const { obras, funcionarios } = useAppContext();
  
  // Tentar encontrar o centro aproximado (ex: centralizando no primeiro marcador)
  const defaultCenter = obras.length > 0 ? obras[0].location : [-23.5505, -46.6333];

  return (
    <div style={{ height: '400px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <MapContainer center={defaultCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {obras.map(obra => {
          // Achar todos os funcionarios alocados nesta obra (simulado)
          const equipeLoko = funcionarios.filter(f => f.obraAtualId === obra.id);
          
          if(!obra.location) return null;

          return (
            <Marker key={obra.id} position={obra.location}>
              <Popup>
                <div style={{ padding: '0px', minWidth: '160px' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold' }}>{obra.nome}</h4>
                  <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#666' }}>{obra.endereco}</p>
                  
                  <div style={{ borderTop: '1px solid #eee', paddingTop: '8px' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: 'bold' }}>Equipe Alocada ({equipeLoko.length}):</p>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px' }}>
                       {equipeLoko.map(f => (
                         <li key={f.id}>{f.nome} ({f.funcao})</li>
                       ))}
                       {equipeLoko.length === 0 && <li style={{color: 'red'}}>Sem equipe</li>}
                    </ul>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
