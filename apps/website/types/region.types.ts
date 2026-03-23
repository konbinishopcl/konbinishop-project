export interface Region {
  id: number
  attributes: {
    name: string
    communes: {
      data: Commune[]
    }
  }
}

export interface Commune {
  id: number
  attributes: {
    name: string
    region: {
      data: Region
    }
  }
}

export interface RegionResponse {
  data: Region[]
  meta: {
    pagination: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}
