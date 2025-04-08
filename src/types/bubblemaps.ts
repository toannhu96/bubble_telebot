export interface BubblemapsNode {
  address: string;
  amount: number;
  is_contract: boolean;
  name?: string;
  percentage: number;
  transaction_count: number;
  transfer_X721_count: number | null;
  transfer_count: number;
}

export interface BubblemapsLink {
  backward: number;
  forward: number;
  source: number;
  target: number;
}

export interface TokenLink {
  address: string;
  decimals?: number;
  name: string;
  symbol: string;
  links: BubblemapsLink[];
}

export interface BubblemapsResponse {
  version: number;
  chain: string;
  token_address: string;
  dt_update: string;
  full_name: string;
  symbol: string;
  is_X721: boolean;
  metadata: {
    max_amount: number;
    min_amount: number;
  };
  nodes: BubblemapsNode[];
  links: BubblemapsLink[];
  token_links: TokenLink[];
}
