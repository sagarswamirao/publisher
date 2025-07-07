export type Widget = {
  id: string;
  queryResultString: string;
  title?: string;
  layout: {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    static?: boolean;
  };
  locked: boolean;
};
