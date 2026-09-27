export type Block =
  | { type: 'html'; html: string; page?: number }
  | { type: 'figure'; id: string; src: string; width: number; height: number }
  | { type: 'exercise'; setId: string }

export interface SectionDoc {
  id: string
  title: string
  blocks: Block[]
}

export interface ChapterDoc {
  id: string
  number: number | null
  title: string
  kicker: string
  sections: SectionDoc[]
}

export interface SectionMeta {
  id: string
  title: string
}

export interface ChapterMeta {
  id: string
  number: number | null
  title: string
  kicker: string
  sections: SectionMeta[]
}
