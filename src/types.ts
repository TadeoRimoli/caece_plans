export type SubjectStatus = 0 | 1 | 2 | 3 | 4

export interface Subject {
  name: string
  year: number
  quadrimester: number
  prerequisites: number[]
  status: SubjectStatus,
  code: number,
  extraConditions?: string,

}

export interface NodePosition {
  x: number
  y: number
}

export interface Career {
  id: number
  name: string
  subjects: Subject[],
  plan: string,
  icon:string,
  year: number

}
