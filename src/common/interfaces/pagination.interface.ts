interface PaginationMeta {
  total: number;
  page: number;
  lastPage: number;
}

export interface PaginationResult<T> {
  data: T[];
  meta: PaginationMeta;
}
