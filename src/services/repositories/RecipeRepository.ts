import { supabase } from '@/lib/supabase';
import { BaseRepository } from './BaseRepository';
import type { Recipe } from '@/types';

export class RecipeRepository extends BaseRepository {
  async getAll(businessId: string): Promise<Recipe[]> {
    const { data, error } = await (supabase
      .from('recipes')
      .select(`
        *,
        ingredients:recipe_ingredients(
          ingredient_product_id,
          quantity_required
        )
      `)
      .eq('business_id', businessId) as any);

    if (error) throw error;
    
    return (data || []).map((r: any) => ({
      id: r.id,
      businessId: r.business_id,
      finalProductId: r.final_product_id,
      yieldQuantity: r.yield_quantity,
      notes: r.notes,
      createdAt: r.created_at,
      ingredients: (r.ingredients || []).map((i: any) => ({
        ingredientProductId: i.ingredient_product_id,
        quantityRequired: i.quantity_required
      }))
    }));
  }

  async createRecipe(businessId: string, recipe: Omit<Recipe, 'id' | 'createdAt'>): Promise<Recipe> {
    const { data: recipeData, error: recipeError } = await (supabase
      .from('recipes')
      .insert({
        business_id: businessId,
        final_product_id: recipe.finalProductId,
        yield_quantity: recipe.yieldQuantity,
        notes: recipe.notes
      })
      .select()
      .single() as any);

    if (recipeError) throw recipeError;

    const ingredientPayload = recipe.ingredients.map(ing => ({
      recipe_id: recipeData.id,
      ingredient_product_id: ing.ingredientProductId,
      quantity_required: ing.quantityRequired
    }));

    const { error: ingError } = await (supabase
      .from('recipe_ingredients')
      .insert(ingredientPayload) as any);

    if (ingError) throw ingError;

    return {
      ...recipe,
      id: recipeData.id,
      createdAt: recipeData.created_at
    };
  }

  async produceBatch(recipeId: string, batches: number, locationId: string, staffId: string): Promise<{ success: boolean; message: string }> {
    const { error } = await (supabase.rpc('produce_batch', {
      p_recipe_id: recipeId,
      p_batches: batches,
      p_location_id: locationId,
      p_staff_id: staffId
    }) as any);

    if (error) throw error;
    return { success: true, message: 'Lote producido con éxito' };
  }
}
