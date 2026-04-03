import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { ProductRepository } from '@/services/repositories/ProductRepository';
import { RecipeRepository } from '@/services/repositories/RecipeRepository';
import { useAuth } from './AuthContext';
import { useBusiness } from './BusinessContext';
import type { Product, Recipe } from '@/types';

interface InventoryContextType {
  products: Product[];
  isLoading: boolean;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; message: string }>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<{ success: boolean; message: string }>;
  deleteProduct: (id: string) => Promise<{ success: boolean; message: string }>;
  refreshProducts: () => Promise<void>;
  getProductByBarcode: (barcode: string) => Product | undefined;
  // Bakery Extensions
  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'businessId'>) => Promise<{ success: boolean; message: string }>;
  produceBatch: (recipeId: string, batches: number, locationId: string, staffId: string) => Promise<{ success: boolean; message: string }>;
  refreshRecipes: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { businessId } = useBusiness();
  const repository = new ProductRepository();
  const recipeRepository = new RecipeRepository();

  const [recipes, setRecipes] = useState<Recipe[]>([]);

  const refreshProducts = useCallback(async () => {
    if (!user || !businessId) return;
    setIsLoading(true);
    try {
      const data = await repository.getAll(businessId);
      setProducts(data);
    } catch (err) {
      console.error('Error refreshing products:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, businessId]);

  const refreshRecipes = useCallback(async () => {
    if (!user || !businessId) return;
    try {
      const data = await recipeRepository.getAll(businessId);
      setRecipes(data);
    } catch (err) {
      console.error('Error refreshing recipes:', err);
    }
  }, [user, businessId]);

  useEffect(() => {
    refreshProducts();
    refreshRecipes();
  }, [refreshProducts, refreshRecipes]);

  const addProduct = useCallback(async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user || !businessId) return { success: false, message: 'No auth' };
    try {
      const newProduct = await repository.create(businessId, product);
      setProducts(prev => [...prev, newProduct]);
      return { success: true, message: 'Producto añadido' };
    } catch (err) {
      return { success: false, message: 'Error al añadir producto' };
    }
  }, [user, businessId]);

  const updateProduct = useCallback(async (id: string, product: Partial<Product>) => {
    try {
      await repository.update(id, product);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...product } : p));
      return { success: true, message: 'Producto actualizado' };
    } catch (err) {
      return { success: false, message: 'Error al actualizar producto' };
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      await repository.delete(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      return { success: true, message: 'Producto eliminado' };
    } catch (err) {
      return { success: false, message: 'Error al eliminar producto' };
    }
  }, []);

  const addRecipe = useCallback(async (recipe: Omit<Recipe, 'id' | 'createdAt' | 'businessId'>) => {
    if (!user || !businessId) return { success: false, message: 'No auth' };
    try {
      const newRecipe = await recipeRepository.createRecipe(businessId, { ...recipe, businessId });
      setRecipes(prev => [...prev, newRecipe]);
      return { success: true, message: 'Receta guardada' };
    } catch (err) {
      return { success: false, message: 'Error al guardar receta' };
    }
  }, [user, businessId]);

  const produceBatch = useCallback(async (recipeId: string, batches: number, locationId: string, staffId: string) => {
    try {
      await recipeRepository.produceBatch(recipeId, batches, locationId, staffId);
      await refreshProducts(); // Refresh stock after production
      return { success: true, message: 'Producción completada' };
    } catch (err) {
      return { success: false, message: 'Error en la producción' };
    }
  }, [refreshProducts]);

  const getProductByBarcode = useCallback((barcode: string) => {
    return products.find(p => p.barcode === barcode);
  }, [products]);

  const value = useMemo(() => ({
    products, isLoading, addProduct, updateProduct, deleteProduct, refreshProducts, getProductByBarcode,
    recipes, addRecipe, produceBatch, refreshRecipes
  }), [products, isLoading, addProduct, updateProduct, deleteProduct, refreshProducts, getProductByBarcode, recipes, addRecipe, produceBatch, refreshRecipes]);

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) throw new Error('useInventory must be used within an InventoryProvider');
  return context;
};
