export type SchemaProperty = {
  position: number;
  [key: string]: any;
};

export type Schema = {
  sections?: Array<{
    sectionHeader?: string;
    properties?: Record<string, SchemaProperty>;
    position: number;
  }>;
  properties?: Record<string, SchemaProperty>;
  [key: string]: any;
};
