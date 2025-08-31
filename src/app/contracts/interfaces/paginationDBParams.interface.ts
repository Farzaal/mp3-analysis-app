export interface IPaginationDBParams {
  limit: number;
  offset: number;
  sort_order?: 'asc' | 'desc';
  sort_by?: string;
}
