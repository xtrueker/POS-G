import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { LocationRepository } from '../services/repositories/LocationRepository';
import { useBusiness } from './BusinessContext';
import type { Location } from '@/types';

interface LocationContextType {
  locations: Location[];
  currentLocation: Location | null;
  setCurrentLocation: (location: Location | null) => void;
  addLocation: (location: Partial<Location>) => Promise<{ success: boolean; message: string }>;
  updateLocation: (id: string, location: Partial<Location>) => Promise<{ success: boolean; message: string }>;
  deleteLocation: (id: string) => Promise<{ success: boolean; message: string }>;
  loading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const { businessId } = useBusiness();
  const repo = new LocationRepository();

  useEffect(() => {
    if (businessId) {
      loadLocations();
    }
  }, [businessId]);

  const loadLocations = async () => {
    if (!businessId) return;
    try {
      const data = await repo.getAll(businessId);
      setLocations(data);
      if (data.length > 0 && !currentLocation) {
        setCurrentLocation(data[0]);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const addLocation = async (location: Partial<Location>) => {
    if (!businessId) return { success: false, message: 'No business context' };
    try {
      const newLoc = await repo.save(businessId, { ...location, id: crypto.randomUUID() });
      setLocations(prev => [...prev, newLoc]);
      return { success: true, message: 'Ubicación agregada exitosamente' };
    } catch (error) {
      return { success: false, message: 'Error al agregar ubicación' };
    }
  };

  const updateLocation = async (id: string, location: Partial<Location>) => {
    if (!businessId) return { success: false, message: 'No business context' };
    try {
      const updated = await repo.save(businessId, { ...location, id });
      setLocations(prev => prev.map(l => l.id === id ? updated : l));
      if (currentLocation?.id === id) {
        setCurrentLocation(updated);
      }
      return { success: true, message: 'Ubicación actualizada exitosamente' };
    } catch (error) {
      return { success: false, message: 'Error al actualizar ubicación' };
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      await repo.delete(id);
      setLocations(prev => prev.filter(l => l.id !== id));
      if (currentLocation?.id === id) {
        setCurrentLocation(null);
      }
      return { success: true, message: 'Ubicación eliminada exitosamente' };
    } catch (error) {
      return { success: false, message: 'Error al eliminar ubicación' };
    }
  };

  return (
    <LocationContext.Provider value={{ 
      locations, currentLocation, setCurrentLocation, 
      addLocation, updateLocation, deleteLocation, loading 
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocation must be used within a LocationProvider');
  return context;
};
