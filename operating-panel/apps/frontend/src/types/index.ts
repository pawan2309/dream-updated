// Common interfaces for the betting platform

export interface TableRow {
  id?: string | number;
  key?: string;
  [key: string]: React.ReactNode;
}

export interface Bet extends TableRow {
  id: string;
  date: string;
  client: string;
  market: number;
  roundId: string;
  player: string;
  winner: string;
  stack: number;
  rate: number;
  profit: number;
  loss: number;
  pnl: number;
  ip: string;
  color: 'green' | 'red';
}

export interface Casino extends TableRow {
  id: number;
  name: string;
  shortName: string;
  betStatus: 'ON' | 'OFF';
  minStake: number;
  maxStake: number;
}

export interface MatkaGame extends TableRow {
  id: number;
  name: string;
  gameType: string;
  status: 'active' | 'inactive';
}

export interface User extends TableRow {
  id: string;
  username: string;
  balance: number;
  status: 'active' | 'suspended';
}

export interface WebsiteSettings {
  siteName: string;
  logo: string;
  theme: 'light' | 'dark';
  maintenance: boolean;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export interface FilterProps {
  startDate?: string;
  endDate?: string;
  username?: string;
  roundId?: string;
  casinoName?: string;
  casinoType?: string;
  showList?: number;
} 