import { Indicator, CityConfig } from './types';

export const CITIES: CityConfig[] = [
  { key: 'fuzhou', name: '福州公司' },
  { key: 'xiamen', name: '厦门公司' },
  { key: 'putian', name: '莆田公司' },
  { key: 'quanzhou', name: '泉州公司' },
  { key: 'zhangzhou', name: '漳州公司' },
  { key: 'longyan', name: '龙岩公司' },
  { key: 'sanming', name: '三明公司' },
  { key: 'nanping', name: '南平公司' },
  { key: 'ningde', name: '宁德公司' }
];

export const INITIAL_INDICATORS: Indicator[] = [
  {
    id: 'ind-1',
    name: '数字化发展指数',
    nodeType: 'parent',
    status: '',
    description: '',
    scores: {
      fuzhou: { fillerValue: 97.6374, approverValue: 97.6374, rank: 2 },
      xiamen: { fillerValue: 97.6224, approverValue: 97.6224, rank: 4 },
      putian: { fillerValue: 96.6434, approverValue: 96.6434, rank: 5 },
      quanzhou: { fillerValue: 98.0732, approverValue: 98.0732, rank: 1 },
      zhangzhou: { fillerValue: 97.6238, approverValue: 97.6238, rank: 3 },
      longyan: { fillerValue: 96.0414, approverValue: 96.0414, rank: 8 },
      sanming: { fillerValue: 96.6174, approverValue: 96.6174, rank: 6 },
      nanping: { fillerValue: 96.3615, approverValue: 96.3615, rank: 7 },
      ningde: { fillerValue: 95.1140, approverValue: 95.1140, rank: 9 }
    }
  },
  {
    id: 'ind-2',
    name: '数字化专业工作合规指数',
    nodeType: 'parent',
    status: '',
    description: '数据已核对',
    scores: {
      fuzhou: { fillerValue: 97.0475, approverValue: 97.0475, rank: 4 },
      xiamen: { fillerValue: 97.6585, approverValue: 97.6585, rank: 5 },
      putian: { fillerValue: 97.2978, approverValue: 97.2978, rank: 7 },
      quanzhou: { fillerValue: 98.0727, approverValue: 98.0727, rank: 3 },
      zhangzhou: { fillerValue: 96.2097, approverValue: 96.2097, rank: 8 },
      longyan: { fillerValue: 98.1623, approverValue: 98.1623, rank: 2 },
      sanming: { fillerValue: 98.2715, approverValue: 98.2715, rank: 1 },
      nanping: { fillerValue: 95.8552, approverValue: 95.8552, rank: 6 },
      ningde: { fillerValue: 97.1360, approverValue: 97.1360, rank: 9 }
    }
  },
  {
    id: 'ind-3',
    name: '架构合规率',
    nodeType: 'parent',
    status: '',
    description: '',
    scores: {
      fuzhou: { fillerValue: 92.5690, approverValue: 92.5690, rank: 5 },
      xiamen: { fillerValue: 93.9040, approverValue: 93.9040, rank: 4 },
      putian: { fillerValue: 91.7840, approverValue: 91.7840, rank: 8 },
      quanzhou: { fillerValue: 95.4690, approverValue: 95.4690, rank: 3 },
      zhangzhou: { fillerValue: 90.1260, approverValue: 90.1260, rank: 9 },
      longyan: { fillerValue: 95.9030, approverValue: 95.9030, rank: 2 },
      sanming: { fillerValue: 96.3940, approverValue: 96.3940, rank: 1 },
      nanping: { fillerValue: 86.7890, approverValue: 86.7890, rank: 10 },
      ningde: { fillerValue: 92.3460, approverValue: 92.3460, rank: 6 }
    }
  },
  {
    id: 'ind-4',
    name: '监督问题数',
    nodeType: 'leaf',
    status: 'rejected',
    description: '数据异常，部分地市缺附件！',
    scores: {
      fuzhou: { fillerValue: 93.6800, approverValue: 93.6800, rank: 2 },
      xiamen: { fillerValue: 89.9600, approverValue: 89.9600, rank: 5 },
      putian: { fillerValue: 87.3600, approverValue: 87.3600, rank: 6 },
      quanzhou: { fillerValue: 92.5700, approverValue: 92.5700, rank: 4 },
      zhangzhou: { fillerValue: 83.6400, approverValue: 83.6400, rank: 8 },
      longyan: { fillerValue: 93.3100, approverValue: 93.3100, rank: 3 },
      sanming: { fillerValue: 94.0500, approverValue: 94.0500, rank: 1 },
      nanping: { fillerValue: 78.0700, approverValue: 78.0700, rank: 9 },
      ningde: { fillerValue: 87.3600, approverValue: 87.3600, rank: 7 }
    }
  },
  {
    id: 'ind-5',
    name: '问题整改进度',
    nodeType: 'leaf',
    status: 'pending',
    description: '正在核查中',
    scores: {
      fuzhou: { fillerValue: 88.2300, approverValue: 88.2300, rank: 9 },
      xiamen: { fillerValue: 100.0000, approverValue: 100.0000, rank: 1 },
      putian: { fillerValue: 98.0600, approverValue: 98.0600, rank: 8 },
      quanzhou: { fillerValue: 100.0000, approverValue: 100.0000, rank: 1 },
      zhangzhou: { fillerValue: 100.0000, approverValue: 100.0000, rank: 1 },
      longyan: { fillerValue: 100.0000, approverValue: 100.0000, rank: 1 },
      sanming: { fillerValue: 100.0000, approverValue: 100.0000, rank: 1 },
      nanping: { fillerValue: 100.0000, approverValue: 100.0000, rank: 1 },
      ningde: { fillerValue: 99.0000, approverValue: 99.0000, rank: 7 }
    }
  },
  {
    id: 'ind-6',
    name: '数字化终端在线率',
    nodeType: 'leaf',
    status: 'pending',
    description: '终端稳定运行',
    scores: {
      fuzhou: { fillerValue: 98.9200, approverValue: 98.9200, rank: 9 },
      xiamen: { fillerValue: 99.2800, approverValue: 99.2800, rank: 6 },
      putian: { fillerValue: 99.5000, approverValue: 99.5000, rank: 2 },
      quanzhou: { fillerValue: 99.2700, approverValue: 99.2700, rank: 7 },
      zhangzhou: { fillerValue: 99.4200, approverValue: 99.4200, rank: 4 },
      longyan: { fillerValue: 99.1700, approverValue: 99.1700, rank: 8 },
      sanming: { fillerValue: 99.6400, approverValue: 99.6400, rank: 1 },
      nanping: { fillerValue: 99.4700, approverValue: 99.4700, rank: 3 },
      ningde: { fillerValue: 99.3000, approverValue: 99.3000, rank: 5 }
    }
  }
];
