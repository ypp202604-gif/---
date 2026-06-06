export interface ScoreDetail {
  fillerValue: number;
  approverValue: number;
  rank: number;
}

export interface CityConfig {
  key: string;
  name: string;
}

export interface Indicator {
  id: string;
  name: string;
  nodeType: 'parent' | 'leaf';
  status: 'pending' | 'approved' | 'rejected' | '';
  description: string;
  scores: Record<string, ScoreDetail>;
}
