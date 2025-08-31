export interface IPaginationRequestParams {
  limit?: number;
  page?: number;
  return_till_current_page?: boolean;
  sort_order?: 'asc' | 'desc';
  sort_by?: string;
}
