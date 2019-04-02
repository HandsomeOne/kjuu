export interface DeepArray<T> extends Array<Deep<T>> {}
export type Deep<T> = T | DeepArray<T>
