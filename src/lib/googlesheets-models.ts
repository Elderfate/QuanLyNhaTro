import connectGoogleSheets from './googlesheets';
import { compare } from 'bcryptjs';
import type { DatabaseDocument, QueryFilter, AggregationPipeline } from '@/types/googlesheets';

// Adapter để tương thích với MongoDB models
export class GoogleSheetsModel {
  private collectionName: string;
  private gsdb = connectGoogleSheets();

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  // MongoDB compatible methods
  async find(query?: QueryFilter) {
    return await this.gsdb.find(this.collectionName, query);
  }

  async findOne(query?: QueryFilter) {
    const results = await this.gsdb.find(this.collectionName, query);
    return results[0] || null;
  }

  async findById(id: string) {
    return await this.gsdb.findById(this.collectionName, id);
  }

  async create(data: DatabaseDocument) {
    return await this.gsdb.create(this.collectionName, data);
  }

  async findByIdAndUpdate(id: string, update: Partial<DatabaseDocument>) {
    return await this.gsdb.updateById(this.collectionName, id, update);
  }

  async findByIdAndDelete(id: string) {
    const result = await this.gsdb.deleteById(this.collectionName, id);
    return result ? { _id: id } : null;
  }

  async updateOne(query: QueryFilter, update: Partial<DatabaseDocument>) {
    const items = await this.gsdb.find(this.collectionName, query);
    if (items.length > 0 && items[0]._id) {
      return await this.gsdb.updateById(this.collectionName, items[0]._id, update);
    }
    return null;
  }

  async deleteOne(query: QueryFilter) {
    const items = await this.gsdb.find(this.collectionName, query);
    if (items.length > 0 && items[0]._id) {
      return await this.gsdb.deleteById(this.collectionName, items[0]._id);
    }
    return false;
  }

  async aggregate(pipeline: AggregationPipeline[]) {
    return await this.gsdb.aggregate(this.collectionName, pipeline);
  }

  async countDocuments(query?: QueryFilter) {
    const results = await this.gsdb.find(this.collectionName, query);
    return results.length;
  }

  // Additional helper method for password comparison (for NguoiDung model)
  async comparePassword(plainPassword: string, hashedPassword: string) {
    return await compare(plainPassword, hashedPassword);
  }
}

// Factory function to create models
export function createGoogleSheetsModel(collectionName: string) {
  return new GoogleSheetsModel(collectionName);
}

// Pre-defined models equivalent to MongoDB models
export const NguoiDungGS = createGoogleSheetsModel('NguoiDung');
export const ToaNhaGS = createGoogleSheetsModel('ToaNha');
export const PhongGS = createGoogleSheetsModel('Phong');
export const KhachThueGS = createGoogleSheetsModel('KhachThue');
export const HopDongGS = createGoogleSheetsModel('HopDong');
export const ChiSoDienNuocGS = createGoogleSheetsModel('ChiSoDienNuoc');
export const HoaDonGS = createGoogleSheetsModel('HoaDon');
export const ThanhToanGS = createGoogleSheetsModel('ThanhToan');
export const SuCoGS = createGoogleSheetsModel('SuCo');
export const ThongBaoGS = createGoogleSheetsModel('ThongBao');