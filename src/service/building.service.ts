// src/lib/api/building.service.ts
'use client';

import apiClient from '@/src/lib/api/client';
import {
  Building,
  CreateBuildingData,
  UpdateBuildingData,
  BuildingResponse,
  BuildingsListResponse,
} from '@/src/types/building.types';

export const buildingService = {
  // ==================== GET ALL BUILDINGS ====================
  // GET /api/buildings
  getBuildings: () =>
    apiClient.get<BuildingsListResponse>('/buildings'),

  // ==================== GET SINGLE BUILDING ====================
  // GET /api/buildings/[id]
  getBuilding: (id: string) =>
    apiClient.get<BuildingResponse>(`/buildings/${id}`),

  // ==================== CREATE BUILDING ====================
  // POST /api/buildings
  createBuilding: (data: CreateBuildingData) =>
    apiClient.post<BuildingResponse>('/buildings', data),

  // ==================== UPDATE BUILDING ====================
  // PUT /api/buildings/[id]
  updateBuilding: (id: string, data: UpdateBuildingData) =>
    apiClient.put<BuildingResponse>(`/buildings/${id}`, data),

  // ==================== DELETE BUILDING ====================
  // DELETE /api/buildings/[id]
  deleteBuilding: (id: string) =>
    apiClient.delete<{ success: boolean; message: string }>(`/buildings/${id}`),
};